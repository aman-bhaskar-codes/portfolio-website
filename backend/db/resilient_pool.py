"""
═══════════════════════════════════════════════════════════
Resilient Connection Pool — ANTIGRAVITY OS v2 (§22.6)
═══════════════════════════════════════════════════════════

PostgreSQL and Redis connection pools with:
  1. Automatic reconnection (exponential backoff)
  2. Connection health monitoring (30s ping)
  3. Query timeout enforcement (5s statement_timeout)
  4. Dynamic pool sizing (min=2, max=20)
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Optional

from backend.config.settings import settings
from backend.reliability.circuit_breaker import (
    CIRCUIT_BREAKERS,
    CircuitOpenError,
)

logger = logging.getLogger("portfolio.db.resilient_pool")


# ═══════════════════════════════════════════════════════════
# RECONNECTION POLICY
# ═══════════════════════════════════════════════════════════

class ReconnectionPolicy:
    """Exponential backoff reconnection with max attempts."""

    def __init__(
        self,
        base_delay: float = 0.1,    # 100ms initial
        max_delay: float = 10.0,    # 10s maximum
        max_attempts: int = 10,
        multiplier: float = 2.0,
    ):
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.max_attempts = max_attempts
        self.multiplier = multiplier

    def get_delay(self, attempt: int) -> float:
        """Compute delay for a given attempt number."""
        delay = self.base_delay * (self.multiplier ** attempt)
        return min(delay, self.max_delay)


# ═══════════════════════════════════════════════════════════
# RESILIENT POSTGRES POOL
# ═══════════════════════════════════════════════════════════

class ResilientPostgresPool:
    """
    Wraps SQLAlchemy async engine with resilience features.

    Usage:
        pool = ResilientPostgresPool()
        await pool.initialize()

        async with pool.acquire() as conn:
            result = await conn.execute(text("SELECT 1"))
    """

    def __init__(self):
        self._engine = None
        self._reconnection_policy = ReconnectionPolicy(
            base_delay=0.1, max_delay=10.0, max_attempts=10
        )
        self._is_healthy = False
        self._health_check_interval = 30.0
        self._health_check_task: Optional[asyncio.Task] = None

    async def initialize(self):
        """Create the SQLAlchemy async engine with resilient settings."""
        from sqlalchemy.ext.asyncio import create_async_engine

        self._engine = create_async_engine(
            settings.DATABASE_URL,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_recycle=settings.DB_POOL_RECYCLE,
            pool_pre_ping=True,  # Auto-detect stale connections
            pool_timeout=10,
            connect_args={
                "server_settings": {
                    "statement_timeout": "5000",  # 5s hard query timeout
                    "lock_timeout": "3000",       # 3s lock timeout
                },
                "command_timeout": 10,
            },
        )
        self._is_healthy = True
        logger.info("PostgreSQL resilient pool initialized")

        # Start background health check
        self._health_check_task = asyncio.create_task(self._health_check_loop())

    async def acquire(self):
        """
        Acquire a connection with circuit breaker protection.

        Raises CircuitOpenError if postgres circuit is OPEN.
        """
        cb = CIRCUIT_BREAKERS.get("postgres")
        if cb and cb.state.value == "open":
            raise CircuitOpenError("postgres")

        if not self._engine:
            await self._reconnect()

        return self._engine.connect()

    async def _reconnect(self):
        """Attempt reconnection with exponential backoff."""
        policy = self._reconnection_policy

        for attempt in range(policy.max_attempts):
            try:
                await self.initialize()
                logger.info(
                    f"PostgreSQL reconnected after {attempt + 1} attempt(s)"
                )
                return
            except Exception as e:
                delay = policy.get_delay(attempt)
                logger.warning(
                    f"PostgreSQL reconnection attempt {attempt + 1}/{policy.max_attempts} "
                    f"failed: {e}. Retrying in {delay:.1f}s"
                )
                await asyncio.sleep(delay)

        logger.error(
            f"PostgreSQL reconnection failed after {policy.max_attempts} attempts"
        )
        self._is_healthy = False

    async def _health_check_loop(self):
        """Background health check every 30 seconds."""
        while True:
            try:
                await asyncio.sleep(self._health_check_interval)
                if self._engine:
                    from sqlalchemy import text
                    async with self._engine.connect() as conn:
                        await conn.execute(text("SELECT 1"))
                    self._is_healthy = True
                else:
                    self._is_healthy = False
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"PostgreSQL health check failed: {e}")
                self._is_healthy = False
                # Attempt reconnection
                await self._reconnect()

    async def shutdown(self):
        """Graceful shutdown."""
        if self._health_check_task:
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass

        if self._engine:
            await self._engine.dispose()
            logger.info("PostgreSQL pool shutdown complete")

    @property
    def is_healthy(self) -> bool:
        return self._is_healthy

    @property
    def engine(self):
        return self._engine


# ═══════════════════════════════════════════════════════════
# RESILIENT REDIS POOL
# ═══════════════════════════════════════════════════════════

class ResilientRedisPool:
    """
    Redis connection pool with auto-reconnection.
    """

    def __init__(self):
        self._client = None
        self._reconnection_policy = ReconnectionPolicy(
            base_delay=0.05, max_delay=5.0, max_attempts=10
        )
        self._is_healthy = False

    async def initialize(self):
        """Create Redis connection."""
        try:
            import redis.asyncio as aioredis

            self._client = aioredis.from_url(
                settings.REDIS_URL,
                socket_timeout=3,
                socket_connect_timeout=3,
                retry_on_timeout=True,
                max_connections=20,
                decode_responses=False,
            )
            pong = await self._client.ping()
            self._is_healthy = pong
            logger.info("Redis resilient pool initialized")
        except Exception as e:
            logger.error(f"Redis initialization failed: {e}")
            self._is_healthy = False

    async def get_client(self):
        """Get Redis client with circuit breaker protection."""
        cb = CIRCUIT_BREAKERS.get("redis")
        if cb and cb.state.value == "open":
            raise CircuitOpenError("redis")

        if not self._client or not self._is_healthy:
            await self._reconnect()

        return self._client

    async def _reconnect(self):
        """Reconnect with backoff."""
        policy = self._reconnection_policy

        for attempt in range(policy.max_attempts):
            try:
                await self.initialize()
                if self._is_healthy:
                    logger.info(f"Redis reconnected after {attempt + 1} attempt(s)")
                    return
            except Exception as e:
                delay = policy.get_delay(attempt)
                logger.warning(
                    f"Redis reconnection attempt {attempt + 1} failed: {e}. "
                    f"Retry in {delay:.1f}s"
                )
                await asyncio.sleep(delay)

        logger.error("Redis reconnection failed after all attempts")
        self._is_healthy = False

    async def shutdown(self):
        """Graceful shutdown."""
        if self._client:
            await self._client.aclose()
            logger.info("Redis pool shutdown complete")

    @property
    def is_healthy(self) -> bool:
        return self._is_healthy


# Singletons
postgres_pool = ResilientPostgresPool()
redis_pool = ResilientRedisPool()

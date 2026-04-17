# backend/db/connections.py
"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Centralized Connection Manager
═══════════════════════════════════════════════════════════

Single point of initialization for all external services.
Called once in main.py lifespan. All modules use get_*() accessors.
"""
import logging
from typing import Optional
import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from qdrant_client import AsyncQdrantClient
from backend.config.settings import settings

logger = logging.getLogger(__name__)

# Singletons
_redis: Optional[aioredis.Redis] = None
_pg_engine = None
_pg_session_factory = None
_qdrant: Optional[AsyncQdrantClient] = None


async def init_connections():
    """Initialize all external connections. Called once at startup."""
    global _redis, _pg_engine, _pg_session_factory, _qdrant

    # Redis
    try:
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            max_connections=50,
            decode_responses=True,
        )
        await _redis.ping()
        logger.info("✅ Redis connected")
    except Exception as e:
        logger.warning(f"⚠️ Redis connection failed: {e}")
        _redis = None

    # PostgreSQL
    try:
        _pg_engine = create_async_engine(
            settings.postgres_dsn,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            echo=settings.DEBUG,
        )
        _pg_session_factory = async_sessionmaker(
            _pg_engine, class_=AsyncSession, expire_on_commit=False
        )
        logger.info("✅ PostgreSQL engine created")
    except Exception as e:
        logger.warning(f"⚠️ PostgreSQL connection failed: {e}")

    # Qdrant
    try:
        _qdrant = AsyncQdrantClient(
            host=settings.qdrant_host,
            port=settings.qdrant_port,
            timeout=30,
        )
        await _qdrant.get_collections()
        logger.info("✅ Qdrant connected")
    except Exception as e:
        logger.warning(f"⚠️ Qdrant connection failed: {e}")
        _qdrant = None


async def close_connections():
    """Close all connections. Called on shutdown."""
    global _redis, _pg_engine, _qdrant
    if _redis:
        await _redis.aclose()
    if _pg_engine:
        await _pg_engine.dispose()
    if _qdrant:
        await _qdrant.close()
    logger.info("Connections closed")


def get_redis() -> aioredis.Redis:
    if not _redis:
        raise RuntimeError("Redis not initialized. Call init_connections() first.")
    return _redis


def get_pg_session() -> async_sessionmaker:
    if not _pg_session_factory:
        raise RuntimeError("PostgreSQL not initialized.")
    return _pg_session_factory


def get_qdrant() -> AsyncQdrantClient:
    if not _qdrant:
        raise RuntimeError("Qdrant not initialized.")
    return _qdrant

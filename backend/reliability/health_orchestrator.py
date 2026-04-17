"""
═══════════════════════════════════════════════════════════
Health Orchestrator — ANTIGRAVITY OS v2 (§22.3)
═══════════════════════════════════════════════════════════

Continuously monitors all system components.
Drives graceful degradation tier selection.
Exposes /api/health for frontend + load balancer + Grafana.

Tier computation (Ollama-only stack):
  Tier 1 (full):    All services up, phi4-mini available
  Tier 2 (medium):  phi4-mini OOM → fall to llama3.2:3b
  Tier 3 (light):   llama3.2 down → fall to qwen2.5:3b
  Tier 4 (static):  All Ollama down → pre-generated Redis FAQ
  Tier 5 (minimal): Redis down → hardcoded HTML responses
"""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx
from pydantic import BaseModel, Field

from backend.config.settings import settings
from backend.reliability.circuit_breaker import (
    get_all_circuit_metrics,
    CIRCUIT_BREAKERS,
    CircuitState,
)

logger = logging.getLogger("portfolio.reliability.health")


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class ServiceStatus(BaseModel):
    """Health status of a single service."""
    name: str
    available: bool
    latency_ms: float = 0.0
    error: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)


class SystemHealth(BaseModel):
    """Full system health snapshot."""
    # Per-service status
    ollama_available: bool = False
    ollama_models: list[str] = Field(default_factory=list)
    qdrant_available: bool = False
    postgres_available: bool = False
    redis_available: bool = False
    github_api_available: bool = False

    # Computed
    degradation_tier: int = 5
    tier_reason: str = ""
    active_model: str = ""

    # Metadata
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    check_duration_ms: float = 0.0
    circuit_breaker_states: list[dict] = Field(default_factory=list)
    services: list[ServiceStatus] = Field(default_factory=list)


# ═══════════════════════════════════════════════════════════
# HEALTH ORCHESTRATOR
# ═══════════════════════════════════════════════════════════

class HealthOrchestrator:
    """
    Parallel health checker with degradation tier computation.

    Check frequency:
      - /api/health endpoint: on demand
      - Background loop: every 30 seconds
      - Critical path: before each LLM call (cached 5s)
    """

    def __init__(self):
        self._last_health: Optional[SystemHealth] = None
        self._last_check_time: float = 0
        self._cache_ttl: float = 5.0  # seconds

    async def get_system_health(self, force: bool = False) -> SystemHealth:
        """
        Get full system health. Cached for 5 seconds to prevent
        health-check storms.
        """
        now = time.monotonic()
        if (
            not force
            and self._last_health
            and (now - self._last_check_time) < self._cache_ttl
        ):
            return self._last_health

        start = time.monotonic()

        # Parallel health checks — never let one slow check block others
        results = await asyncio.gather(
            self._check_ollama(),
            self._check_qdrant(),
            self._check_postgres(),
            self._check_redis(),
            self._check_github_api(),
            return_exceptions=True,
        )

        ollama_status = results[0] if not isinstance(results[0], Exception) else ServiceStatus(name="ollama", available=False, error=str(results[0]))
        qdrant_status = results[1] if not isinstance(results[1], Exception) else ServiceStatus(name="qdrant", available=False, error=str(results[1]))
        postgres_status = results[2] if not isinstance(results[2], Exception) else ServiceStatus(name="postgres", available=False, error=str(results[2]))
        redis_status = results[3] if not isinstance(results[3], Exception) else ServiceStatus(name="redis", available=False, error=str(results[3]))
        github_status = results[4] if not isinstance(results[4], Exception) else ServiceStatus(name="github", available=False, error=str(results[4]))

        # Extract available models
        available_models = ollama_status.details.get("models", []) if ollama_status.available else []

        # Compute degradation tier
        tier, reason, active_model = self._compute_tier(
            ollama_available=ollama_status.available,
            available_models=available_models,
            redis_available=redis_status.available,
        )

        health = SystemHealth(
            ollama_available=ollama_status.available,
            ollama_models=available_models,
            qdrant_available=qdrant_status.available,
            postgres_available=postgres_status.available,
            redis_available=redis_status.available,
            github_api_available=github_status.available,
            degradation_tier=tier,
            tier_reason=reason,
            active_model=active_model,
            check_duration_ms=round((time.monotonic() - start) * 1000, 1),
            circuit_breaker_states=get_all_circuit_metrics(),
            services=[ollama_status, qdrant_status, postgres_status, redis_status, github_status],
        )

        self._last_health = health
        self._last_check_time = time.monotonic()
        return health

    def _compute_tier(
        self,
        ollama_available: bool,
        available_models: list[str],
        redis_available: bool,
    ) -> tuple[int, str, str]:
        """
        Compute degradation tier.

        Returns (tier, reason, active_model)
        """
        # Model preference order (strongest → lightest)
        model_priority = ["phi4-mini:latest", "phi4-mini", "llama3.2:3b", "qwen2.5:3b"]

        if ollama_available and available_models:
            # Find best available model
            for model in model_priority:
                if model in available_models:
                    if model.startswith("phi4-mini"):
                        return 1, "All services operational, phi4-mini available", model
                    elif model == "llama3.2:3b":
                        return 2, "phi4-mini unavailable, using llama3.2:3b", model
                    elif model == "qwen2.5:3b":
                        return 3, "Only qwen2.5:3b available", model

            # Ollama up but none of our expected models
            first_model = available_models[0]
            return 3, f"Using unexpected model: {first_model}", first_model

        # Ollama completely down
        if redis_available:
            return 4, "Ollama unavailable, using Redis FAQ cache", "static_faq"

        return 5, "All AI services unavailable, static HTML fallback", "static"

    # ═══════════════════════════════════════════════════════
    # INDIVIDUAL SERVICE CHECKS
    # ═══════════════════════════════════════════════════════

    async def _check_ollama(self) -> ServiceStatus:
        """Check Ollama + list available models."""
        start = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{settings.OLLAMA_URL}/api/tags")
                latency = (time.monotonic() - start) * 1000

                if resp.status_code == 200:
                    data = resp.json()
                    models = [m["name"] for m in data.get("models", [])]
                    return ServiceStatus(
                        name="ollama",
                        available=True,
                        latency_ms=round(latency, 1),
                        details={"models": models, "model_count": len(models)},
                    )
                return ServiceStatus(
                    name="ollama",
                    available=False,
                    latency_ms=round(latency, 1),
                    error=f"HTTP {resp.status_code}",
                )
        except Exception as e:
            return ServiceStatus(name="ollama", available=False, error=str(e))

    async def _check_qdrant(self) -> ServiceStatus:
        """Check Qdrant vector store."""
        start = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{settings.QDRANT_URL}/healthz")
                latency = (time.monotonic() - start) * 1000
                return ServiceStatus(
                    name="qdrant",
                    available=resp.status_code == 200,
                    latency_ms=round(latency, 1),
                )
        except Exception as e:
            return ServiceStatus(name="qdrant", available=False, error=str(e))

    async def _check_postgres(self) -> ServiceStatus:
        """Check PostgreSQL via SQLAlchemy ping."""
        start = time.monotonic()
        try:
            from backend.db.session import async_engine
            from sqlalchemy import text

            async with async_engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
                latency = (time.monotonic() - start) * 1000
                return ServiceStatus(
                    name="postgres",
                    available=True,
                    latency_ms=round(latency, 1),
                )
        except Exception as e:
            return ServiceStatus(name="postgres", available=False, error=str(e))

    async def _check_redis(self) -> ServiceStatus:
        """Check Redis."""
        start = time.monotonic()
        try:
            import redis.asyncio as aioredis

            client = aioredis.from_url(settings.REDIS_URL, socket_timeout=2)
            pong = await client.ping()
            await client.aclose()
            latency = (time.monotonic() - start) * 1000
            return ServiceStatus(
                name="redis",
                available=pong,
                latency_ms=round(latency, 1),
            )
        except Exception as e:
            return ServiceStatus(name="redis", available=False, error=str(e))

    async def _check_github_api(self) -> ServiceStatus:
        """Check GitHub API rate limit status."""
        start = time.monotonic()
        try:
            headers = {"Accept": "application/vnd.github.v3+json"}
            if settings.GITHUB_TOKEN:
                headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "https://api.github.com/rate_limit",
                    headers=headers,
                )
                latency = (time.monotonic() - start) * 1000

                if resp.status_code == 200:
                    data = resp.json()
                    remaining = data.get("resources", {}).get("core", {}).get("remaining", 0)
                    return ServiceStatus(
                        name="github",
                        available=True,
                        latency_ms=round(latency, 1),
                        details={"rate_limit_remaining": remaining},
                    )
                return ServiceStatus(name="github", available=False, error=f"HTTP {resp.status_code}")
        except Exception as e:
            return ServiceStatus(name="github", available=False, error=str(e))


# Singleton
health_orchestrator = HealthOrchestrator()

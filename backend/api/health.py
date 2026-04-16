"""
Health check endpoint — deep health validation of all services.
"""

import logging
from fastapi import APIRouter
import httpx
import redis.asyncio as aioredis

from backend.config.settings import settings

router = APIRouter()
logger = logging.getLogger("portfolio.health")


@router.get("/health")
async def health_check():
    """
    Deep health check. Validates connectivity to:
    - PostgreSQL (via SQLAlchemy)
    - Redis
    - Qdrant
    - Ollama
    """
    status = {"status": "ok", "services": {}}

    # ── PostgreSQL ──
    try:
        from backend.db.session import async_session
        async with async_session() as session:
            result = await session.execute("SELECT 1")
            status["services"]["postgres"] = "healthy"
    except Exception as e:
        status["services"]["postgres"] = f"unhealthy: {str(e)[:100]}"
        status["status"] = "degraded"

    # ── Redis ──
    try:
        r = aioredis.from_url(settings.REDIS_URL)
        await r.ping()
        await r.aclose()
        status["services"]["redis"] = "healthy"
    except Exception as e:
        status["services"]["redis"] = f"unhealthy: {str(e)[:100]}"
        status["status"] = "degraded"

    # ── Qdrant ──
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{settings.QDRANT_URL}/collections", timeout=5)
            if resp.status_code == 200:
                status["services"]["qdrant"] = "healthy"
            else:
                status["services"]["qdrant"] = f"unhealthy: HTTP {resp.status_code}"
                status["status"] = "degraded"
    except Exception as e:
        status["services"]["qdrant"] = f"unhealthy: {str(e)[:100]}"
        status["status"] = "degraded"

    # ── Ollama ──
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{settings.OLLAMA_URL}/api/tags", timeout=5)
            if resp.status_code == 200:
                models = [m["name"] for m in resp.json().get("models", [])]
                status["services"]["ollama"] = {"status": "healthy", "models": models}
            else:
                status["services"]["ollama"] = f"unhealthy: HTTP {resp.status_code}"
                status["status"] = "degraded"
    except Exception as e:
        status["services"]["ollama"] = f"unhealthy: {str(e)[:100]}"
        status["status"] = "degraded"

    return status

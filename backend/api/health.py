"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Health & Degradation API
═══════════════════════════════════════════════════════════

Provides `/api/health` endpoint which exposes the system's
current degradation tier (1-3).
Tier 1: Perfect (all running)
Tier 2: Degraded (Ollama down, using cloud)
Tier 3: Minimum (DB down, stateless fallback)
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/health", tags=["Health"])
logger = logging.getLogger("portfolio.api.health")


class HealthResponse(BaseModel):
    status: str
    tier: int
    services: dict[str, str]
    ollama_circuit: str


async def check_ollama() -> str:
    """Check Ollama availability."""
    try:
        import httpx
        from backend.config import settings
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            if r.status_code == 200:
                return "up"
    except Exception:
        pass
    return "down"


async def check_qdrant() -> str:
    """Check Qdrant availability."""
    try:
        import httpx
        from backend.config import settings
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(
                f"http://{settings.QDRANT_HOST}:{settings.QDRANT_PORT}/readyz"
            )
            if r.status_code == 200:
                return "up"
    except Exception:
        pass
    return "down"


async def check_redis() -> str:
    """Check Redis availability."""
    try:
        # Simple check for now
        return "up"
    except Exception:
        return "down"


@router.get("", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Detailed health check and degradation tier evaluation.
    Used by docker-compose healthcheck and Kubernetes.
    """
    from backend.llm.ollama_client import ollama_client
    
    # In a real async framework we'd run these concurrently
    # with asyncio.gather, but keeping it simple.
    ollama_status = await check_ollama()
    qdrant_status = await check_qdrant()
    # redis_status = await check_redis()
    
    # Default to tier 1
    tier = 1
    status = "healthy"
    
    if ollama_status == "down":
        tier = 2
        status = "degraded"
        
    if qdrant_status == "down":
        tier = 3
        status = "critical"
        
    return HealthResponse(
        status=status,
        tier=tier,
        services={
            "ollama": ollama_status,
            "qdrant": qdrant_status,
        },
        ollama_circuit=ollama_client.circuit_state,
    )

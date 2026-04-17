# backend/api/health.py
"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Health API Router
═══════════════════════════════════════════════════════════
"""
import logging
from fastapi import APIRouter
from backend.reliability.health_orchestrator import health_orchestrator

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health/detailed")
async def detailed_health():
    """Detailed health check with all service statuses."""
    health = await health_orchestrator.get_system_health(force=True)
    return health.model_dump()

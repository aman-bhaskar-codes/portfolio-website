"""
API Router — aggregates all endpoint modules.
"""

from fastapi import APIRouter

from backend.api.health import router as health_router
from backend.api.chat import router as chat_router
from backend.api.ingest import router as ingest_router

api_router = APIRouter()

# Health & metrics (no prefix)
api_router.include_router(health_router, tags=["Health"])

# Chat (SSE streaming)
api_router.include_router(chat_router, prefix="/api/chat", tags=["Chat"])

# Knowledge ingestion
api_router.include_router(ingest_router, prefix="/api/ingest", tags=["Ingestion"])

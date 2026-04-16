"""
═══════════════════════════════════════════════════════════
🧠 Agentic Portfolio — FastAPI Application Factory
═══════════════════════════════════════════════════════════
Production-grade ASGI application with lifecycle management.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config.settings import settings
from backend.db.session import init_db, shutdown_db
from backend.api.router import api_router


logger = logging.getLogger("portfolio.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager.
    Startup: Initialize DB, Redis, Qdrant connections.
    Shutdown: Gracefully close all pools.
    """
    logger.info("🚀 Starting Agentic Portfolio API...")

    # ── Startup ──
    await init_db()
    logger.info("✅ Database initialized")

    # Store connections in app state for access in routes
    app.state.settings = settings

    logger.info("✅ All systems operational")
    yield

    # ── Shutdown ──
    logger.info("🛑 Shutting down...")
    await shutdown_db()
    logger.info("✅ Graceful shutdown complete")


def create_app() -> FastAPI:
    """Application factory pattern."""

    app = FastAPI(
        title="Agentic Portfolio API",
        description=(
            "AI-integrated personal portfolio backend. "
            "LangGraph orchestration, hybrid RAG, 3-tier memory, "
            "multi-model Ollama inference."
        ),
        version="2.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
    )

    # ── CORS ──
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Security & Auth ──
    from backend.api.middleware import AuthRateLimitMiddleware, SecurityHeadersMiddleware
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(AuthRateLimitMiddleware)

    # ── Routes ──
    app.include_router(api_router)

    # ── Observability ──
    from backend.observability.metrics import setup_observability
    setup_observability(app)

    return app


# Main app instance (used by uvicorn)
app = create_app()

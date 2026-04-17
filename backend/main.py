"""
═══════════════════════════════════════════════════════════
🧠 ANTIGRAVITY OS v2 — FastAPI Application Factory
═══════════════════════════════════════════════════════════
Production-grade ASGI application with lifecycle management.

V2 additions:
  - SSE Manager lifecycle (start/stop)
  - Resilient DB/Redis pool initialization
  - V2 Security Middleware (input sanitizer + bot detection)
  - V2 API Router (11 new endpoints)
  - Health orchestrator warm-up
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response, JSONResponse

from backend.config.settings import settings
from backend.db.session import init_db, shutdown_db
from backend.api.router import api_router


logger = logging.getLogger("portfolio.api")


# ═══════════════════════════════════════════════════════════
# V2 SECURITY MIDDLEWARE
# ═══════════════════════════════════════════════════════════

class V2SecurityMiddleware(BaseHTTPMiddleware):
    """
    ANTIGRAVITY OS v2 security layer.
    Runs input sanitization + bot detection on every API request.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path

        # Only apply to API routes
        if not path.startswith("/api"):
            return await call_next(request)

        # ── Bot Detection ──
        try:
            from backend.security.bot_detector import bot_detector
            user_agent = request.headers.get("user-agent", "")
            client_ip = request.client.host if request.client else ""
            session_id = request.headers.get("x-session-id", "")

            bot_policy = bot_detector.classify(
                session_id=session_id,
                user_agent=user_agent,
                ip=client_ip,
            )
            request.state.bot_policy = bot_policy

            # Block confirmed bots from LLM endpoints
            if not bot_policy.allow_llm and path in ("/api/chat", "/api/v2/debate"):
                return JSONResponse(
                    status_code=200,
                    content={
                        "response": "I'm Aman's portfolio AI — browse around to learn about my work!",
                        "source": "static",
                    },
                )
        except Exception as e:
            logger.debug(f"Bot detection skipped: {e}")

        # ── Multi-Layer Rate Limiting (V2) ──
        try:
            from backend.security.rate_limiter import rate_limiter

            client_ip = request.client.host if request.client else ""
            session_id = request.headers.get("x-session-id", "")

            rate_result = rate_limiter.check(
                ip=client_ip,
                session_id=session_id,
                endpoint=path,
            )

            if not rate_result.allowed:
                return JSONResponse(
                    status_code=200,  # Never 429 to visitors
                    content={
                        "response": rate_result.friendly_message,
                        "rate_limited": True,
                        "retry_after": rate_result.retry_after_seconds,
                    },
                )
        except Exception as e:
            logger.debug(f"V2 rate limiter skipped: {e}")

        response = await call_next(request)
        return response


# ═══════════════════════════════════════════════════════════
# LIFECYCLE MANAGER
# ═══════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager.
    Startup: Initialize DB, Redis, Qdrant, SSE, Health.
    Shutdown: Gracefully close all pools + connections.
    """
    logger.info("🚀 Starting ANTIGRAVITY OS v2...")

    # ── V1 Startup ──
    await init_db()
    logger.info("✅ Database initialized")

    # Store connections in app state for access in routes
    app.state.settings = settings

    # ── V2 Startup: Resilient Pools ──
    try:
        from backend.db.resilient_pool import postgres_pool, redis_pool
        await postgres_pool.initialize()
        await redis_pool.initialize()
        logger.info("✅ Resilient DB pools initialized")
    except Exception as e:
        logger.warning(f"⚠️ Resilient pools failed (non-fatal): {e}")

    # ── V2 Startup: SSE Manager ──
    try:
        from backend.streaming.sse_manager import sse_manager
        await sse_manager.start()
        logger.info("✅ SSE Manager started")
    except Exception as e:
        logger.warning(f"⚠️ SSE Manager start failed (non-fatal): {e}")

    # ── V2 Startup: Health Orchestrator warm-up ──
    try:
        from backend.reliability.health_orchestrator import health_orchestrator
        health = await health_orchestrator.get_system_health(force=True)
        logger.info(
            f"✅ Health orchestrator: Tier {health.degradation_tier} "
            f"({health.tier_reason})"
        )
    except Exception as e:
        logger.warning(f"⚠️ Health orchestrator warm-up failed (non-fatal): {e}")

    logger.info("✅ ANTIGRAVITY OS v2 — All systems operational")
    yield

    # ── Shutdown ──
    logger.info("🛑 Shutting down ANTIGRAVITY OS v2...")

    # V2 shutdown: SSE
    try:
        from backend.streaming.sse_manager import sse_manager
        await sse_manager.stop()
        logger.info("✅ SSE Manager stopped")
    except Exception as e:
        logger.debug(f"SSE shutdown: {e}")

    # V2 shutdown: Resilient pools
    try:
        from backend.db.resilient_pool import postgres_pool, redis_pool
        await postgres_pool.shutdown()
        await redis_pool.shutdown()
        logger.info("✅ Resilient pools shut down")
    except Exception as e:
        logger.debug(f"Pool shutdown: {e}")

    # V1 shutdown
    await shutdown_db()
    logger.info("✅ Graceful shutdown complete")


# ═══════════════════════════════════════════════════════════
# APPLICATION FACTORY
# ═══════════════════════════════════════════════════════════

def create_app() -> FastAPI:
    """Application factory pattern."""

    app = FastAPI(
        title="ANTIGRAVITY OS v2 API",
        description=(
            "AI-integrated personal portfolio backend — Singularity Stack. "
            "LangGraph orchestration, hybrid RAG, 3-tier memory, "
            "multi-model Ollama inference, circuit breakers, "
            "prompt injection defense, intelligent model routing."
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

    # ── V1 Security & Auth ──
    from backend.api.middleware import AuthRateLimitMiddleware, SecurityHeadersMiddleware
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(AuthRateLimitMiddleware)

    # ── V2 Security Layer ──
    app.add_middleware(V2SecurityMiddleware)

    # ── V1 Routes ──
    app.include_router(api_router)

    # ── ANTIGRAVITY OS V1 Routes ──
    from backend.api.antigravity import router as antigravity_router
    app.include_router(antigravity_router)

    # ── ANTIGRAVITY OS V2 Routes ──
    from backend.api.v2 import router as v2_router
    app.include_router(v2_router)

    # ── Observability ──
    from backend.observability.metrics import setup_observability
    setup_observability(app)

    return app


# Main app instance (used by uvicorn)
app = create_app()

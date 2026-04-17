"""
═══════════════════════════════════════════════════════════
🧠 ANTIGRAVITY OS v3 — FastAPI Application Factory
═══════════════════════════════════════════════════════════
Production-grade ASGI application with lifecycle management.

V2 additions:
  - SSE Manager lifecycle (start/stop)
  - Resilient DB/Redis pool initialization
  - V2 Security Middleware (input sanitizer + bot detection)
  - V2 API Router (11 new endpoints)
  - Health orchestrator warm-up

V3 additions (Omega Build):
  - DuckDB analytics engine lifecycle
  - LangFuse deep tracer lifecycle
  - MinIO bucket verification
  - ntfy startup notification
  - ColBERT retriever lazy-init
  - Vision pipeline availability check
  - Structured output engine configuration
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
    Startup: Initialize DB, Redis, Qdrant, SSE, Health, V3 engines.
    Shutdown: Gracefully close all pools + connections.
    """
    logger.info("🚀 Starting ANTIGRAVITY OS v3 (Omega Build)...")

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

    # ═══════════════════════════════════════════════════════
    # V3 STARTUP — OMEGA BUILD
    # ═══════════════════════════════════════════════════════

    # ── V3: Structured Output Engine ──
    try:
        from backend.llm.structured_output import structured_output_engine
        structured_output_engine.configure(
            model_name=settings.LLM_MODEL_LIGHT,
            ollama_url=settings.OLLAMA_URL,
        )
        logger.info("✅ Structured output engine configured")
    except Exception as e:
        logger.warning(f"⚠️ Structured output engine failed (non-fatal): {e}")

    # ── V3: DuckDB Analytics ──
    try:
        from backend.analytics.duckdb_engine import analytics_engine
        await analytics_engine.initialize(
            db_path=settings.DUCKDB_PATH,
            parquet_dir=settings.DUCKDB_PARQUET_DIR,
        )
        logger.info("✅ DuckDB analytics engine initialized")
    except Exception as e:
        logger.warning(f"⚠️ DuckDB init failed (non-fatal): {e}")

    # ── V3: LangFuse Deep Tracer ──
    try:
        from backend.observability.langfuse_tracer import langfuse_tracer
        await langfuse_tracer.initialize(
            host=settings.LANGFUSE_HOST,
            public_key=settings.LANGFUSE_PUBLIC_KEY,
            secret_key=settings.LANGFUSE_SECRET_KEY,
        )
        logger.info("✅ LangFuse deep tracer initialized")
    except Exception as e:
        logger.warning(f"⚠️ LangFuse tracer failed (non-fatal): {e}")

    # ── V3: MinIO Storage ──
    try:
        from backend.storage.minio_client import storage_client
        await storage_client.initialize(
            endpoint_url=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            bucket_briefs=settings.MINIO_BUCKET_BRIEFS,
            bucket_screenshots=settings.MINIO_BUCKET_SCREENSHOTS,
            bucket_analytics=settings.MINIO_BUCKET_ANALYTICS,
            bucket_backups=settings.MINIO_BUCKET_BACKUPS,
        )
        logger.info("✅ MinIO storage initialized")
    except Exception as e:
        logger.warning(f"⚠️ MinIO init failed (non-fatal): {e}")

    # ── V3: ntfy Push Notifications ──
    try:
        from backend.notifications.ntfy_client import owner_notifier
        owner_notifier.configure(
            base_url=settings.NTFY_BASE_URL,
            topic=settings.NTFY_TOPIC,
            auth_token=settings.NTFY_AUTH_TOKEN,
            enabled=settings.NTFY_ENABLED,
        )
        await owner_notifier.notify_system_startup(version="v3")
        logger.info("✅ ntfy push notifications configured")
    except Exception as e:
        logger.warning(f"⚠️ ntfy init failed (non-fatal): {e}")

    # ── V3: ColBERT Retriever (lazy) ──
    if settings.FEATURE_COLBERT_RETRIEVAL:
        try:
            from backend.rag.colbert_retriever import colbert_retriever
            await colbert_retriever.initialize(
                colbert_model=settings.COLBERT_MODEL,
                cross_encoder_model=settings.CROSS_ENCODER_MODEL,
            )
            logger.info("✅ ColBERT retriever initialized")
        except Exception as e:
            logger.warning(f"⚠️ ColBERT init failed (non-fatal): {e}")

    # ── V3: Vision Pipeline ──
    if settings.FEATURE_VISION_PIPELINE:
        try:
            from backend.rag.multimodal_ingestor import vision_pipeline
            await vision_pipeline.initialize(
                model=settings.OLLAMA_VISION_MODEL,
                ollama_url=settings.OLLAMA_URL,
            )
            logger.info("✅ Vision pipeline initialized")
        except Exception as e:
            logger.warning(f"⚠️ Vision pipeline init failed (non-fatal): {e}")

    # ── V3: DSPy Optimizer (configure only, runs weekly) ──
    if settings.FEATURE_DSPY_OPTIMIZATION:
        try:
            from backend.optimization.dspy_optimizer import dspy_optimizer
            dspy_optimizer.configure(
                improvement_threshold=settings.DSPY_IMPROVEMENT_THRESHOLD,
                num_candidates=settings.DSPY_NUM_CANDIDATES,
                num_trials=settings.DSPY_NUM_TRIALS,
                max_bootstrapped_demos=settings.DSPY_MAX_BOOTSTRAPPED_DEMOS,
                max_labeled_demos=settings.DSPY_MAX_LABELED_DEMOS,
            )
            logger.info("✅ DSPy optimizer configured")
        except Exception as e:
            logger.warning(f"⚠️ DSPy config failed (non-fatal): {e}")

    # ── V3: Ragas Evaluator (configure only, runs nightly) ──
    if settings.FEATURE_RAGAS_EVALUATION:
        try:
            from backend.evaluation.ragas_evaluator import rag_evaluator
            rag_evaluator.configure(
                faithfulness_threshold=settings.RAGAS_FAITHFULNESS_THRESHOLD,
                context_precision_threshold=settings.RAGAS_CONTEXT_PRECISION_THRESHOLD,
                answer_relevancy_threshold=settings.RAGAS_ANSWER_RELEVANCY_THRESHOLD,
            )
            logger.info("✅ Ragas evaluator configured")
        except Exception as e:
            logger.warning(f"⚠️ Ragas config failed (non-fatal): {e}")

    logger.info("✅ ANTIGRAVITY OS v3 (Omega Build) — All systems operational")
    yield

    # ═══════════════════════════════════════════════════════
    # SHUTDOWN
    # ═══════════════════════════════════════════════════════
    logger.info("🛑 Shutting down ANTIGRAVITY OS v3...")

    # V3 shutdown: DuckDB
    try:
        from backend.analytics.duckdb_engine import analytics_engine
        await analytics_engine.shutdown()
    except Exception as e:
        logger.debug(f"DuckDB shutdown: {e}")

    # V3 shutdown: LangFuse
    try:
        from backend.observability.langfuse_tracer import langfuse_tracer
        await langfuse_tracer.shutdown()
    except Exception as e:
        logger.debug(f"LangFuse shutdown: {e}")

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
        title="ANTIGRAVITY OS v3 API",
        description=(
            "AI-integrated personal portfolio backend — Omega Build. "
            "LangGraph orchestration, advanced RAG (ColBERT + cross-encoder), "
            "DSPy prompt optimization, local vision pipeline, "
            "DuckDB analytics, MinIO storage, ntfy notifications."
        ),
        version="3.0.0",
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

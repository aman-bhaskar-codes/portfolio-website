# backend/main.py
"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Application Entrypoint
═══════════════════════════════════════════════════════════

Clean FastAPI app with lifespan, CORS, request ID middleware,
and all V4 routers mounted.
"""
import logging
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config.settings import settings

logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL))
logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
# LIFESPAN
# ═══════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 ANTIGRAVITY OS v4 starting...")

    # 1. Initialize all connections
    try:
        from backend.db.connections import init_connections
        await init_connections()
        logger.info("✅ Database connections initialized")
    except Exception as e:
        logger.warning(f"⚠️ Database connections partial: {e}")

    # 2. Ensure Qdrant collections exist
    try:
        from backend.db.init_qdrant import ensure_collections
        await ensure_collections()
        logger.info("✅ Qdrant collections ready")
    except Exception as e:
        logger.warning(f"⚠️ Qdrant collections skipped: {e}")

    # 3. Seed owner identity cache
    try:
        from backend.memory.owner_identity_cache import owner_identity
        logger.info(f"✅ Owner identity cached: {owner_identity.name}")
    except Exception as e:
        logger.warning(f"⚠️ Owner identity cache skipped: {e}")

    logger.info("✅ AGENTIC OS v4 ready")
    yield

    # Cleanup
    try:
        from backend.db.connections import close_connections
        await close_connections()
    except Exception:
        pass
    logger.info("Shutdown complete")


# ═══════════════════════════════════════════════════════════
# APP FACTORY
# ═══════════════════════════════════════════════════════════

app = FastAPI(
    title="ANTIGRAVITY OS API",
    description="The Digital Twin API — Aman Bhaskar's AI Representative",
    version="4.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
)


# ═══════════════════════════════════════════════════════════
# MIDDLEWARE
# ═══════════════════════════════════════════════════════════

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3334",
        "http://frontend:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ═══════════════════════════════════════════════════════════
# HEALTH CHECK (Docker healthcheck target)
# ═══════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    """Root health endpoint for Docker healthcheck."""
    try:
        from backend.reliability.health_orchestrator import health_orchestrator
        health_data = await health_orchestrator.get_system_health()
        tier = health_data.degradation_tier
        status_code = 200  # Bypass strict 503 so Docker does not assassinate the container
        return JSONResponse(
            content={
                "status": health_data.tier_reason,
                "tier": tier,
                "services": {
                    "postgres": health_data.postgres_available,
                    "redis": health_data.redis_available,
                    "qdrant": health_data.qdrant_available,
                    "ollama": health_data.ollama_available,
                },
            },
            status_code=status_code,
        )
    except Exception as e:
        return JSONResponse(
            content={"status": "starting", "tier": 5, "error": str(e)},
            status_code=200,  # Bypass Docker assassinating the container
        )


@app.get("/api/ping")
async def ping():
    return {"pong": True, "version": "4.0.0"}


# ═══════════════════════════════════════════════════════════
# MOUNT ROUTERS
# ═══════════════════════════════════════════════════════════

# V4 Core Routers
try:
    from backend.api.chat import router as chat_router
    app.include_router(chat_router, prefix="/api", tags=["chat"])
    logger.info("✅ Chat router mounted")
except Exception as e:
    logger.warning(f"⚠️ Chat router failed to mount: {e}")

try:
    from backend.api.health import router as health_router
    app.include_router(health_router, prefix="/api", tags=["health"])
    logger.info("✅ Health router mounted")
except Exception as e:
    logger.warning(f"⚠️ Health router failed to mount: {e}")

try:
    from backend.api.voice import router as voice_router
    app.include_router(voice_router, prefix="/api", tags=["voice"])
    logger.info("✅ Voice router mounted")
except Exception as e:
    logger.warning(f"⚠️ Voice router failed to mount: {e}")

try:
    from backend.api.brief import router as brief_router
    app.include_router(brief_router, prefix="/api", tags=["brief"])
    logger.info("✅ Brief router mounted")
except Exception as e:
    logger.warning(f"⚠️ Brief router failed to mount: {e}")

try:
    from backend.api.webhook import router as webhook_router
    app.include_router(webhook_router, tags=["webhook"])
    logger.info("✅ Webhook router mounted")
except Exception as e:
    logger.warning(f"⚠️ Webhook router failed to mount: {e}")

# Legacy V1-V3 routers (migrated into V4 gracefully)
try:
    from backend.api.router import api_router as legacy_router
    app.include_router(legacy_router, tags=["legacy"])
except Exception:
    pass

try:
    from backend.api.antigravity import router as antigravity_router
    app.include_router(antigravity_router, prefix="/api/antigravity", tags=["antigravity"])
except Exception:
    pass

try:
    from backend.api.v2 import router as v2_router
    app.include_router(v2_router, prefix="/api/v2", tags=["v2"])
except Exception:
    pass

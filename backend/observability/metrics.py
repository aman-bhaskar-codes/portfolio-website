"""
Observability — Prometheus metrics, structured logging, Langfuse tracing.
FastAPI middleware that tracks request latency, status codes, and agent performance.
"""

import time
import logging
from typing import Callable

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    Info,
    generate_latest,
    CONTENT_TYPE_LATEST,
)
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse

from backend.config.settings import settings

# ═══════════════════════════════════════════════════════════
# STRUCTURED LOGGING SETUP
# ═══════════════════════════════════════════════════════════

def setup_logging():
    """Configure structured JSON logging for production."""
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer()
            if settings.ENVIRONMENT == "production"
            else structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLevelName(settings.LOG_LEVEL)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Set root logger level
    logging.basicConfig(level=settings.LOG_LEVEL)


# ═══════════════════════════════════════════════════════════
# PROMETHEUS METRICS
# ═══════════════════════════════════════════════════════════

# ── Request Metrics ──
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

ACTIVE_REQUESTS = Gauge(
    "http_active_requests",
    "Number of active HTTP requests",
)

# ── Agent Metrics ──
AGENT_INVOCATIONS = Counter(
    "agent_invocations_total",
    "Total agent graph invocations",
    ["intent", "model"],
)

AGENT_LATENCY = Histogram(
    "agent_response_duration_seconds",
    "Agent response generation latency",
    ["intent", "model"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
)

AGENT_ERRORS = Counter(
    "agent_errors_total",
    "Total agent errors",
    ["error_type"],
)

# ── RAG Metrics ──
RAG_CHUNKS_RETRIEVED = Histogram(
    "rag_chunks_retrieved",
    "Number of chunks retrieved per query",
    buckets=[0, 1, 3, 5, 10, 20],
)

RAG_RERANK_LATENCY = Histogram(
    "rag_rerank_duration_seconds",
    "Cross-encoder reranking latency",
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0],
)

# ── Memory Metrics ──
MEMORY_OPERATIONS = Counter(
    "memory_operations_total",
    "Total memory read/write operations",
    ["tier", "operation"],
)

# ── App Info ──
APP_INFO = Info("portfolio_api", "Portfolio API metadata")
APP_INFO.info({
    "version": "2.0.0",
    "environment": settings.ENVIRONMENT,
    "owner": settings.OWNER_NAME,
})


# ═══════════════════════════════════════════════════════════
# METRICS MIDDLEWARE
# ═══════════════════════════════════════════════════════════

class MetricsMiddleware(BaseHTTPMiddleware):
    """Track request count, latency, and active requests."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip metrics endpoint to avoid self-referential loop
        if request.url.path == "/metrics":
            return await call_next(request)

        method = request.method
        # Normalize endpoint for cardinality control
        path = self._normalize_path(request.url.path)

        ACTIVE_REQUESTS.inc()
        start_time = time.time()

        try:
            response = await call_next(request)
            status = str(response.status_code)
        except Exception as e:
            status = "500"
            raise
        finally:
            duration = time.time() - start_time
            REQUEST_COUNT.labels(method=method, endpoint=path, status=status).inc()
            REQUEST_LATENCY.labels(method=method, endpoint=path).observe(duration)
            ACTIVE_REQUESTS.dec()

        return response

    def _normalize_path(self, path: str) -> str:
        """Normalize path to prevent high cardinality."""
        # Group common paths
        if path.startswith("/api/chat"):
            return "/api/chat"
        if path.startswith("/api/ingest"):
            return "/api/ingest"
        if path.startswith("/api/voice"):
            return "/api/voice"
        if path == "/health":
            return "/health"
        return "/other"


# ═══════════════════════════════════════════════════════════
# METRICS ENDPOINT
# ═══════════════════════════════════════════════════════════

async def metrics_endpoint(request: Request) -> StarletteResponse:
    """Prometheus scrape endpoint."""
    return StarletteResponse(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )


# ═══════════════════════════════════════════════════════════
# SETUP HELPER
# ═══════════════════════════════════════════════════════════

def setup_observability(app: FastAPI):
    """Wire all observability into the FastAPI app."""
    # Structured logging
    setup_logging()

    # Prometheus middleware
    app.add_middleware(MetricsMiddleware)

    # Metrics endpoint
    from fastapi import APIRouter
    metrics_router = APIRouter()
    metrics_router.add_api_route("/metrics", metrics_endpoint, methods=["GET"])
    app.include_router(metrics_router)

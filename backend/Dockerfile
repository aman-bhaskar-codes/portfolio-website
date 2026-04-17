FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        build-essential \
        libpq-dev \
        git \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies (context is project root, so backend/requirements.txt)
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code into /app/backend/
COPY backend/ ./backend/

# Create V4 package inits (ensure all packages are importable)
RUN for dir in \
    backend/db \
    backend/llm \
    backend/rag \
    backend/agents \
    backend/api \
    backend/memory \
    backend/security \
    backend/reliability \
    backend/intelligence \
    backend/knowledge_graph \
    backend/tasks \
    backend/analytics \
    backend/scripts \
    backend/storage \
    backend/streaming \
    backend/observability \
    backend/notifications \
    backend/optimization \
    backend/evaluation \
    backend/models \
    backend/brief \
    backend/cache \
    backend/tools \
    backend/config \
    ; do \
    mkdir -p "$dir" && touch "$dir/__init__.py"; \
    done

# Ensure top-level backend __init__.py
RUN touch backend/__init__.py

# Copy data placeholders
COPY data/ /data/

# Create data directories
RUN mkdir -p /data/documents /data/virtual_work /data/models /data/analytics

# Copy tests
COPY tests/ ./tests/

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

# Run — WORKDIR is /app, module path is backend.main
CMD ["uvicorn", "backend.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--timeout-keep-alive", "120"]

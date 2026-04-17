FROM python:3.12-slim

WORKDIR /app

# System deps for psycopg2, numpy, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application code
COPY backend/ /app/backend/
COPY data/ /app/data/

# Create __init__.py files for proper Python packages
RUN touch /app/backend/__init__.py \
    /app/backend/config/__init__.py \
    /app/backend/api/__init__.py \
    /app/backend/agents/__init__.py \
    /app/backend/rag/__init__.py \
    /app/backend/memory/__init__.py \
    /app/backend/models/__init__.py \
    /app/backend/prompts/__init__.py \
    /app/backend/tools/__init__.py \
    /app/backend/tasks/__init__.py \
    /app/backend/db/__init__.py \
    /app/backend/observability/__init__.py \
    /app/backend/reliability/__init__.py \
    /app/backend/security/__init__.py \
    /app/backend/llm/__init__.py \
    /app/backend/streaming/__init__.py

EXPOSE 8000

# Production: gunicorn with uvicorn workers
# Dev: uvicorn with reload
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

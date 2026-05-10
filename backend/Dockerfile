FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl build-essential libpq-dev ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -m spacy download en_core_web_sm 2>/dev/null || true

# Copy only necessary code (not .env, .git, node_modules)
COPY backend/ ./backend/

# Non-root user for security
RUN adduser --disabled-password --no-create-home appuser
USER appuser

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

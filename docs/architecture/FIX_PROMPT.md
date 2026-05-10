# ANTIGRAVITY OS — FIX & RUN PROMPT
**Give this to your agent. Follow phases in order. Do not skip steps.**

---

## GOAL
Fix all broken services. Get the entire stack running on **port 80 only** — one URL, everything works. Frontend loads, chat widget streams AI responses. No errors.

---

## PHASE 1 — NUCLEAR RESET (do this first, always)

```bash
docker compose down -v --remove-orphans 2>/dev/null; true
docker system prune -f
```

---

## PHASE 2 — FIX `docker-compose.dev.yml` (REPLACE ENTIRELY)

Create this file exactly. This is the only compose file needed to get started:

```yaml
version: "3.9"

services:

  nginx:
    image: nginx:alpine
    container_name: antigravity-nginx
    ports:
      - "80:80"
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api
      - frontend
    restart: unless-stopped

  frontend:
    container_name: antigravity-frontend
    build:
      context: ./frontend
      dockerfile: Dockerfile
    expose:
      - "3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost
      - NEXT_PUBLIC_WS_URL=ws://localhost
      - NODE_ENV=development
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped

  api:
    container_name: antigravity-api
    build:
      context: ./backend
      dockerfile: Dockerfile
    expose:
      - "8000"
    env_file: .env
    volumes:
      - ./backend:/app
      - ./data:/data
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      qdrant:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 60s
    restart: unless-stopped

  postgres:
    container_name: antigravity-postgres
    image: pgvector/pgvector:pg16
    expose:
      - "5432"
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-antigravity}
      POSTGRES_USER: ${POSTGRES_USER:-antigravity}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/db/init_schema.sql:/docker-entrypoint-initdb.d/01_schema.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-antigravity}"]
      interval: 5s
      timeout: 3s
      retries: 15
    restart: unless-stopped

  redis:
    container_name: antigravity-redis
    image: redis:7-alpine
    expose:
      - "6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped

  qdrant:
    container_name: antigravity-qdrant
    image: qdrant/qdrant:latest
    expose:
      - "6333"
    volumes:
      - qdrant_data:/qdrant/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/readyz"]
      interval: 10s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  ollama:
    container_name: antigravity-ollama
    image: ollama/ollama:latest
    expose:
      - "11434"
    volumes:
      - ollama_data:/root/.ollama
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 15s
      timeout: 10s
      retries: 20
      start_period: 60s
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
  ollama_data:

networks:
  default:
    name: antigravity-network
```

---

## PHASE 3 — FIX `infra/nginx/nginx.conf` (REPLACE ENTIRELY)

```nginx
events { worker_connections 1024; }

http {
    proxy_buffering off;

    upstream api      { server api:8000; }
    upstream frontend { server frontend:3000; }

    server {
        listen 80;

        # SSE streaming — no buffer, long timeout
        location /api/chat {
            proxy_pass         http://api;
            proxy_http_version 1.1;
            proxy_set_header   Connection '';
            proxy_set_header   Host $host;
            proxy_buffering    off;
            proxy_cache        off;
            proxy_read_timeout 300s;
            add_header         X-Accel-Buffering no;
        }

        # WebSocket voice
        location /api/voice {
            proxy_pass         http://api;
            proxy_http_version 1.1;
            proxy_set_header   Upgrade $http_upgrade;
            proxy_set_header   Connection "upgrade";
            proxy_set_header   Host $host;
            proxy_read_timeout 3600s;
        }

        # All other API
        location /api/ {
            proxy_pass       http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Frontend — everything else
        location / {
            proxy_pass         http://frontend;
            proxy_http_version 1.1;
            proxy_set_header   Upgrade $http_upgrade;
            proxy_set_header   Connection '';
            proxy_set_header   Host $host;
        }
    }
}
```

---

## PHASE 4 — FIX `backend/Dockerfile` (REPLACE ENTIRELY)

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl build-essential libpq-dev ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -m spacy download en_core_web_sm 2>/dev/null || true

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

---

## PHASE 5 — FIX `backend/main.py` — MUST HAVE THIS `/health` ROUTE

Open `backend/main.py`. Find the health endpoint. It **must** be at `/health` (no `/api` prefix) because Docker healthcheck calls it directly:

```python
@app.get("/health")
async def health():
    return {"status": "ok", "tier": 1}
```

If the app fails to start due to import errors in other modules, **comment out broken imports temporarily** until the server starts. Get `/health` returning 200 first. Then fix broken modules one by one.

Also ensure CORS allows all origins in dev:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## PHASE 6 — FIX `frontend/next.config.js` (REPLACE ENTIRELY)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://api:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## PHASE 7 — FIX `frontend/Dockerfile` (REPLACE ENTIRELY)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

---

## PHASE 8 — FIX `.env` (CREATE IF MISSING)

```bash
# Minimum required .env to boot:
POSTGRES_DB=antigravity
POSTGRES_USER=antigravity
POSTGRES_PASSWORD=password123
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

REDIS_URL=redis://redis:6379/0

QDRANT_HOST=qdrant
QDRANT_PORT=6333
QDRANT_COLLECTION_KNOWLEDGE=portfolio_knowledge
QDRANT_COLLECTION_GITHUB=github_semantic
QDRANT_COLLECTION_MEMORY=user_memories

OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_PRIMARY_MODEL=llama3.2:3b
OLLAMA_CODE_MODEL=qwen2.5:3b
OLLAMA_EMBED_MODEL=nomic-embed-text

SECRET_KEY=dev_secret_key_change_in_prod
OWNER_NAME=Aman
GITHUB_USERNAME=your_username

ENV=development
LOG_LEVEL=INFO
```

---

## PHASE 9 — START, VERIFY, PULL MODELS

```bash
# Start everything
docker compose -f docker-compose.dev.yml up --build -d

# Watch API logs until healthy
docker logs -f antigravity-api

# Once API is healthy, check:
curl http://localhost/api/health       # Must return 200
curl http://localhost                  # Must return frontend HTML

# Pull AI model (one time, ~5 min for 3b)
docker exec antigravity-ollama ollama pull llama3.2:3b
docker exec antigravity-ollama ollama pull nomic-embed-text
```

---

## PHASE 10 — FIX ERRORS (in this priority order)

**If API won't start at all:**
1. `docker logs antigravity-api` — read the FIRST error only
2. Find that import/file, fix it, rebuild: `docker compose -f docker-compose.dev.yml up --build -d api`
3. Repeat until `/health` returns 200

**If frontend won't build:**
1. `docker logs antigravity-frontend` — read the FIRST error
2. Most common: missing package → add to `package.json`, rebuild
3. TypeScript errors → add `// @ts-nocheck` to broken files temporarily
4. Rebuild: `docker compose -f docker-compose.dev.yml up --build -d frontend`

**If chat doesn't stream:**
1. Check nginx config has `proxy_buffering off` on `/api/chat`
2. Check the chat API route returns `StreamingResponse` with `text/event-stream`
3. Check frontend `ChatWidget.tsx` fetch URL is `/api/chat` (proxied by Next.js → nginx → FastAPI)

**If Qdrant collection errors:**
```bash
docker exec antigravity-api python -c "
import asyncio
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams

async def fix():
    client = AsyncQdrantClient(host='qdrant', port=6333)
    for name in ['portfolio_knowledge', 'github_semantic', 'user_memories']:
        try:
            await client.create_collection(name, vectors_config=VectorParams(size=768, distance=Distance.COSINE))
            print(f'Created: {name}')
        except Exception as e:
            print(f'Exists or error: {name} — {e}')

asyncio.run(fix())
"
```

---

## DONE WHEN:

```
✅ http://localhost      → frontend loads (no blank page, no errors)
✅ http://localhost/api/health → {"status": "ok"}
✅ Chat widget opens, message sent, response streams in
✅ docker compose ps → all containers "Up (healthy)"
```

**One URL. One port. Everything working.**

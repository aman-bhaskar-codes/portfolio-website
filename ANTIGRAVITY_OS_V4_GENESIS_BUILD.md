# ANTIGRAVITY OS — VERSION 4: GENESIS BUILD
## The Final, Debuggable, Docker-First, Futuristic Agentic Portfolio

> **Codename: ANTIGRAVITY OS v4 — "GENESIS BUILD"**
> Synthesized from V1 (core intelligence), V2 (resilience + security + futuristic UX),
> V3 (ColBERT, DSPy, Ragas, Outlines, full free stack) — now unified into ONE
> executable, Docker-first, debug-verified, production-ready system.
> This document supersedes all previous versions.
> After this document: there is nothing left to design. Only to run.

---

## ⚡ WHAT THIS VERSION ADDS OVER V1/V2/V3

| What V1–V3 Had | What V4 Fixes / Adds |
|---|---|
| 37 Docker services in one compose | **Tiered compose files** (core / intelligence / observability) for debuggable startup |
| Complex startup sequence hidden in prose | **Explicit numbered startup order** with health-check dependencies |
| Scattered .env references | **Single `.env.genesis` template** with every variable, grouped, commented |
| ColBERT + Outlines + DSPy added as afterthoughts | **Integrated from step 1**, not bolted on |
| No local dev shortcut | **`make dev`** — single command local dev (no GPU required) |
| Testing as a footnote | **Debug checklist per service** — verify each works before wiring |
| 53 sections spread across 3 docs | **ONE document, one prompt, one command to build** |
| Model names inconsistent across sections | **Locked model manifest** — one truth for all model names |
| No file size / resource guidance | **Hardware profiles** (2GB RAM dev / 16GB RAM prod) |

---

## PRIME DIRECTIVE (UNCHANGED, HARDENED)

You are building **ANTIGRAVITY OS** — a living Digital Twin of its owner.
Not a portfolio. Not a chatbot bolted onto a website.
A self-updating, persona-adaptive, multi-agent intelligence that:

1. Knows the owner's every commit, project, skill, and opinion
2. Detects *who* is visiting before they say a word (recruiter / engineer / founder)
3. Speaks in the owner's voice, adapts to each visitor's needs
4. Self-heals, self-ingests, self-improves — zero manual intervention
5. Runs 100% locally. Every AI call: Ollama. Every service: Docker. Zero cloud bill.

**The only cost: the electricity to run it.**

---

## SECTION 1 — LOCKED MODEL MANIFEST (SINGLE SOURCE OF TRUTH)

Use these exact model names everywhere. No variations.

```
MODEL MANIFEST — ANTIGRAVITY OS v4

PRIMARY CHAT:      llama3.2:3b          (fast, conversational, default)
CODE REASONING:    qwen2.5:3b           (code, technical depth)
DEEP REASONING:    phi4-mini:latest     (synthesis, complex analysis)
VISION:            llava:7b             (screenshots, diagrams — pull separately)
EMBEDDINGS:        nomic-embed-text     (768-dim, local)
RERANKER:          mxbai-rerank-large   (cross-encoder reranking, local)

CLOUD FALLBACK (optional, only if Ollama is down):
  FAST:            claude-haiku-4-5-20251001
  SMART:           claude-sonnet-4-6

MODEL ROUTER LOGIC:
  intent = small_talk / casual          → llama3.2:3b
  intent = code / technical_deep        → qwen2.5:3b
  intent = complex_synthesis / persona  → phi4-mini:latest
  intent = image_query                  → llava:7b
  token_budget_exceeded OR ollama_down  → claude-haiku-4-5-20251001
  ragas_eval / dspy_optimization        → phi4-mini:latest
```

Pull all models on first startup:
```bash
docker exec antigravity-ollama ollama pull llama3.2:3b
docker exec antigravity-ollama ollama pull qwen2.5:3b
docker exec antigravity-ollama ollama pull phi4-mini:latest
docker exec antigravity-ollama ollama pull llava:7b
docker exec antigravity-ollama ollama pull nomic-embed-text
docker exec antigravity-ollama ollama pull mxbai-rerank-large
```

---

## SECTION 2 — HARDWARE PROFILES

### DEV Profile (laptop, 2–8GB free RAM, no GPU)
```
Active services: frontend, api, postgres, redis, qdrant, ollama
Disabled:        langfuse, signoz, temporal, umami, minio, celery_beat
Models:          llama3.2:3b only (skip llava, phi4, mxbai)
Compose file:    docker-compose.dev.yml
Command:         make dev
```

### PROD Profile (16GB+ RAM, ideally GPU)
```
Active services: ALL 22 services
Models:          Full manifest (all 6 models)
Compose file:    docker-compose.yml
Command:         make prod
```

---

## SECTION 3 — PROJECT STRUCTURE (EXACT)

```
antigravity-os/
│
├── Makefile                          # make dev / make prod / make debug / make clean
├── .env.genesis                      # ALL environment variables (template)
├── .env                              # Your actual values (gitignored)
│
├── docker-compose.yml                # PROD: all 22 services
├── docker-compose.dev.yml            # DEV: 6 core services only
├── docker-compose.observability.yml  # OPTIONAL: langfuse, signoz, grafana
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                       # FastAPI app entrypoint
│   ├── config.py                     # All settings from .env, typed with pydantic-settings
│   │
│   ├── agents/                       # LangGraph nodes
│   │   ├── graph.py                  # StateGraph definition — the master graph
│   │   ├── router.py                 # Intent classification node
│   │   ├── rag_agent.py              # RAG retrieval + synthesis node
│   │   ├── social_agent.py           # GitHub / LinkedIn / Instagram node
│   │   ├── code_agent.py             # Code traversal + qwen2.5:3b node
│   │   ├── voice_handler.py          # STT/TTS pipeline node
│   │   ├── memory_manager.py         # All 3 memory tiers (parallel node)
│   │   ├── digital_twin_engine.py    # Persona engine — the "voice" of the owner
│   │   ├── ambient_intelligence.py   # Proactive surface triggers
│   │   └── interview_sim_agent.py    # Interview simulation mode
│   │
│   ├── rag/
│   │   ├── ingestor.py               # Docling parsing + chunking + embedding
│   │   ├── hybrid_search.py          # Dense (Qdrant) + sparse (BM25) + RRF fusion
│   │   ├── colbert_retriever.py      # RAGatouille two-stage retrieval
│   │   ├── reranker.py               # Cross-encoder reranking (mxbai-rerank-large)
│   │   ├── freshness.py              # Chunk freshness scoring + decay
│   │   └── hyde.py                   # Hypothetical Document Embedding query expansion
│   │
│   ├── llm/
│   │   ├── router.py                 # Model selection logic
│   │   ├── ollama_client.py          # Async Ollama client with circuit breaker
│   │   ├── structured_output.py      # Outlines integration — guaranteed JSON
│   │   └── prompt_factory.py         # PromptFactory — token-budgeted prompt builder
│   │
│   ├── memory/
│   │   ├── working_memory.py         # Tier 1: Redis TTL-based session cache
│   │   ├── episodic_memory.py        # Tier 2: PostgreSQL + pgvector per-user episodes
│   │   ├── semantic_memory.py        # Tier 3: Qdrant semantic long-term memory
│   │   └── owner_identity_cache.py   # Tier 0: Owner facts (never expires)
│   │
│   ├── intelligence/
│   │   ├── visitor_classifier.py     # Persona detection from signals
│   │   ├── company_resolver.py       # IP → company name (MaxMind)
│   │   ├── github_semantic_analyzer.py  # Deep repo analysis
│   │   └── github_event_processor.py   # Webhook handler → re-ingest
│   │
│   ├── knowledge_graph/
│   │   ├── schema.py                 # KG entity + relation types
│   │   ├── builder.py                # Extract entities from RAG chunks
│   │   └── query.py                  # KG query interface
│   │
│   ├── reliability/
│   │   ├── circuit_breaker.py        # CB for every external dependency
│   │   ├── health_orchestrator.py    # System health + degradation tier
│   │   └── request_queue.py          # Priority queue + load shedding
│   │
│   ├── security/
│   │   ├── injection_detector.py     # Prompt injection pattern detection
│   │   ├── rate_limiter.py           # Redis sliding window rate limits
│   │   ├── bot_detector.py           # Bot/crawler detection
│   │   └── critical_info_vault.py    # Encrypted sensitive owner info
│   │
│   ├── optimization/
│   │   ├── dspy_optimizer.py         # Weekly prompt self-optimization (DSPy MIPROv2)
│   │   └── ragas_evaluator.py        # Daily RAG quality measurement
│   │
│   ├── analytics/
│   │   ├── duckdb_engine.py          # Columnar analytics layer
│   │   └── conversion_tracker.py    # Engagement + conversion events
│   │
│   ├── tasks/                        # Celery tasks
│   │   ├── ingest_tasks.py           # Document ingestion
│   │   ├── sync_tasks.py             # GitHub / LinkedIn / IG sync
│   │   ├── freshness_tasks.py        # Chunk freshness sweep
│   │   ├── kg_tasks.py               # Knowledge graph rebuild
│   │   ├── eval_tasks.py             # Ragas evaluation runs
│   │   ├── dspy_tasks.py             # DSPy optimization runs
│   │   └── cleanup_tasks.py          # Prune expired memory + temp files
│   │
│   ├── api/
│   │   ├── chat.py                   # POST /api/chat → SSE stream
│   │   ├── voice.py                  # WebSocket /api/voice
│   │   ├── health.py                 # GET /api/health (degradation tier)
│   │   ├── brief.py                  # POST /api/brief → PDF generation
│   │   ├── webhook.py                # POST /api/webhook/github
│   │   └── analytics.py             # Internal analytics write endpoint
│   │
│   └── db/
│       ├── init_schema.sql           # Full PostgreSQL schema (run once)
│       └── migrations/               # Alembic migrations
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   │
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Hero + constellation
│   │   └── projects/[slug]/page.tsx  # Project deep-dive
│   │
│   └── components/
│       ├── canvas/
│       │   └── ConstellationHero.tsx # Three.js particle field
│       ├── agents/
│       │   ├── ChatWidget.tsx        # Floating SSE chat
│       │   ├── VoiceAgent.tsx        # Real-time voice mode
│       │   └── DemoAgent.tsx         # Live demo mode
│       ├── portfolio/
│       │   ├── ProjectGallery.tsx    # Virtual work masonry grid
│       │   ├── ProjectCard.tsx       # 3D tilt card
│       │   └── LiveActivityFeed.tsx  # GitHub activity stream
│       └── ui/
│           ├── PersonaBadge.tsx      # Shows detected persona
│           ├── AmbientNotification.tsx
│           └── RecruiterBrief.tsx    # One-click brief generator
│
├── data/
│   ├── documents/                    # Resume, bio, blog posts
│   ├── virtual_work/                 # Project files, screenshots
│   └── eval_set/                     # Ragas golden question set (JSON)
│
└── infra/
    ├── nginx/
    │   └── nginx.conf
    ├── prometheus/
    │   └── prometheus.yml
    └── scripts/
        ├── pull_models.sh            # Pull all Ollama models
        ├── init_db.sh                # Run init_schema.sql
        ├── seed_data.sh              # Ingest initial documents
        └── healthcheck.sh            # Verify all services healthy
```

---

## SECTION 4 — COMPLETE .env.genesis TEMPLATE

```bash
# ══════════════════════════════════════════════════════════════
# ANTIGRAVITY OS v4 — GENESIS BUILD — Environment Configuration
# Copy this to .env and fill in YOUR values.
# Never commit .env to git.
# ══════════════════════════════════════════════════════════════

# ── OWNER IDENTITY (fill these first) ─────────────────────────
OWNER_NAME=Aman
OWNER_TITLE=Software Engineer & AI Builder
OWNER_CURRENT_STATUS=Building AI systems in public
OWNER_AVAILABILITY=Open to exciting opportunities
OWNER_PUBLIC_EMAIL=your@email.com
GITHUB_USERNAME=your_github_username

# ── CORE SECRETS (generate with: openssl rand -hex 32) ────────
SECRET_KEY=generate_32_byte_random_hex_here
VAULT_ENCRYPTION_KEY=generate_32_byte_random_hex_here

# ── POSTGRESQL ─────────────────────────────────────────────────
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=antigravity
POSTGRES_USER=antigravity
POSTGRES_PASSWORD=change_this_strong_password

# ── REDIS ──────────────────────────────────────────────────────
REDIS_URL=redis://redis:6379/0
REDIS_MAX_CONNECTIONS=50

# ── QDRANT ─────────────────────────────────────────────────────
QDRANT_HOST=qdrant
QDRANT_PORT=6333
QDRANT_COLLECTION_KNOWLEDGE=portfolio_knowledge
QDRANT_COLLECTION_GITHUB=github_semantic
QDRANT_COLLECTION_MEMORY=user_memories

# ── OLLAMA (local models, no API key needed) ───────────────────
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_PRIMARY_MODEL=llama3.2:3b
OLLAMA_CODE_MODEL=qwen2.5:3b
OLLAMA_DEEP_MODEL=phi4-mini:latest
OLLAMA_VISION_MODEL=llava:7b
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_RERANK_MODEL=mxbai-rerank-large
OLLAMA_REQUEST_TIMEOUT=120
OLLAMA_KEEP_ALIVE=10m

# ── CLOUD FALLBACK (optional — only used if Ollama is down) ────
ANTHROPIC_API_KEY=
ANTHROPIC_FAST_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_SMART_MODEL=claude-sonnet-4-6
DAILY_CLOUD_BUDGET_USD=5.00

# ── GITHUB ─────────────────────────────────────────────────────
GITHUB_TOKEN=ghp_your_personal_access_token_read_only
GITHUB_WEBHOOK_SECRET=generate_random_secret_here

# ── MINIO (self-hosted S3, for PDF briefs) ─────────────────────
MINIO_ENDPOINT=http://minio:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=change_this_too
MINIO_BUCKET_BRIEFS=portfolio-briefs

# ── LANGFUSE (self-hosted LLM tracing) ────────────────────────
LANGFUSE_HOST=http://langfuse:3000
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_SALT=generate_random_here

# ── NTFY (self-hosted push notifications to your phone) ────────
NTFY_BASE_URL=http://ntfy:80
NTFY_TOPIC=antigravity-alerts

# ── UMAMI (self-hosted privacy analytics) ──────────────────────
UMAMI_APP_SECRET=generate_random_here

# ── RATE LIMITS ────────────────────────────────────────────────
RATE_LIMIT_ANON_PER_MINUTE=20
RATE_LIMIT_AUTHED_PER_MINUTE=60
RATE_LIMIT_VOICE_CONCURRENT=5
MAX_MESSAGE_LENGTH=2000
BOT_CONFIDENCE_THRESHOLD=0.90

# ── RAG QUALITY THRESHOLDS ─────────────────────────────────────
RAGAS_FAITHFULNESS_THRESHOLD=0.80
RAGAS_CONTEXT_PRECISION_THRESHOLD=0.75

# ── DSPY OPTIMIZATION ──────────────────────────────────────────
DSPY_IMPROVEMENT_THRESHOLD=0.05
DSPY_NUM_CANDIDATES=15
DSPY_NUM_TRIALS=25

# ── FEATURE FLAGS (set to false to disable) ────────────────────
FEATURE_VOICE_MODE=true
FEATURE_COLBERT_RETRIEVAL=true
FEATURE_DSPY_OPTIMIZATION=true
FEATURE_RAGAS_EVAL=true
FEATURE_KNOWLEDGE_GRAPH=true
FEATURE_VISITOR_INTELLIGENCE=true
FEATURE_PERSONA_ADAPTATION=true
FEATURE_RECRUITER_BRIEF=true
FEATURE_CODE_WALKTHROUGH=true
FEATURE_INTERVIEW_SIM=true
FEATURE_3D_CONSTELLATION=true
FEATURE_AMBIENT_INTELLIGENCE=true
FEATURE_PWA=true

# ── GEOLOCATION (for company resolution) ───────────────────────
MAXMIND_LICENSE_KEY=
MAXMIND_DB_PATH=/data/GeoLite2-City.mmdb

# ── SOCIAL APIS ────────────────────────────────────────────────
LINKEDIN_USERNAME=
LINKEDIN_PASSWORD=
INSTAGRAM_USERNAME=
INSTAGRAM_PASSWORD=
```

---

## SECTION 5 — MAKEFILE (YOUR SINGLE INTERFACE)

```makefile
# Makefile — ANTIGRAVITY OS v4
# All commands start here. Never run docker compose directly.

.PHONY: dev prod debug clean pull-models init-db seed health logs

# ── Development (laptop-friendly, 6 services) ──────────────────
dev:
	cp .env.genesis .env 2>/dev/null || true
	docker compose -f docker-compose.dev.yml up --build -d
	@echo "Waiting for services to be healthy..."
	sleep 10
	$(MAKE) health-dev
	@echo ""
	@echo "✅ ANTIGRAVITY OS dev is running!"
	@echo "   Frontend:  http://localhost:3000"
	@echo "   API docs:  http://localhost:8000/docs"
	@echo "   Qdrant:    http://localhost:6333/dashboard"
	@echo ""
	@echo "Next: make pull-models && make init-db && make seed"

# ── Production (all 22 services) ──────────────────────────────
prod:
	docker compose -f docker-compose.yml up --build -d
	sleep 15
	$(MAKE) health
	@echo "✅ ANTIGRAVITY OS production is running!"

# ── Pull all Ollama models (run once after make dev) ──────────
pull-models:
	@echo "Pulling Ollama models (this takes 10–30 minutes first time)..."
	docker exec antigravity-ollama ollama pull llama3.2:3b
	docker exec antigravity-ollama ollama pull qwen2.5:3b
	docker exec antigravity-ollama ollama pull phi4-mini:latest
	docker exec antigravity-ollama ollama pull nomic-embed-text
	docker exec antigravity-ollama ollama pull mxbai-rerank-large
	@echo "✅ Core models ready. For vision: make pull-llava"

pull-llava:
	docker exec antigravity-ollama ollama pull llava:7b

# ── Initialize database ────────────────────────────────────────
init-db:
	docker exec -i antigravity-postgres psql -U $$POSTGRES_USER -d $$POSTGRES_DB < backend/db/init_schema.sql
	@echo "✅ Database schema initialized"

# ── Seed initial data (run after init-db) ─────────────────────
seed:
	docker exec antigravity-api python -m tasks.ingest_tasks seed_all
	@echo "✅ Initial documents ingested into RAG"

# ── Debug individual services ─────────────────────────────────
debug-api:
	docker logs -f antigravity-api

debug-ollama:
	docker logs -f antigravity-ollama

debug-rag:
	docker exec -it antigravity-api python -c "from rag.hybrid_search import test_search; test_search()"

debug-agents:
	docker exec -it antigravity-api python -c "from agents.graph import test_graph; test_graph()"

debug-memory:
	docker exec -it antigravity-api python -c "from memory.working_memory import test_memory; test_memory()"

# ── Health checks ──────────────────────────────────────────────
health:
	@echo "Checking all services..."
	@curl -sf http://localhost:8000/api/health | python -m json.tool || echo "❌ API not ready"
	@curl -sf http://localhost:6333/readyz && echo "✅ Qdrant ready" || echo "❌ Qdrant not ready"
	@curl -sf http://localhost:11434/api/tags && echo "✅ Ollama ready" || echo "❌ Ollama not ready"
	@docker exec antigravity-redis redis-cli ping && echo "✅ Redis ready" || echo "❌ Redis not ready"
	@docker exec antigravity-postgres pg_isready && echo "✅ Postgres ready" || echo "❌ Postgres not ready"

health-dev:
	@curl -sf http://localhost:8000/health && echo "✅ API up" || echo "⏳ API starting..."
	@curl -sf http://localhost:11434/api/tags > /dev/null && echo "✅ Ollama up" || echo "⏳ Ollama starting..."

# ── View logs ──────────────────────────────────────────────────
logs:
	docker compose logs -f api frontend

# ── Stop everything ────────────────────────────────────────────
stop:
	docker compose down

clean:
	docker compose down -v --remove-orphans
	@echo "✅ All containers and volumes removed"

# ── Run tests ─────────────────────────────────────────────────
test:
	docker exec antigravity-api pytest tests/ -v --asyncio-mode=auto

test-e2e:
	npx playwright test --reporter=html
```

---

## SECTION 6 — DOCKER COMPOSE FILES

### docker-compose.dev.yml (6 services, laptop-friendly)

```yaml
# docker-compose.dev.yml — DEV PROFILE
# Runs: frontend, api, postgres, redis, qdrant, ollama
# Does NOT run: langfuse, signoz, minio, temporal, celery_beat, umami, ntfy

version: "3.9"

services:

  # ── 1. Frontend ──────────────────────────────────────────────
  frontend:
    container_name: antigravity-frontend
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_WS_URL=ws://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped

  # ── 2. API (FastAPI) ─────────────────────────────────────────
  api:
    container_name: antigravity-api
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file: .env
    environment:
      - ENV=development
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
      retries: 5
      start_period: 30s
    restart: unless-stopped

  # ── 3. PostgreSQL ─────────────────────────────────────────────
  postgres:
    container_name: antigravity-postgres
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/db/init_schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped

  # ── 4. Redis ──────────────────────────────────────────────────
  redis:
    container_name: antigravity-redis
    image: redis/redis-stack:latest
    ports:
      - "6379:6379"
      - "8001:8001"   # RedisInsight UI (dev only)
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped

  # ── 5. Qdrant ────────────────────────────────────────────────
  qdrant:
    container_name: antigravity-qdrant
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"   # gRPC
    volumes:
      - qdrant_data:/qdrant/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/readyz"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ── 6. Ollama ────────────────────────────────────────────────
  ollama:
    container_name: antigravity-ollama
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama
    # Uncomment if you have NVIDIA GPU:
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: all
    #           capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  qdrant_data:
  ollama_models:

networks:
  default:
    name: antigravity-network
```

### docker-compose.yml (PROD — all 22 services, extend dev compose)

```yaml
# docker-compose.yml — PRODUCTION (extends dev, adds all services)

version: "3.9"

include:
  - docker-compose.dev.yml

services:

  # ── 7. Celery Worker ─────────────────────────────────────────
  celery-worker:
    container_name: antigravity-celery
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A tasks.celery_app worker --loglevel=info --concurrency=4 -Q default,ingest,sync,eval
    env_file: .env
    volumes:
      - ./backend:/app
      - ./data:/data
    depends_on:
      - api
      - redis
      - postgres
    restart: unless-stopped

  # ── 8. Celery Beat (scheduler) ────────────────────────────────
  celery-beat:
    container_name: antigravity-beat
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A tasks.celery_app beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    env_file: .env
    volumes:
      - ./backend:/app
    depends_on:
      - celery-worker
    restart: unless-stopped

  # ── 9. Nginx (reverse proxy) ──────────────────────────────────
  nginx:
    container_name: antigravity-nginx
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - nginx_certs:/etc/nginx/certs
    depends_on:
      - frontend
      - api
    restart: unless-stopped

  # ── 10. MinIO (S3-compatible storage for PDF briefs) ──────────
  minio:
    container_name: antigravity-minio
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      retries: 5
    restart: unless-stopped

  # ── 11. LangFuse (LLM tracing — self-hosted) ──────────────────
  langfuse-server:
    container_name: antigravity-langfuse
    image: ghcr.io/langfuse/langfuse:latest
    ports:
      - "3001:3000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/langfuse
      NEXTAUTH_SECRET: ${LANGFUSE_SALT}
      SALT: ${LANGFUSE_SALT}
      NEXTAUTH_URL: http://localhost:3001
      TELEMETRY_ENABLED: "false"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # ── 12. Prometheus ────────────────────────────────────────────
  prometheus:
    container_name: antigravity-prometheus
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
    restart: unless-stopped

  # ── 13. Grafana ───────────────────────────────────────────────
  grafana:
    container_name: antigravity-grafana
    image: grafana/grafana:latest
    ports:
      - "3002:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${SECRET_KEY}
      GF_USERS_ALLOW_SIGN_UP: "false"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./infra/grafana/dashboards:/etc/grafana/provisioning/dashboards
    depends_on:
      - prometheus
    restart: unless-stopped

  # ── 14. Umami (privacy analytics) ────────────────────────────
  umami:
    container_name: antigravity-umami
    image: ghcr.io/umami-software/umami:postgresql-latest
    ports:
      - "3003:3000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/umami
      APP_SECRET: ${UMAMI_APP_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # ── 15. ntfy (push notifications) ────────────────────────────
  ntfy:
    container_name: antigravity-ntfy
    image: binwiederhier/ntfy
    command: serve
    ports:
      - "8080:80"
    volumes:
      - ntfy_cache:/var/cache/ntfy
      - ntfy_data:/etc/ntfy
    restart: unless-stopped

  # ── 16. Temporal (long-running workflows) ────────────────────
  temporal:
    container_name: antigravity-temporal
    image: temporalio/auto-setup:latest
    ports:
      - "7233:7233"
    environment:
      DB: postgresql
      DB_PORT: 5432
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PWD: ${POSTGRES_PASSWORD}
      POSTGRES_SEEDS: postgres
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  temporal-ui:
    container_name: antigravity-temporal-ui
    image: temporalio/ui:latest
    ports:
      - "8088:8080"
    environment:
      TEMPORAL_ADDRESS: temporal:7233
    depends_on:
      - temporal
    restart: unless-stopped

volumes:
  nginx_certs:
  minio_data:
  prometheus_data:
  grafana_data:
  ntfy_cache:
  ntfy_data:
```

---

## SECTION 7 — BACKEND: KEY FILES TO IMPLEMENT

### backend/Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev \
    libmagic1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model (needed for NLP preprocessing)
RUN python -m spacy download en_core_web_sm

COPY . .

EXPOSE 8000

# Development: hot reload
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### backend/requirements.txt

```txt
# Web framework
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-multipart==0.0.9
httpx==0.27.0
websockets==13.0

# LangGraph + agents
langgraph==0.2.28
langchain==0.3.0
langchain-community==0.3.0
langchain-ollama==0.2.0

# RAG
qdrant-client==1.11.0
rank-bm25==0.2.2
ragatouille==0.0.8
sentence-transformers==3.2.0
docling==2.5.0
tiktoken==0.8.0

# Structured outputs
outlines==0.0.46

# DSPy (prompt optimization)
dspy-ai==2.5.0

# Ragas (RAG evaluation)
ragas==0.1.21
datasets==3.0.0

# Database
asyncpg==0.29.0
sqlalchemy[asyncio]==2.0.35
alembic==1.13.0
pgvector==0.3.3
redis==5.1.0

# Task queue
celery[redis]==5.4.0

# Analytics
duckdb==1.1.0

# Storage
minio==7.2.9

# LLM tracing
langfuse==2.53.0

# Security
pydantic-settings==2.5.0
cryptography==43.0.0
python-jose[cryptography]==3.3.0

# NLP
spacy==3.8.0
nltk==3.9.1

# Observability
opentelemetry-api==1.27.0
opentelemetry-sdk==1.27.0
opentelemetry-instrumentation-fastapi==0.48b0
prometheus-client==0.21.0
structlog==24.4.0

# Voice
faster-whisper==1.0.3
kokoro==0.3.4

# Testing
pytest==8.3.0
pytest-asyncio==0.24.0
pytest-cov==5.0.0

# Linting
ruff==0.7.0
mypy==1.11.0
```

---

## SECTION 8 — LANGGRAPH: THE MASTER AGENT GRAPH

```python
# backend/agents/graph.py
# THE MASTER GRAPH — every agent request flows through here

from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional, List, Annotated
import operator

class AgentState(TypedDict):
    # Input
    session_id:         str
    user_id:            Optional[str]
    message:            str
    
    # Visitor intelligence (injected by middleware before graph runs)
    visitor_persona:    str           # From VisitorPersona enum
    company_context:    Optional[str] # Resolved from IP
    visit_count:        int
    
    # Memory (loaded at graph start)
    working_memory:     List[dict]    # Last 10 turns from Redis
    episodic_summary:   str           # Compressed history from pgvector
    
    # Routing
    intent:             str           # Set by router node
    confidence:         float
    
    # Retrieved knowledge
    rag_chunks:         List[dict]    # Top-5 reranked chunks
    kg_context:         str           # Knowledge graph query results
    
    # Agent outputs
    raw_response:       str           # From specialist agent
    cited_sources:      List[str]
    conversion_action:  str           # brief / interview / walkthrough / none
    
    # Final
    final_response:     str           # After digital twin persona engine
    stream_tokens:      Annotated[List[str], operator.add]  # SSE stream buffer

def build_agent_graph() -> StateGraph:
    from agents.router import router_node
    from agents.rag_agent import rag_node
    from agents.social_agent import social_node
    from agents.code_agent import code_node
    from agents.memory_manager import memory_node
    from agents.digital_twin_engine import persona_node
    from agents.ambient_intelligence import ambient_node

    graph = StateGraph(AgentState)
    
    # Add nodes
    graph.add_node("router",       router_node)
    graph.add_node("rag",          rag_node)
    graph.add_node("social",       social_node)
    graph.add_node("code",         code_node)
    graph.add_node("memory",       memory_node)      # runs in parallel
    graph.add_node("persona",      persona_node)     # final voice/tone pass
    graph.add_node("ambient",      ambient_node)     # proactive suggestions
    
    # Set entry point
    graph.set_entry_point("router")
    
    # Conditional routing from router
    graph.add_conditional_edges(
        "router",
        lambda state: state["intent"],
        {
            "personal_info":    "rag",
            "projects":         "rag",
            "technical_skill":  "code",
            "social_proof":     "social",
            "code_walkthrough": "code",
            "small_talk":       "persona",   # skip RAG for small talk
            "out_of_scope":     "persona",
        }
    )
    
    # All specialist agents → persona engine
    for node in ["rag", "social", "code"]:
        graph.add_edge(node, "persona")
    
    # Persona → ambient (proactive suggestions)
    graph.add_edge("persona", "ambient")
    graph.add_edge("ambient", "memory")   # save to memory after response
    graph.add_edge("memory", END)
    
    return graph.compile()

# Singleton compiled graph
compiled_graph = build_agent_graph()

# Test function (used by: make debug-agents)
def test_graph():
    test_state = {
        "session_id": "test-123",
        "user_id": None,
        "message": "What are your best AI projects?",
        "visitor_persona": "technical_recruiter",
        "company_context": None,
        "visit_count": 1,
        "working_memory": [],
        "episodic_summary": "",
        "stream_tokens": [],
    }
    result = compiled_graph.invoke(test_state)
    print("✅ Graph test passed")
    print(f"Intent detected: {result['intent']}")
    print(f"Response preview: {result['final_response'][:200]}...")
    return result
```

---

## SECTION 9 — PROMPT FACTORY (TOKEN-BUDGETED)

```python
# backend/llm/prompt_factory.py
# Single place where ALL prompts are assembled. Never build prompts elsewhere.

import tiktoken
from dataclasses import dataclass
from typing import Optional

ENCODING = tiktoken.get_encoding("cl100k_base")

# Token budgets per model (stay under context window with headroom)
TOKEN_BUDGETS = {
    "llama3.2:3b":    {"system": 600,  "context": 800,  "history": 400, "response": 300},
    "qwen2.5:3b":     {"system": 700,  "context": 1000, "history": 400, "response": 500},
    "phi4-mini:latest": {"system": 800, "context": 1200, "history": 600, "response": 600},
}

MASTER_SYSTEM_TEMPLATE = """You are {owner_name}'s digital presence — his AI representative.
You speak in first person as a knowledgeable proxy for {owner_name}.
You are warm, direct, technically precise, and occasionally dry in your humor.

VISITOR PROFILE:
Persona: {visitor_persona}
{company_context}
Visit count: {visit_count}

YOUR KNOWLEDGE:
{rag_chunks}

{kg_context}

RECENT CONTEXT:
{episodic_summary}

{persona_instructions}

RULES:
- Ground every claim in a specific project or experience
- Never say "As an AI language model"
- Never hallucinate — if uncertain, say "I'd need to check that"
- Cite sources inline: [from: project-name]
- Keep responses under 280 words unless deep-dive is requested
- End with one follow-up question or offer

{conversion_instruction}
"""

PERSONA_INSTRUCTIONS = {
    "technical_recruiter": """
RECRUITER MODE: Lead with seniority indicators, tech stack, and quantified impact.
Translate technical details into business outcomes. Offer to generate a PDF brief.""",
    
    "senior_engineer": """
ENGINEER MODE: Skip introductions. Go deep on architecture, tradeoffs, failure modes.
Show code when relevant. Discuss what you'd do differently. Treat them as a peer.""",
    
    "engineering_manager": """
MANAGER MODE: Balance technical credibility with team/leadership signals.
Highlight: mentorship, delivery under uncertainty, cross-team communication.""",
    
    "startup_founder": """
FOUNDER MODE: Emphasize full-stack ownership, shipping velocity, cost-efficiency.
Highlight: autonomy, ambiguity tolerance, 0→1 experience.""",
    
    "casual": """
CASUAL MODE: High-level story. Make it interesting. No jargon.""",
}

@dataclass
class BuiltPrompt:
    system: str
    messages: list
    total_tokens: int
    model_used: str

class PromptFactory:
    def build(
        self,
        model: str,
        owner_name: str,
        visitor_persona: str,
        rag_chunks: list,
        kg_context: str,
        episodic_summary: str,
        conversation_history: list,
        user_message: str,
        company_context: Optional[str] = None,
        visit_count: int = 1,
        conversion_action: str = "none",
    ) -> BuiltPrompt:
        
        budget = TOKEN_BUDGETS.get(model, TOKEN_BUDGETS["llama3.2:3b"])
        
        # Format RAG chunks (respect context budget)
        chunks_text = self._format_chunks(rag_chunks, budget["context"])
        
        # Build system prompt
        system = MASTER_SYSTEM_TEMPLATE.format(
            owner_name=owner_name,
            visitor_persona=visitor_persona,
            company_context=f"Company: {company_context}" if company_context else "",
            visit_count=visit_count,
            rag_chunks=chunks_text,
            kg_context=f"KNOWLEDGE GRAPH:\n{kg_context}" if kg_context else "",
            episodic_summary=episodic_summary,
            persona_instructions=PERSONA_INSTRUCTIONS.get(visitor_persona, PERSONA_INSTRUCTIONS["casual"]),
            conversion_instruction=self._get_conversion_instruction(conversion_action),
        )
        
        # Trim system prompt to budget
        system = self._trim_to_budget(system, budget["system"])
        
        # Build history (trimmed to budget)
        history = self._build_history(conversation_history, budget["history"])
        
        messages = history + [{"role": "user", "content": user_message}]
        
        total = self._count_tokens(system) + sum(
            self._count_tokens(m["content"]) for m in messages
        )
        
        return BuiltPrompt(
            system=system,
            messages=messages,
            total_tokens=total,
            model_used=model,
        )
    
    def _count_tokens(self, text: str) -> int:
        return len(ENCODING.encode(text))
    
    def _trim_to_budget(self, text: str, max_tokens: int) -> str:
        tokens = ENCODING.encode(text)
        if len(tokens) <= max_tokens:
            return text
        return ENCODING.decode(tokens[:max_tokens]) + "\n[truncated for context budget]"
    
    def _format_chunks(self, chunks: list, max_tokens: int) -> str:
        result = []
        used = 0
        for chunk in chunks:
            line = f"[{chunk.get('source', 'unknown')}] {chunk.get('content', '')}"
            tokens = self._count_tokens(line)
            if used + tokens > max_tokens:
                break
            result.append(line)
            used += tokens
        return "\n\n".join(result) if result else "No specific context retrieved."
    
    def _get_conversion_instruction(self, action: str) -> str:
        instructions = {
            "brief":      "After 2-3 more exchanges, offer: 'Want me to generate a recruiter brief PDF?'",
            "interview":  "Offer to enter Interview Simulation mode if they're interested in technical depth.",
            "walkthrough":"Offer to walk through the code of any project mentioned.",
        }
        return instructions.get(action, "")
    
    def _build_history(self, history: list, max_tokens: int) -> list:
        trimmed = []
        used = 0
        for msg in reversed(history[-10:]):
            tokens = self._count_tokens(msg.get("content", ""))
            if used + tokens > max_tokens:
                break
            trimmed.insert(0, msg)
            used += tokens
        return trimmed
```

---

## SECTION 10 — RAG PIPELINE (COMPLETE)

```python
# backend/rag/hybrid_search.py
# Two-stage retrieval: Dense (Qdrant) + BM25 sparse + RRF fusion + ColBERT reranking

import asyncio
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import SearchRequest, Filter, FieldCondition, MatchValue
from rank_bm25 import BM25Okapi
from typing import List, Dict
import numpy as np

class HybridSearchEngine:
    def __init__(self, qdrant_client: AsyncQdrantClient, ollama_client):
        self.qdrant = qdrant_client
        self.ollama = ollama_client
        self.bm25_index = None          # Built during ingestion
        self.bm25_docs = []             # Parallel list of doc content
        self.colbert = None             # Lazy loaded
    
    async def search(
        self,
        query: str,
        persona: str = "casual",
        top_k: int = 5,
        use_colbert: bool = True,
    ) -> List[Dict]:
        
        # Step 1: HyDE — generate hypothetical answer to improve embedding
        hyde_query = await self._hyde_expand(query)
        
        # Step 2: Embed the HyDE-expanded query
        query_vector = await self._embed(hyde_query)
        
        # Step 3: Dense retrieval (Qdrant) — top 20
        dense_results = await self.qdrant.search(
            collection_name="portfolio_knowledge",
            query_vector=query_vector,
            limit=20,
            with_payload=True,
        )
        
        # Step 4: Sparse retrieval (BM25) — top 20
        sparse_results = self._bm25_search(query, top_k=20)
        
        # Step 5: RRF fusion (Reciprocal Rank Fusion)
        fused = self._rrf_fusion(dense_results, sparse_results)
        
        # Step 6: ColBERT reranking (if enabled and available)
        if use_colbert and len(fused) > 0:
            fused = await self._colbert_rerank(query, fused, top_k=top_k)
        else:
            fused = fused[:top_k]
        
        return fused
    
    async def _hyde_expand(self, query: str) -> str:
        """Generate a hypothetical answer to create a richer query embedding."""
        prompt = f"""Generate a short (2-3 sentence) answer to this question about
        a software engineer's portfolio. Don't use any real facts — 
        just generate what an ideal answer MIGHT look like:
        
        Question: {query}
        
        Hypothetical answer:"""
        
        response = await self.ollama.generate(
            model="llama3.2:3b",
            prompt=prompt,
            options={"num_predict": 100}
        )
        return response["response"]
    
    async def _embed(self, text: str) -> List[float]:
        response = await self.ollama.embeddings(
            model="nomic-embed-text",
            prompt=text,
        )
        return response["embedding"]
    
    def _bm25_search(self, query: str, top_k: int) -> List[Dict]:
        if not self.bm25_index:
            return []
        query_tokens = query.lower().split()
        scores = self.bm25_index.get_scores(query_tokens)
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [
            {"id": i, "score": float(scores[i]), "payload": self.bm25_docs[i]}
            for i in top_indices if scores[i] > 0
        ]
    
    def _rrf_fusion(self, dense: list, sparse: list, k: int = 60) -> list:
        """Reciprocal Rank Fusion: score = sum(1 / (k + rank))"""
        scores = {}
        
        for rank, doc in enumerate(dense):
            doc_id = str(doc.id if hasattr(doc, 'id') else doc.get('id'))
            scores[doc_id] = scores.get(doc_id, {"score": 0, "doc": doc})
            scores[doc_id]["score"] += 1.0 / (k + rank + 1)
        
        for rank, doc in enumerate(sparse):
            doc_id = str(doc.get('id', f"sparse_{rank}"))
            if doc_id not in scores:
                scores[doc_id] = {"score": 0, "doc": doc}
            scores[doc_id]["score"] += 1.0 / (k + rank + 1)
        
        sorted_docs = sorted(scores.values(), key=lambda x: x["score"], reverse=True)
        return [item["doc"] for item in sorted_docs]
    
    async def _colbert_rerank(self, query: str, candidates: list, top_k: int) -> list:
        """Two-stage: ColBERT for speed, cross-encoder for precision."""
        if self.colbert is None:
            from ragatouille import RAGPretrainedModel
            self.colbert = RAGPretrainedModel.from_pretrained("colbert-ir/colbertv2.0")
        
        texts = [
            c.payload.get("content", "") if hasattr(c, "payload") 
            else c.get("payload", {}).get("content", "")
            for c in candidates
        ]
        
        reranked = self.colbert.rerank(query=query, documents=texts, k=top_k)
        return [candidates[r["result_index"]] for r in reranked]

# Test function (used by: make debug-rag)
async def test_search():
    from db.connections import get_qdrant_client, get_ollama_client
    engine = HybridSearchEngine(
        qdrant_client=get_qdrant_client(),
        ollama_client=get_ollama_client()
    )
    results = await engine.search("Tell me about your best AI project")
    print(f"✅ Search returned {len(results)} results")
    for r in results[:3]:
        print(f"  - {r}")
```

---

## SECTION 11 — THREE-TIER MEMORY SYSTEM

```python
# backend/memory/working_memory.py
# Tier 1: Redis — fast, short-lived session context

import json
import redis.asyncio as aioredis
from typing import List, Dict, Optional

class WorkingMemory:
    """
    Tier 1 memory: last 10 conversation turns per session.
    TTL: 2 hours (sliding window on each write).
    Key format: memory:session:{session_id}
    Max size: 2KB per session (enforced).
    """
    
    def __init__(self, redis_client: aioredis.Redis):
        self.redis = redis_client
        self.TTL = 7200          # 2 hours
        self.MAX_TURNS = 10
    
    async def get(self, session_id: str) -> List[Dict]:
        key = f"memory:session:{session_id}"
        data = await self.redis.get(key)
        if not data:
            return []
        await self.redis.expire(key, self.TTL)  # Sliding TTL
        return json.loads(data)
    
    async def append(self, session_id: str, role: str, content: str):
        key = f"memory:session:{session_id}"
        turns = await self.get(session_id)
        turns.append({"role": role, "content": content})
        
        # Keep last N turns only
        if len(turns) > self.MAX_TURNS:
            turns = turns[-self.MAX_TURNS:]
        
        # Enforce 2KB max (safety net)
        serialized = json.dumps(turns)
        if len(serialized) > 2048:
            turns = turns[-5:]
            serialized = json.dumps(turns)
        
        await self.redis.setex(key, self.TTL, serialized)
    
    async def clear(self, session_id: str):
        await self.redis.delete(f"memory:session:{session_id}")

def test_memory():
    """Synchronous test runner — called by make debug-memory"""
    import asyncio
    from db.connections import get_redis_client
    
    async def run():
        mem = WorkingMemory(await get_redis_client())
        session = "test-session-debug"
        await mem.append(session, "user", "Hello")
        await mem.append(session, "assistant", "Hi! I'm Aman's AI.")
        turns = await mem.get(session)
        assert len(turns) == 2, f"Expected 2 turns, got {len(turns)}"
        await mem.clear(session)
        print("✅ WorkingMemory test passed")
    
    asyncio.run(run())
```

```python
# backend/memory/episodic_memory.py
# Tier 2: PostgreSQL + pgvector — long-term per-user episodes

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
import json

class EpisodicMemory:
    """
    Tier 2 memory: distilled episode summaries per user.
    Written every 10 turns (compression trigger).
    Retrieved via pgvector cosine similarity on episode embeddings.
    """
    
    async def get_relevant_episodes(
        self, 
        user_id: str, 
        current_query: str,
        ollama_client,
        db: AsyncSession,
        limit: int = 3
    ) -> str:
        # Embed the current query
        embedding = await ollama_client.embeddings(
            model="nomic-embed-text",
            prompt=current_query,
        )
        vec = embedding["embedding"]
        
        # Vector similarity search on user's episodes
        result = await db.execute(text("""
            SELECT summary, key_facts, created_at
            FROM user_episodes
            WHERE user_id = :user_id
            ORDER BY embedding <=> :query_vec::vector
            LIMIT :limit
        """), {
            "user_id": user_id,
            "query_vec": str(vec),
            "limit": limit,
        })
        
        rows = result.fetchall()
        if not rows:
            return ""
        
        summaries = []
        for row in rows:
            facts = json.loads(row.key_facts or "[]")
            summaries.append(f"[{row.created_at.date()}] {row.summary}")
            if facts:
                summaries.append(f"  Key facts: {', '.join(facts[:3])}")
        
        return "\n".join(summaries)
    
    async def compress_and_save(
        self,
        user_id: str,
        session_id: str,
        turns: list,
        ollama_client,
        db: AsyncSession,
    ):
        """
        Called by memory_manager every 10 turns.
        Uses llama3.2:3b to generate a summary.
        """
        conversation_text = "\n".join([
            f"{t['role'].upper()}: {t['content']}" for t in turns
        ])
        
        compression_prompt = f"""Summarize this conversation in 2-3 sentences.
        Extract 3-5 key facts about the visitor (their interests, role, what they care about).
        
        Conversation:
        {conversation_text}
        
        Output JSON: {{"summary": "...", "key_facts": ["...", "..."]}}"""
        
        response = await ollama_client.generate(
            model="llama3.2:3b",
            prompt=compression_prompt,
        )
        
        try:
            result = json.loads(response["response"])
        except json.JSONDecodeError:
            result = {"summary": response["response"][:500], "key_facts": []}
        
        # Embed the summary for future retrieval
        embedding = await ollama_client.embeddings(
            model="nomic-embed-text",
            prompt=result["summary"],
        )
        
        await db.execute(text("""
            INSERT INTO user_episodes 
            (user_id, session_id, summary, key_facts, embedding, created_at)
            VALUES (:user_id, :session_id, :summary, :key_facts, :embedding, NOW())
        """), {
            "user_id": user_id,
            "session_id": session_id,
            "summary": result["summary"],
            "key_facts": json.dumps(result["key_facts"]),
            "embedding": str(embedding["embedding"]),
        })
        await db.commit()
```

---

## SECTION 12 — POSTGRESQL SCHEMA (COMPLETE)

```sql
-- backend/db/init_schema.sql
-- Run once on first startup. Auto-runs via docker-entrypoint-initdb.d

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fast text search

-- ── User Sessions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitor_sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      VARCHAR(64) UNIQUE NOT NULL,
    user_id         VARCHAR(64),          -- NULL for anonymous
    anonymous_id    VARCHAR(32),          -- Hash of IP+UA+date
    persona         VARCHAR(64),
    company         VARCHAR(128),
    referrer        VARCHAR(512),
    first_seen      TIMESTAMP DEFAULT NOW(),
    last_seen       TIMESTAMP DEFAULT NOW(),
    visit_count     INTEGER DEFAULT 1,
    engagement_score FLOAT DEFAULT 0.0,
    converted       BOOLEAN DEFAULT FALSE
);

CREATE INDEX ON visitor_sessions (session_id);
CREATE INDEX ON visitor_sessions (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX ON visitor_sessions (anonymous_id) WHERE anonymous_id IS NOT NULL;

-- ── Episodic Memory ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_episodes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     VARCHAR(64) NOT NULL,
    session_id  VARCHAR(64) NOT NULL,
    summary     TEXT NOT NULL,
    key_facts   JSONB DEFAULT '[]',
    embedding   vector(768),
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON user_episodes (user_id);
CREATE INDEX ON user_episodes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── Conversation Logs (for DSPy training data) ───────────────
CREATE TABLE IF NOT EXISTS conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id      VARCHAR(64) NOT NULL,
    turn_index      INTEGER NOT NULL,
    role            VARCHAR(16) NOT NULL,
    content         TEXT NOT NULL,
    intent          VARCHAR(64),
    persona         VARCHAR(64),
    model_used      VARCHAR(64),
    latency_ms      INTEGER,
    rag_chunk_ids   JSONB DEFAULT '[]',
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON conversations (session_id);
CREATE INDEX ON conversations (created_at);

-- ── Conversion Events ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversion_events (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id  VARCHAR(64) NOT NULL,
    event_type  VARCHAR(64) NOT NULL,  -- brief_requested, contact_clicked, etc.
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON conversion_events (session_id);

-- ── Knowledge Graph Entities ──────────────────────────────────
CREATE TABLE IF NOT EXISTS kg_entities (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(64) NOT NULL,  -- project, skill, technology, company
    name        VARCHAR(256) NOT NULL,
    properties  JSONB DEFAULT '{}',
    embedding   vector(768),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX ON kg_entities (entity_type, name);

-- ── Knowledge Graph Relations ─────────────────────────────────
CREATE TABLE IF NOT EXISTS kg_relations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id       UUID REFERENCES kg_entities(id),
    target_id       UUID REFERENCES kg_entities(id),
    relation_type   VARCHAR(64) NOT NULL,  -- uses, built_with, deployed_on
    weight          FLOAT DEFAULT 1.0,
    properties      JSONB DEFAULT '{}'
);

CREATE INDEX ON kg_relations (source_id);
CREATE INDEX ON kg_relations (target_id);

-- ── RAG Quality Metrics ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS rag_quality_metrics (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measured_at         TIMESTAMP DEFAULT NOW(),
    faithfulness        FLOAT,
    context_precision   FLOAT,
    context_recall      FLOAT,
    answer_relevancy    FLOAT,
    num_questions       INTEGER,
    below_threshold     BOOLEAN DEFAULT FALSE
);

-- ── DSPy Optimization Runs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS dspy_optimization_runs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_at          TIMESTAMP DEFAULT NOW(),
    baseline_score  FLOAT,
    new_score       FLOAT,
    improvement     FLOAT,
    deployed        BOOLEAN DEFAULT FALSE,
    prompt_version  VARCHAR(64)
);

COMMIT;
```

---

## SECTION 13 — FRONTEND: THE CINEMATIC UI

### Design System (Tailwind config)

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ANTIGRAVITY palette — dark, electric, deep
        void:     '#0a0a0f',      // background
        surface:  '#12121a',      // cards
        border:   '#1e1e2e',      // borders
        muted:    '#2a2a3d',      // subtle elements
        
        electric: '#6366f1',      // primary accent (indigo)
        pulse:    '#10b981',      // secondary accent (emerald)
        warn:     '#f59e0b',      // amber
        ghost:    '#64748b',      // muted text
        
        text:     '#e2e8f0',      // primary text
        dim:      '#94a3b8',      // secondary text
      },
      fontFamily: {
        sans:  ['Geist', 'system-ui', 'sans-serif'],
        mono:  ['Geist Mono', 'monospace'],
      },
      animation: {
        'pulse-slow':   'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':        'float 6s ease-in-out infinite',
        'typewriter':   'typewriter 2s steps(40) forwards',
        'glow':         'glow 2s ease-in-out infinite alternate',
      },
    },
  },
}
```

### Hero with Three.js Constellation

```tsx
// frontend/components/canvas/ConstellationHero.tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ConstellationHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    camera.position.z = 5;
    
    // Create particle field (1500 particles — performant on mobile)
    const particleCount = 1500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      // Electric indigo / emerald mix
      const t = Math.random();
      colors[i * 3]     = t > 0.5 ? 0.388 : 0.063;   // R
      colors[i * 3 + 1] = t > 0.5 ? 0.400 : 0.722;   // G
      colors[i * 3 + 2] = t > 0.5 ? 0.941 : 0.506;   // B
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Mouse interaction
    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
    };
    window.addEventListener("mousemove", handleMouseMove);
    
    // Animation loop
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      particles.rotation.y += 0.0003;
      particles.rotation.x += 0.0001;
      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };
    animate();
    
    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: "#0a0a0f" }}
    />
  );
}
```

### Chat Widget (SSE Streaming)

```tsx
// frontend/components/agents/ChatWidget.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Message = { role: "user" | "assistant"; content: string; sources?: string[] };

export function ChatWidget() {
  const [open,     setOpen]    = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]   = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);
    
    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          session_id: getSessionId(),
        }),
      });
      
      if (!response.body) throw new Error("No stream");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  return [...updated.slice(0, -1), {
                    ...last,
                    content: last.content + parsed.token,
                    sources: parsed.sources || last.sources,
                  }];
                });
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setMessages(prev => [...prev.slice(0, -1), {
        role: "assistant",
        content: "I hit a brief issue. Try again?",
      }]);
    } finally {
      setStreaming(false);
    }
  }, [input, streaming]);
  
  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-electric text-white
          flex items-center justify-center
          shadow-lg shadow-electric/30
          hover:scale-110 transition-transform
          ${open ? "hidden" : "flex"}
        `}
        aria-label="Open AI chat"
      >
        <span className="text-2xl">⚡</span>
      </button>
      
      {/* Chat panel */}
      {open && (
        <div className="
          fixed bottom-0 right-0 z-50
          w-full sm:w-96 h-[600px] sm:bottom-6 sm:right-6
          bg-surface border border-border rounded-2xl
          flex flex-col overflow-hidden
          shadow-2xl shadow-black/50
        ">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-electric/20 flex items-center justify-center">
                <span className="text-electric text-sm">A</span>
              </div>
              <div>
                <p className="text-text text-sm font-medium">Aman's AI</p>
                <p className="text-pulse text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-pulse inline-block animate-pulse" />
                  Live
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-ghost hover:text-text">✕</button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-dim text-sm text-center mt-8">
                Ask me anything about Aman's work, skills, or projects.
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`
                  max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                  ${msg.role === "user"
                    ? "bg-electric text-white rounded-br-sm"
                    : "bg-muted text-text rounded-bl-sm"}
                `}>
                  {msg.content}
                  {streaming && i === messages.length - 1 && msg.role === "assistant" && (
                    <span className="inline-block w-0.5 h-4 bg-electric ml-0.5 animate-pulse" />
                  )}
                  {msg.sources?.length && (
                    <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-1">
                      {msg.sources.map((s, j) => (
                        <span key={j} className="text-xs text-pulse">
                          [{s}]
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask anything..."
                disabled={streaming}
                className="
                  flex-1 bg-muted text-text text-sm rounded-xl px-4 py-3
                  border border-border focus:border-electric outline-none
                  placeholder:text-ghost disabled:opacity-50
                "
              />
              <button
                onClick={sendMessage}
                disabled={streaming || !input.trim()}
                className="
                  bg-electric text-white rounded-xl px-4 py-3 text-sm
                  hover:bg-electric/80 disabled:opacity-50 transition-colors
                "
              >
                {streaming ? "…" : "→"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getSessionId(): string {
  const key = "antigravity_session";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}
```

---

## SECTION 14 — NGINX CONFIG (PRODUCTION)

```nginx
# infra/nginx/nginx.conf

events { worker_connections 1024; }

http {
    # ── Security headers ─────────────────────────────────────
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Strict-Transport-Security "max-age=31536000" always;
    
    # ── Rate limiting (per IP) ────────────────────────────────
    limit_req_zone $binary_remote_addr zone=chat:10m rate=20r/m;
    limit_req_zone $binary_remote_addr zone=api:10m  rate=60r/m;
    
    # ── Gzip ─────────────────────────────────────────────────
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    
    upstream frontend { server frontend:3000; }
    upstream api      { server api:8000; }
    
    server {
        listen 80;
        
        # ── Chat API (SSE + rate limit) ───────────────────────
        location /api/chat {
            limit_req zone=chat burst=5 nodelay;
            proxy_pass http://api;
            
            # SSE settings
            proxy_set_header Connection '';
            proxy_http_version 1.1;
            chunked_transfer_encoding on;
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 120s;
            
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        
        # ── Voice WebSocket ───────────────────────────────────
        location /api/voice {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_read_timeout 300s;
        }
        
        # ── Other API routes ──────────────────────────────────
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # ── GitHub Webhook ────────────────────────────────────
        location /api/webhook/ {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # ── Frontend ──────────────────────────────────────────
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

---

## SECTION 15 — SECURITY: PROMPT INJECTION DEFENSE

```python
# backend/security/injection_detector.py

import re
from typing import Tuple

# Known injection patterns — keep updated
INJECTION_PATTERNS = [
    r"ignore (all |previous |above |your )?instructions",
    r"forget (all |previous |your )?instructions",
    r"you are now",
    r"new (role|persona|identity|instructions)",
    r"system prompt",
    r"repeat (your |the )?system",
    r"what were you told",
    r"pretend (you are|to be)",
    r"DAN mode",
    r"developer mode",
    r"jailbreak",
    r"<\|system\|>",
    r"\[INST\]",
    r"OVERRIDE:",
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]

def check_injection(message: str) -> Tuple[bool, str]:
    """
    Returns (is_injection, matched_pattern).
    User input is ALWAYS injected as USER role — never SYSTEM.
    This is a defense-in-depth layer.
    """
    for pattern in COMPILED_PATTERNS:
        match = pattern.search(message)
        if match:
            return True, match.group(0)
    return False, ""

def sanitize_input(message: str) -> str:
    """Clean input before LLM injection."""
    # Strip null bytes
    message = message.replace("\x00", "")
    # Normalize unicode
    message = message.encode("utf-8", errors="replace").decode("utf-8")
    # Limit length
    return message[:2000]
```

---

## SECTION 16 — CIRCUIT BREAKER + LLM MODEL ROUTER

```python
# backend/llm/router.py
# Decides which model to use for each request.
# Falls back gracefully: phi4 → qwen2.5 → llama3.2 → haiku

from enum import Enum
from config import settings
from reliability.circuit_breaker import CIRCUIT_BREAKERS, CircuitOpenError

class ModelChoice(str, Enum):
    FAST      = "llama3.2:3b"
    CODE      = "qwen2.5:3b"
    DEEP      = "phi4-mini:latest"
    VISION    = "llava:7b"
    EMBED     = "nomic-embed-text"
    RERANK    = "mxbai-rerank-large"
    FALLBACK  = "claude-haiku-4-5-20251001"

INTENT_MODEL_MAP = {
    "small_talk":       ModelChoice.FAST,
    "casual":           ModelChoice.FAST,
    "out_of_scope":     ModelChoice.FAST,
    "personal_info":    ModelChoice.FAST,
    "social_proof":     ModelChoice.FAST,
    "projects":         ModelChoice.DEEP,
    "technical_skill":  ModelChoice.CODE,
    "code_walkthrough": ModelChoice.CODE,
    "interview_sim":    ModelChoice.DEEP,
    "persona_synthesis":ModelChoice.DEEP,
    "dspy_optimization":ModelChoice.DEEP,
}

async def select_model(intent: str, persona: str) -> str:
    preferred = INTENT_MODEL_MAP.get(intent, ModelChoice.FAST)
    
    # Check circuit breaker for Ollama
    if CIRCUIT_BREAKERS["ollama_primary"].is_open():
        if settings.ANTHROPIC_API_KEY:
            return ModelChoice.FALLBACK
        else:
            # Fallback to smallest local model
            return ModelChoice.FAST
    
    # Engineers and interview mode → always use deepest model
    if persona == "senior_engineer" and intent in ["projects", "technical_skill"]:
        return ModelChoice.DEEP
    
    return preferred
```

---

## SECTION 17 — DEBUG CHECKLIST (RUN AFTER FIRST BOOT)

Use this checklist to verify every layer works before wiring them together:

```
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — POST-STARTUP DEBUG CHECKLIST
Run each command. All should show ✅ before proceeding.
═══════════════════════════════════════════════════════════

STEP 1: Core services
  make health-dev
  Expected: ✅ API up, ✅ Ollama up

STEP 2: Database
  docker exec antigravity-postgres psql -U $POSTGRES_USER -d $POSTGRES_DB \
    -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
  Expected: visitor_sessions, user_episodes, conversations, kg_entities, ...

STEP 3: Redis
  docker exec antigravity-redis redis-cli SET test "ok" && \
  docker exec antigravity-redis redis-cli GET test
  Expected: OK, then "ok"

STEP 4: Qdrant
  curl http://localhost:6333/collections
  Expected: {"result":{"collections":[]}} or with your collections

STEP 5: Ollama model
  curl http://localhost:11434/api/generate \
    -d '{"model":"llama3.2:3b","prompt":"Say OK","stream":false}'
  Expected: JSON with "response": "OK"

STEP 6: Embedding
  curl http://localhost:11434/api/embeddings \
    -d '{"model":"nomic-embed-text","prompt":"test"}'
  Expected: JSON with "embedding": [0.123, ...]  (768 floats)

STEP 7: API health (degradation tier)
  curl http://localhost:8000/api/health | python -m json.tool
  Expected: {"tier": 1, "all_services": true, ...}

STEP 8: RAG test
  make debug-rag
  Expected: ✅ Search returned N results

STEP 9: Agent graph test
  make debug-agents
  Expected: ✅ Graph test passed, Intent detected: ...

STEP 10: Memory test
  make debug-memory
  Expected: ✅ WorkingMemory test passed

STEP 11: Full chat test (the real thing)
  curl -X POST http://localhost:8000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "What are your best AI projects?", "session_id": "debug-test"}' \
    --no-buffer
  Expected: SSE stream of tokens ending in [DONE]

STEP 12: Frontend loads
  Open http://localhost:3000
  Expected: Constellation hero, chat widget visible

═══════════════════════════════════════════════════════════
ALL 12 STEPS PASSING = SYSTEM IS PRODUCTION READY
═══════════════════════════════════════════════════════════
```

---

## SECTION 18 — COMPLETE STARTUP SEQUENCE

Start services in this exact order (handled automatically by docker compose depends_on):

```
ORDER   SERVICE                 WAIT FOR
─────────────────────────────────────────────
  1     postgres                healthcheck
  2     redis                   healthcheck  
  3     qdrant                  healthcheck
  4     ollama                  healthcheck (slow — 30s)
  5     api                     postgres + redis + qdrant ready
  6     celery-worker           api ready
  7     celery-beat             celery-worker ready
  8     frontend                api ready
  9     nginx                   frontend + api ready
 10     langfuse                postgres ready
 11     prometheus              api ready
 12     grafana                 prometheus ready
 13     minio                   (independent)
 14     umami                   postgres ready
 15     ntfy                    (independent)
 16     temporal                postgres ready
 17     temporal-ui             temporal ready
```

---

## SECTION 19 — VISITOR INTELLIGENCE (PERSONA ENGINE)

```python
# backend/intelligence/visitor_classifier.py

from enum import Enum
from pydantic import BaseModel
from typing import Optional, List
import hashlib

class VisitorPersona(str, Enum):
    TECHNICAL_RECRUITER  = "technical_recruiter"
    ENGINEERING_MANAGER  = "engineering_manager"
    SENIOR_ENGINEER      = "senior_engineer"
    STARTUP_FOUNDER      = "startup_founder"
    CASUAL               = "casual"

REFERRER_SIGNALS = {
    "linkedin.com/jobs":    (VisitorPersona.TECHNICAL_RECRUITER, 0.80),
    "lever.co":             (VisitorPersona.TECHNICAL_RECRUITER, 0.85),
    "greenhouse.io":        (VisitorPersona.TECHNICAL_RECRUITER, 0.85),
    "wellfound.com":        (VisitorPersona.STARTUP_FOUNDER,     0.70),
    "ycombinator.com":      (VisitorPersona.STARTUP_FOUNDER,     0.75),
    "github.com":           (VisitorPersona.SENIOR_ENGINEER,     0.70),
    "news.ycombinator.com": (VisitorPersona.SENIOR_ENGINEER,     0.65),
    "reddit.com/r/cscareer":(VisitorPersona.TECHNICAL_RECRUITER, 0.60),
}

COMPANY_SIGNALS = {
    # FAANG → senior engineer or EM
    "google.com":     VisitorPersona.SENIOR_ENGINEER,
    "meta.com":       VisitorPersona.SENIOR_ENGINEER,
    "amazon.com":     VisitorPersona.ENGINEERING_MANAGER,
    "apple.com":      VisitorPersona.SENIOR_ENGINEER,
    "microsoft.com":  VisitorPersona.SENIOR_ENGINEER,
    "netflix.com":    VisitorPersona.SENIOR_ENGINEER,
    # Startups
    "stripe.com":     VisitorPersona.STARTUP_FOUNDER,
    "openai.com":     VisitorPersona.SENIOR_ENGINEER,
    "anthropic.com":  VisitorPersona.SENIOR_ENGINEER,
}

class VisitorClassifier:
    def classify(
        self,
        referrer: str = "",
        company_domain: str = "",
        utm_source: str = "",
        user_agent: str = "",
    ) -> tuple[VisitorPersona, float]:
        
        # Check referrer (strongest signal)
        for domain, (persona, confidence) in REFERRER_SIGNALS.items():
            if domain in referrer:
                return persona, confidence
        
        # Check company (strong signal)
        for domain, persona in COMPANY_SIGNALS.items():
            if domain in company_domain:
                return persona, 0.70
        
        # UTM source
        if utm_source in ["lever", "greenhouse", "ashby", "workday"]:
            return VisitorPersona.TECHNICAL_RECRUITER, 0.75
        
        # Default
        return VisitorPersona.CASUAL, 0.50
    
    def get_anonymous_id(self, ip: str, user_agent: str) -> str:
        from datetime import date
        raw = f"{ip}:{user_agent}:{date.today()}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]
```

---

## SECTION 20 — CELERY TASK SCHEDULE

```python
# backend/tasks/celery_app.py

from celery import Celery
from celery.schedules import crontab
import os

app = Celery("antigravity")
app.conf.broker_url = os.getenv("REDIS_URL")
app.conf.result_backend = os.getenv("REDIS_URL")

app.conf.beat_schedule = {
    # Every hour: sync GitHub (webhook handles real-time, this is backup)
    "github-sync": {
        "task":     "tasks.sync_tasks.sync_github",
        "schedule": crontab(minute=0),  # Every hour
    },
    # Every 3 hours: sync Instagram
    "instagram-sync": {
        "task":     "tasks.sync_tasks.sync_instagram",
        "schedule": crontab(minute=30, hour="*/3"),
    },
    # Every 6 hours: sync LinkedIn
    "linkedin-sync": {
        "task":     "tasks.sync_tasks.sync_linkedin",
        "schedule": crontab(minute=0, hour="*/6"),
    },
    # Every 30 minutes: freshness sweep
    "freshness-sweep": {
        "task":     "tasks.freshness_tasks.run_freshness_sweep",
        "schedule": crontab(minute="*/30"),
    },
    # Daily 4am: Ragas evaluation
    "ragas-eval": {
        "task":     "tasks.eval_tasks.run_ragas_evaluation",
        "schedule": crontab(hour=4, minute=0),
    },
    # Every Sunday 1am: DSPy optimization
    "dspy-optimization": {
        "task":     "tasks.dspy_tasks.run_optimization_cycle",
        "schedule": crontab(hour=1, minute=0, day_of_week=0),
    },
    # Daily 2am: KG rebuild
    "kg-rebuild": {
        "task":     "tasks.kg_tasks.rebuild_knowledge_graph",
        "schedule": crontab(hour=2, minute=0),
    },
    # Daily 3am: Memory compression
    "memory-compress": {
        "task":     "tasks.cleanup_tasks.compress_old_episodes",
        "schedule": crontab(hour=3, minute=0),
    },
}
```

---

## THE FINAL MASTER EXECUTION PROMPT

Hand this entire block to any LLM (GPT-4o, Claude Sonnet, Gemini) with the instruction:
"Build ANTIGRAVITY OS v4 step by step, starting with Phase 1."

```
═══════════════════════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — GENESIS BUILD — MASTER EXECUTION PROMPT
═══════════════════════════════════════════════════════════════════════════

You are building ANTIGRAVITY OS v4 — a production-grade, Docker-first,
agentic portfolio system. Build it phase by phase. After each phase,
verify using the debug checklist before proceeding.

ALL CODE MUST BE:
  - Runnable via Docker Compose (docker compose up --build)
  - Debuggable via: make debug-<service>
  - Self-documenting (every module has a test_ function)
  - Production-ready (error handling, logging, circuit breakers)

ABSOLUTE RULES:
  1. No hardcoded secrets — everything from .env
  2. No synchronous blocking calls in FastAPI routes — async everywhere
  3. User input NEVER injected into system prompt — always user role
  4. Every LLM call goes through ModelRouter (never direct Ollama)
  5. Every external call wrapped in circuit breaker
  6. Token budget ALWAYS enforced before LLM call (PromptFactory)
  7. Every service has healthcheck in docker-compose
  8. Streaming responses via SSE (never wait for full response)

TECH STACK (locked — do not substitute):
  Backend:      Python 3.12, FastAPI, LangGraph, LangChain
  Models:       Ollama (llama3.2:3b, qwen2.5:3b, phi4-mini, nomic-embed-text)
  RAG:          Qdrant + BM25 + RRF + RAGatouille/ColBERT
  Memory:       Redis (T1) + PostgreSQL/pgvector (T2) + Qdrant (T3)
  Structured:   Outlines (guaranteed JSON from local LLMs)
  Evals:        Ragas (RAG quality) + DSPy (prompt optimization)
  Analytics:    DuckDB (OLAP) + Umami (web analytics)
  Observability: LangFuse + Prometheus + Grafana
  Storage:      MinIO (S3-compatible, self-hosted)
  Frontend:     Next.js 14, Tailwind, Three.js, Framer Motion
  Infra:        Docker Compose, Nginx, Celery, ntfy

PHASE 1 — FOUNDATION (Days 1–3)
  Build and verify: make dev returns ✅ on all health checks
  
  Files to create:
    Makefile
    .env.genesis
    docker-compose.dev.yml
    backend/Dockerfile
    backend/requirements.txt
    backend/main.py          (FastAPI app + /health endpoint)
    backend/config.py        (pydantic-settings all env vars)
    backend/db/init_schema.sql
    infra/nginx/nginx.conf
  
  Verification: make dev && make health-dev (both ✅)

PHASE 2 — LLM + RAG CORE (Days 4–7)
  Build: Ollama client, PromptFactory, hybrid search, ingestion pipeline
  
  Files to create:
    backend/llm/ollama_client.py
    backend/llm/router.py
    backend/llm/prompt_factory.py
    backend/llm/structured_output.py  (Outlines integration)
    backend/rag/ingestor.py
    backend/rag/hybrid_search.py
    backend/rag/colbert_retriever.py
    backend/rag/hyde.py
    backend/rag/freshness.py
  
  Verification: make debug-rag (✅)

PHASE 3 — AGENT GRAPH (Days 8–12)
  Build: LangGraph StateGraph, all agent nodes, memory system
  
  Files to create:
    backend/agents/graph.py
    backend/agents/router.py
    backend/agents/rag_agent.py
    backend/agents/social_agent.py
    backend/agents/code_agent.py
    backend/agents/memory_manager.py
    backend/agents/digital_twin_engine.py
    backend/memory/working_memory.py
    backend/memory/episodic_memory.py
    backend/memory/semantic_memory.py
    backend/memory/owner_identity_cache.py
  
  Verification: make debug-agents (✅)

PHASE 4 — API + STREAMING (Days 13–15)
  Build: FastAPI routes, SSE streaming, WebSocket voice endpoint
  
  Files to create:
    backend/api/chat.py      (POST /api/chat → SSE)
    backend/api/voice.py     (WebSocket /api/voice)
    backend/api/health.py    (GET /api/health)
    backend/api/brief.py     (POST /api/brief)
    backend/api/webhook.py   (POST /api/webhook/github)
    backend/security/injection_detector.py
    backend/security/rate_limiter.py
    backend/reliability/circuit_breaker.py
    backend/reliability/health_orchestrator.py
  
  Verification: curl SSE chat test (step 11 of debug checklist)

PHASE 5 — FRONTEND (Days 16–20)
  Build: Next.js cinematic UI, chat widget, constellation hero
  
  Files to create:
    frontend/Dockerfile
    frontend/package.json
    frontend/app/layout.tsx
    frontend/app/page.tsx
    frontend/components/canvas/ConstellationHero.tsx
    frontend/components/agents/ChatWidget.tsx
    frontend/components/agents/VoiceAgent.tsx
    frontend/components/portfolio/ProjectGallery.tsx
    frontend/components/portfolio/ProjectCard.tsx
  
  Verification: http://localhost:3000 loads (step 12 of debug checklist)

PHASE 6 — INTELLIGENCE LAYERS (Days 21–25)
  Build: Visitor classifier, knowledge graph, ambient intelligence
  
  Files to create:
    backend/intelligence/visitor_classifier.py
    backend/intelligence/company_resolver.py
    backend/intelligence/github_semantic_analyzer.py
    backend/intelligence/github_event_processor.py
    backend/knowledge_graph/schema.py
    backend/knowledge_graph/builder.py
    backend/knowledge_graph/query.py
    backend/agents/ambient_intelligence.py
    backend/agents/interview_sim_agent.py
  
  Verification: POST /api/chat with ?debug=true shows persona in response

PHASE 7 — BACKGROUND TASKS (Days 26–28)
  Build: Celery tasks, scheduled syncs, data ingestion pipeline
  
  Files to create:
    backend/tasks/celery_app.py
    backend/tasks/ingest_tasks.py
    backend/tasks/sync_tasks.py
    backend/tasks/freshness_tasks.py
    backend/tasks/kg_tasks.py
    backend/tasks/eval_tasks.py
    backend/tasks/dspy_tasks.py
    backend/tasks/cleanup_tasks.py
  
  Verification: docker exec celery-worker celery inspect ping (✅)

PHASE 8 — OBSERVABILITY + PRODUCTION (Days 29–32)
  Build: Ragas eval, DSPy optimization, all observability services
  
  Files to create:
    backend/optimization/ragas_evaluator.py
    backend/optimization/dspy_optimizer.py
    backend/analytics/duckdb_engine.py
    backend/analytics/conversion_tracker.py
    docker-compose.yml (full production compose)
    infra/prometheus/prometheus.yml
    infra/grafana/dashboards/*.json
  
  Verification: make prod && all 12 debug steps pass

PHASE 9 — FINAL HARDENING (Days 33–35)
  Files to create/verify:
    backend/security/bot_detector.py
    backend/security/critical_info_vault.py
    backend/reliability/request_queue.py
    tests/test_rag.py
    tests/test_agents.py
    tests/test_memory.py
    tests/test_security.py
    .github/workflows/ci.yml
  
  Verification: make test (all passing)

═══════════════════════════════════════════════════════════════════════════
AFTER ALL 9 PHASES:
  - make prod starts everything
  - All 12 debug checks pass
  - make test runs clean
  - http://your-domain loads the cinematic portfolio
  - Chat widget streams responses from local Ollama
  - Grafana at :3002 shows live metrics
  - LangFuse at :3001 shows LLM traces
  - ntfy sends you a push when Google visits
═══════════════════════════════════════════════════════════════════════════
```

---

## THE 10 PRINCIPLES OF ANTIGRAVITY OS (UNCHANGED, PERMANENT)

1. **Persona-first everything** — Every feature asks "who is this for?" before "what does it do?"
2. **Ground every claim in evidence** — No abstractions. Every statement has a project behind it.
3. **Freshness is a first-class concern** — Stale knowledge is a lie.
4. **Proactive over reactive** — Surface the right thing at the right moment, unprompted.
5. **Authentic > Impressive** — Honest uncertainty converts better than confident hallucination.
6. **The portfolio is alive** — Every page load shows evidence of recent, active work.
7. **Conversion is the metric** — Beautiful demos mean nothing if they don't open doors.
8. **Self-healing by default** — Zero manual intervention. It improves itself.
9. **Graceful degradation always** — Users never see an error. Experience degrades smoothly.
10. **Own the visitor's mental model** — After every conversation, they know exactly what you're great at.

---

*End of ANTIGRAVITY OS v4 — GENESIS BUILD*
*Sections 1–20 + complete file tree + debug checklist + master execution prompt.*
*This document supersedes v1, v2, and v3.*
*The only thing left: `make dev`.*

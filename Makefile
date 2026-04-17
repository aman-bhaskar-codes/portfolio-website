# ═══════════════════════════════════════════════════════════
# ANTIGRAVITY OS v4 — GENESIS BUILD — Makefile
# All commands start here. Never run docker compose directly.
# ═══════════════════════════════════════════════════════════

.PHONY: dev prod debug clean pull-models init-db seed health logs stop test

# ── Development (laptop-friendly, 6 services) ──────────────
dev:
	@cp .env.genesis .env 2>/dev/null || true
	docker compose -f docker-compose.dev.yml up --build -d
	@echo "Waiting for services to be healthy..."
	@sleep 10
	$(MAKE) health-dev
	@echo ""
	@echo "✅ ANTIGRAVITY OS dev is running!"
	@echo "   Frontend:  http://localhost:3000"
	@echo "   API docs:  http://localhost:8000/docs"
	@echo "   Qdrant:    http://localhost:6333/dashboard"
	@echo ""
	@echo "Next: make pull-models && make init-db && make seed"

# ── Production (all services) ─────────────────────────────
prod:
	docker compose -f docker-compose.yml up --build -d
	@sleep 15
	$(MAKE) health
	@echo "✅ ANTIGRAVITY OS production is running!"

# ── Pull all Ollama models (run once after make dev) ──────
pull-models:
	@echo "Pulling Ollama models (this takes 10–30 minutes first time)..."
	docker exec antigravity-ollama ollama pull llama3.2:3b
	docker exec antigravity-ollama ollama pull qwen2.5:3b
	docker exec antigravity-ollama ollama pull phi4-mini:latest
	docker exec antigravity-ollama ollama pull nomic-embed-text
	docker exec antigravity-ollama ollama pull mxbai-rerank-large
	@echo "✅ Core models ready. For vision: make pull-llava"

pull-llava:
	docker exec antigravity-ollama ollama pull llava-phi3

# ── Initialize database ───────────────────────────────────
init-db:
	docker exec -i antigravity-postgres psql -U $${POSTGRES_USER:-antigravity} -d $${POSTGRES_DB:-antigravity} < backend/db/init_schema.sql
	@echo "✅ Database schema initialized"

# ── Seed initial data (run after init-db) ─────────────────
seed:
	docker exec antigravity-api python -c "from tasks.ingest_tasks import seed_all; seed_all()"
	@echo "✅ Initial documents ingested into RAG"

# ── Debug individual services ─────────────────────────────
debug-api:
	docker logs -f antigravity-api

debug-ollama:
	docker logs -f antigravity-ollama

debug-rag:
	docker exec -it antigravity-api python -c "from rag.hybrid_search import test_search; import asyncio; asyncio.run(test_search())"

debug-agents:
	docker exec -it antigravity-api python -c "from agents.graph import test_graph; test_graph()"

debug-memory:
	docker exec -it antigravity-api python -c "from memory.working_memory import test_memory; test_memory()"

# ── Health checks ─────────────────────────────────────────
health:
	@echo "Checking all services..."
	@curl -sf http://localhost:8000/api/health | python3 -m json.tool || echo "❌ API not ready"
	@curl -sf http://localhost:6333/readyz && echo "✅ Qdrant ready" || echo "❌ Qdrant not ready"
	@curl -sf http://localhost:11434/api/tags > /dev/null && echo "✅ Ollama ready" || echo "❌ Ollama not ready"
	@docker exec antigravity-redis redis-cli ping > /dev/null 2>&1 && echo "✅ Redis ready" || echo "❌ Redis not ready"
	@docker exec antigravity-postgres pg_isready > /dev/null 2>&1 && echo "✅ Postgres ready" || echo "❌ Postgres not ready"

health-dev:
	@curl -sf http://localhost:8000/health > /dev/null 2>&1 && echo "✅ API up" || echo "⏳ API starting..."
	@curl -sf http://localhost:11434/api/tags > /dev/null 2>&1 && echo "✅ Ollama up" || echo "⏳ Ollama starting..."

# ── View logs ─────────────────────────────────────────────
logs:
	docker compose logs -f api frontend

logs-api:
	docker compose logs -f api

# ── Stop everything ───────────────────────────────────────
stop:
	docker compose -f docker-compose.dev.yml down 2>/dev/null; \
	docker compose -f docker-compose.yml down 2>/dev/null; \
	echo "✅ All services stopped"

clean:
	docker compose -f docker-compose.dev.yml down -v --remove-orphans 2>/dev/null; \
	docker compose -f docker-compose.yml down -v --remove-orphans 2>/dev/null; \
	echo "✅ All containers and volumes removed"

# ── Run tests ─────────────────────────────────────────────
test:
	docker exec antigravity-api pytest tests/ -v --asyncio-mode=auto

test-e2e:
	npx playwright test --reporter=html

# ── Lint ──────────────────────────────────────────────────
lint:
	docker exec antigravity-api ruff check . --fix
	docker exec antigravity-api mypy .

.PHONY: dev prod debug clean pull-models pull-llava init-db seed health health-dev logs test

dev:
	@cp -n .env.genesis .env 2>/dev/null; true
	docker-compose -f docker-compose.dev.yml up --build -d
	@echo "⏳ Waiting for services (30s)..."
	@sleep 30
	@$(MAKE) health-dev
	@echo ""
	@echo "✅ ANTIGRAVITY OS dev is running!"
	@echo "   Frontend:  http://localhost:3000"
	@echo "   API docs:  http://localhost:8000/docs"
	@echo "   Qdrant:    http://localhost:6333/dashboard"
	@echo ""
	@echo "Next steps:"
	@echo "  make pull-models   (first time only, ~15 min)"
	@echo "  make init-db       (first time only)"
	@echo "  make seed          (ingest your documents)"

prod:
	docker-compose -f docker-compose.yml up --build -d
	@sleep 20
	@$(MAKE) health
	@echo "✅ ANTIGRAVITY OS production is running!"

pull-models:
	@echo "Pulling core models (15-30 min first time)..."
	docker exec antigravity-ollama ollama pull llama3.2:3b
	docker exec antigravity-ollama ollama pull qwen2.5:3b
	docker exec antigravity-ollama ollama pull phi4-mini:latest
	docker exec antigravity-ollama ollama pull nomic-embed-text
	docker exec antigravity-ollama ollama pull mxbai-rerank-large
	@echo "✅ Core models ready"

pull-llava:
	docker exec antigravity-ollama ollama pull llava-phi3

init-db:
	@echo "Initializing database..."
	docker exec -i antigravity-postgres psql \
	 -U $${POSTGRES_USER:-antigravity} \
	 -d $${POSTGRES_DB:-antigravity} \
	 < backend/db/init_schema.sql
	docker exec antigravity-api alembic upgrade head 2>/dev/null || true
	@echo "✅ Database initialized"

seed:
	@echo "Seeding knowledge base..."
	docker exec antigravity-api python -m scripts.seed_all
	@echo "✅ Knowledge base seeded"

health:
	@echo "=== Service Health Check ==="
	@curl -sf http://localhost:8000/health | python3 -m json.tool 2>/dev/null || echo "❌ API not healthy"
	@curl -sf http://localhost:6333/readyz > /dev/null && echo "✅ Qdrant" || echo "❌ Qdrant"
	@curl -sf http://localhost:11434/api/tags > /dev/null && echo "✅ Ollama" || echo "❌ Ollama"
	@docker exec antigravity-redis redis-cli ping 2>/dev/null && echo "✅ Redis" || echo "❌ Redis"
	@docker exec antigravity-postgres pg_isready 2>/dev/null && echo "✅ Postgres" || echo "❌ Postgres"

health-dev:
	@curl -sf http://localhost:8000/health > /dev/null && echo "✅ API up" || echo "⏳ API starting..."
	@curl -sf http://localhost:11434/api/tags > /dev/null && echo "✅ Ollama up" || echo "⏳ Ollama starting..."

logs:
	docker-compose -f docker-compose.dev.yml logs -f api frontend

debug-api:
	docker logs -f antigravity-api

debug-ollama:
	docker logs -f antigravity-ollama

debug-rag:
	docker exec -it antigravity-api python -c "import asyncio; from rag.hybrid_search import test_search; asyncio.run(test_search())"

debug-agents:
	docker exec -it antigravity-api python -c "from agents.graph import test_graph; test_graph()"

debug-memory:
	docker exec -it antigravity-api python -c "import asyncio; from memory.working_memory import test_memory; asyncio.run(test_memory())"

stop:
	docker-compose -f docker-compose.dev.yml down

clean:
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker-compose down -v --remove-orphans 2>/dev/null; true
	@echo "✅ Clean"

test:
	docker exec antigravity-api pytest tests/ -v --asyncio-mode=auto --tb=short

test-security:
	docker exec antigravity-api pytest tests/test_security.py -v

test-rag:
	docker exec antigravity-api pytest tests/test_rag.py -v

test-agents:
	docker exec antigravity-api pytest tests/test_agents.py -v

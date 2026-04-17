# Engineering Philosophy

## Core Principles

### 1. Observable by Default
If I can't see what a system is doing, I can't trust it. Every service gets structured logging, Prometheus metrics, and health checks before the first feature is built. Not after. Before.

### 2. Graceful Degradation Always
Users should never see an error. If the LLM is slow, stream what we have. If the vector DB is down, fall back to keyword search. If everything is down, serve static responses. The experience degrades gracefully, never catastrophically.

### 3. Build for the Uncommon Path
Happy path testing is table stakes. I test: What happens when Redis dies mid-request? What if the embedding model returns garbage? What if someone sends 10MB of text as a "question"? Edge cases are where production systems either shine or shatter.

### 4. Raw SQL for Performance, ORMs for CRUD
ORMs are great for basic CRUD operations. But when I need a complex graph traversal joining 4 tables with vector similarity search, I'm writing raw SQL with parameterized queries. The ORM would generate something ugly, slow, and unmaintainable.

### 5. Graph Thinking, Not Chain Thinking
Traditional AI pipelines are linear chains. Real problems are graphs — conditional branching, parallel execution, fallback paths, state accumulation. LangGraph over LangChain, every time.

### 6. Ship Fast, Then Harden
First version ships in days, not weeks. But then comes the hardening: rate limiting, auth, input validation, retry logic, circuit breakers, monitoring dashboards. Speed of iteration matters, but so does production resilience.

## Strong Opinions (Loosely Held)

- **Embeddings > Keywords** for retrieval, but BM25 is still king for exact match
- **Local LLMs** (Ollama) over API-only stacks for development velocity and cost control
- **PostgreSQL** can replace 3 separate databases if you use pgvector + JSONB + full-text search
- **Over-engineering is the enemy** — build what you need, abstract when you see the pattern twice
- **Docker Compose** is underrated for local dev — it's not just for deployment
- **Tests should test behavior, not implementation** — I don't care how it works internally, I care that it works correctly

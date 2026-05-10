# Aman Bhaskar — Learning Log
# RAG Corpus: /data/knowledge/learning_log.md
# Update this as you learn new things

---

## May 2026 — Current Focus

### Agentic Portfolio (ANTIGRAVITY OS)
- Building the most ambitious project: a living portfolio that knows everything about me
- Integrating LangGraph multi-agent orchestration with RAG retrieval
- Solving the "honest AI" problem: making the system admit what it doesn't know
- Infrastructure stabilization: Docker Compose simplification, security hardening

### DSPy Self-Optimization
- Reading: DSPy documentation, MIPROv2 optimization strategies
- Goal: automated prompt improvement based on conversation quality metrics
- Challenge: need enough conversation data to train optimizers effectively

### ColBERT Late-Interaction Reranking
- Understanding: how token-level attention differs from bi-encoder similarity
- Goal: improve retrieval precision for exact technical terms
- Status: planned integration after basic RAG pipeline is stable

---

## Early 2026 — Completed

### LLM Engineering Lab v2.0
- Shipped SaaS features: billing guards, JWT rotation, NullPool architecture
- Learned: production LLM output cannot be trusted — always validate with Pydantic
- Key insight: the engineering around the LLM matters more than the LLM itself

### RAG Research Assistant — Cloud Deployment
- First production AI deployment on Google Cloud Run
- Learned: serverless Redis (Upstash) vs traditional Redis for Cloud Run compatibility
- Learned: MissingGreenlet errors with async SQLAlchemy — explicit joins required
- Built Recall@K evaluation — proved that vibes-based assessment misses real problems

---

## 2025 — Foundation Building

### PostgreSQL Deep Dive
- Built university data system with complex query patterns
- Learned: tsvector/tsquery for full-text search (became BM25 foundation)
- Learned: window functions, CTEs, index optimization strategies
- Understanding: how the query planner works and why it matters for AI applications

### First AI Projects
- RAG Research Assistant initial version
- Discovered: the gap between "tutorial RAG" and "production RAG" is enormous
- Key realization: retrieval quality determines everything — the LLM just formats the answer

---

## 2024 — Programming Origins

### Game Development (Godot/GDScript)
- Built two complete TMNT games
- Learned: state machines, game loops, shipping complete projects
- Key transfer: state machine thinking → LangGraph agent design
- Most important lesson: the discipline of finishing, not just starting

---

## What I Want to Learn Next

- **Kubernetes**: For when the portfolio needs real orchestration beyond Docker Compose
- **Terraform**: Infrastructure as Code for reproducible deployments
- **Advanced prompt engineering**: Constitutional AI, RLHF concepts
- **Evaluation frameworks**: Beyond Ragas — custom evaluation pipelines
- **Distributed tracing**: OpenTelemetry integration for full-stack observability

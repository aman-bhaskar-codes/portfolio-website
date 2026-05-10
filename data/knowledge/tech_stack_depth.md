# Aman Bhaskar — Technology Stack Self-Assessment
# RAG Corpus: /data/knowledge/tech_stack_depth.md
# Honest assessment of depth with each technology

---

## Deep Expertise (Built production systems)

### Python + FastAPI
- **Depth:** Production
- **Evidence:** RAG Research Assistant, LLM Engineering Lab, Agentic Portfolio backend
- Async/await patterns, Pydantic v2 validation, streaming responses
- I think in Python. It's my primary language for anything backend or AI.

### PostgreSQL
- **Depth:** Production
- **Evidence:** SQL Data Systems Projects, every backend project
- pgvector for embeddings, tsvector/tsquery for BM25, window functions, CTEs
- PLpgSQL stored procedures, Alembic migrations, index optimization
- I understand how the query planner works and why index choice matters.

### RAG Pipeline Engineering
- **Depth:** Production
- **Evidence:** RAG Research Assistant (4-stage pipeline), Agentic Portfolio (5-stage target)
- HyDE query expansion, hybrid retrieval (dense + sparse), RRF fusion, cross-encoder reranking
- Built and benchmarked each stage independently. Know why each is needed.

### Docker + Docker Compose
- **Depth:** Production
- **Evidence:** Every project uses Docker. Multi-service stacks with 9-12 services.
- Volume management, healthchecks, YAML anchors, multi-stage builds
- Dockerfiles optimized for layer caching and small image size.

### Redis
- **Depth:** Production
- **Evidence:** Working memory in RAG Assistant, caching in LLM Lab, Celery broker
- LRU eviction vs AOF persistence tradeoffs (why I split into two instances)
- Upstash HTTP-based Redis for serverless environments

---

## Strong Working Knowledge (Built features, not full systems)

### LangGraph
- **Depth:** Advanced
- **Evidence:** Agentic Portfolio agent orchestration (in progress)
- StateGraph with typed state, conditional edges, parallel node execution
- Chose it over simple chains because production agents need explicit state machines.

### Next.js (App Router)
- **Depth:** Advanced
- **Evidence:** Frontend for RAG Assistant, LLM Lab, Agentic Portfolio
- Server components vs client components, streaming SSE consumption
- Zustand for state management (prefer it over Redux for streaming performance)

### Ollama
- **Depth:** Advanced
- **Evidence:** Every AI project uses Ollama for local inference
- Model routing (different models for different tasks), embedding models
- Understanding of model performance characteristics and when to use which size.

### Qdrant
- **Depth:** Intermediate-Advanced
- **Evidence:** Agentic Portfolio vector storage
- Collection management, payload filtering, health monitoring
- Chose it over Pinecone/Weaviate for self-hosted control and cost.

### Celery + Beat
- **Depth:** Intermediate-Advanced
- **Evidence:** Background tasks in Agentic Portfolio (GitHub sync, freshness sweeps)
- Worker configuration, scheduled tasks, Redis broker setup

---

## Working Knowledge (Used effectively, still learning depth)

### Three.js + React Three Fiber
- **Depth:** Intermediate
- **Evidence:** 3D particle constellation in portfolio hero section
- Can build scenes, add post-processing, handle camera controls
- Still learning advanced shader programming.

### Framer Motion
- **Depth:** Intermediate
- **Evidence:** Animations across all frontends
- Layout animations, gesture handling, scroll-triggered effects

### Google Cloud Run
- **Depth:** Intermediate
- **Evidence:** RAG Research Assistant deployed and running
- Containerized serverless deployment, zero-idle-cost architecture
- Integrated with Artifact Registry and Neon serverless Postgres.

### GDScript / Godot
- **Depth:** Intermediate (past focus)
- **Evidence:** Two complete TMNT games
- State machines, game loops, collision systems, scene management
- Not actively using, but the state machine concepts transfer directly to agent design.

---

## Currently Learning

### DSPy
- Automated prompt optimization using MIPROv2
- Goal: prompts that improve themselves based on evaluation metrics
- Status: reading documentation, haven't deployed yet

### ColBERT
- Late-interaction reranking for token-level precision
- Goal: replace cross-encoder with ColBERT for better technical term matching
- Status: understanding the architecture, planning integration

---

## Honest Gaps (Things I Haven't Done Yet)

- **Kubernetes**: I use Docker Compose. Haven't needed K8s at portfolio scale.
- **Terraform/IaC**: Manual cloud setup so far. Would learn for a team environment.
- **CI/CD pipelines**: Basic GitHub Actions. Haven't built complex deployment pipelines.
- **Mobile development**: No experience with React Native, Flutter, or native mobile.
- **Large-scale distributed systems**: Haven't operated systems at thousands-of-QPS scale.

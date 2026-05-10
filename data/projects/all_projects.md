# Aman Bhaskar — Complete Projects Knowledge Corpus
# RAG Corpus: /data/projects/all_projects.md
# Source: github.com/aman-bhaskar-codes (6 repositories)

---

## PROJECT 1: RAG Research Assistant

**Repository:** github.com/aman-bhaskar-codes/rag-research-assistant
**Stars:** 1 | **Language:** Python 65%, TypeScript 31%
**Status:** Completed, deployed on Google Cloud Run

### What it is
A production-grade RAG Research Assistant built with FastAPI, PostgreSQL (pgvector), Redis, and multi-model LLM support (Ollama + Gemini). This is the project where I learned what production AI infrastructure actually means — not just retrieval, but memory systems, streaming, deployment, and cost optimization.

### Tech Stack
- **Backend:** FastAPI + Uvicorn, Python async
- **Database:** Neon Serverless PostgreSQL + pgvector extension
- **Cache/Memory:** Upstash Redis (HTTP-based, works in serverless)
- **LLMs:** Ollama (local) + Google Gemini (cloud fallback)
- **Deployment:** Google Cloud Run (min-instances=0, scales to zero)
- **Embeddings:** sentence-transformers / FastEmbed
- **Frontend:** Next.js 14, React, Zustand, Framer Motion, Tailwind

### RAG Pipeline Architecture
The retrieval pipeline has 4 stages:

**Stage 1 — Query Intelligence:**
- Query rewriting: makes sloppy user queries more specific
- Multi-query generation: expands one query into multiple sub-questions
- HyDE (Hypothetical Document Embeddings): generates a synthetic answer first, embeds that, and uses it as the search vector — dramatically improves semantic match precision

**Stage 2 — Hybrid Retrieval:**
- Dense vector search via pgvector (semantic meaning)
- BM25 sparse retrieval via PostgreSQL tsvector (exact keyword matching)
- Why both: vectors miss exact code names and technical terms; BM25 catches those

**Stage 3 — RRF Fusion:**
- Reciprocal Rank Fusion (RRF) algorithm merges the two ranked lists
- Relies on rank position, not raw scores (which are incomparable across retrieval methods)

**Stage 4 — Cross-Encoder Reranking:**
- Top-20 RRF results go through a cross-encoder model
- Cross-encoder reads query + chunk simultaneously (vs bi-encoder which embeds separately)
- Cuts top-20 down to top-3-5 highest precision chunks

### Memory System
- **Short-term (Redis):** Recent conversation turns, fast FIFO queue via Upstash
- **Long-term (pgvector):** Conversation summaries embedded and stored, retrieved by semantic similarity
- **Episodic:** Old chats summarized by LLM, summary embedded, stored as episodic memory

### Domain-Aware Routing
Different retrieval strategies for different content types:
- AI/ML mode → HyDE + vector retrieval (conceptual understanding needed)
- Programming mode → BM25 primary (exact variable/function names matter)

### Key Engineering Challenges Solved
1. **MissingGreenlet concurrency**: FastAPI async + SQLAlchemy requires explicit relationship joins, not implicit ORM attribute access across async boundaries
2. **Redis in serverless**: Traditional Redis uses persistent TCP — fails in Cloud Run. Used Upstash HTTP-based Redis
3. **Zero idle cost**: Neon scales to zero (no cost when unused) + Cloud Run min-instances=0
4. **SSE streaming**: Python generators yield tokens to StreamingResponse without WebSocket overhead
5. **Schema conflicts**: Pydantic v2 intercepts and validates all AI payload boundaries

### Deployment Architecture
- Containerized with Docker (python:3.11-slim base)
- Google Artifact Registry for image storage
- Cloud Run: asia-south1 region, 512Mi memory, max 2 instances
- Zero baseline cost when no traffic

### What I'm Proud Of
This was my first real production AI deployment. The complete system — ingestion, retrieval, generation, streaming, memory, deployment — all working together at zero cost. The evaluation system with Recall@K metrics was the part that taught me why "vibes-based" RAG assessment doesn't work.

---

## PROJECT 2: LLM Engineering Lab (Structured Extraction Intelligence Engine)

**Repository:** github.com/aman-bhaskar-codes/llm-engineering-lab
**Stars:** 2 | **Language:** Python 54%, TypeScript 44%
**Status:** Completed (v2.0)

### What it is
An enterprise-grade data extraction system that converts unstructured content (dense PDFs, OCR-scanned images, raw text) into strictly typed JSON structures using local LLMs. The core insight: LLMs are non-deterministic, but applications need deterministic structured output. This engine enforces that.

### Tech Stack
- **Backend:** FastAPI + Uvicorn workers, ARQ (async task queue)
- **LLMs:** Ollama local (gemma:2b, phi3:mini, mistral) — no OpenAI dependency
- **OCR:** Tesseract for image/screenshot text extraction
- **Cache:** Redis with SHA-256 deterministic hash keys
- **Frontend:** React 18, Zustand state management
- **Validation:** Pydantic schemas as hard type contracts

### Three-Tier Processing Architecture

**Simple Mode (sub-second):**
- Model: gemma:2b local
- Use case: Clean invoices, basic forms, standard lists
- Strategy: Single-shot inference

**Advanced Mode (semantic compression):**
- Model: phi3:mini local
- Use case: Long contracts, recursive resumes, large PDFs
- Strategy: Sliding window chunking with deduplication before final validation

**Reasoning Mode (chain-of-thought):**
- Model: mistral or cloud fallback
- Use case: Ambiguous tables, medical documents, dense spreadsheets
- Strategy: Double-pass evaluation — extract, analyze confidence, re-extract failed fields

### Key Engineering Innovations

**Zero-Overhead Sanitizers:** LLMs frequently leak markdown syntax (```json wrapper frames, missing brackets). The router intercepts the stream mid-flight and strips these without a full model rerun. This is a production-critical optimization — without it, every extraction fails JSON parsing.

**Deterministic Cache Hashing:** Redis keys built with `json.dumps(data, separators=(",", ":"), sort_keys=True)` — guarantees the same document always hits the same cache key regardless of key insertion order.

**SSE Heartbeat System:** For 30,000+ token PDF inferences, browser proxies timeout waiting. The system injects `[HB]` heartbeat ticks every 2 seconds into the SSE stream to keep connections alive during massive generations.

**ARQ Async Workers:** Background task processing via ARQ (not Celery) — lighter weight, pure async Python.

### SaaS Features (v2.0)
- Billing guard: 50 queries/day limit with HTTP 402 lockout for free tier
- JWT rotation interceptor: React frontend silently renews access tokens on 401 responses
- NullPool architecture: Offloads PostgreSQL connection management to PgBouncer

### What I Learned
The most important lesson: you cannot trust LLM output format in production. Every extraction pipeline needs: (1) schema validation, (2) stream sanitization, (3) retry logic for failed extractions. Building this taught me that the LLM is just one component — the engineering around it is what determines whether the system works.

---

## PROJECT 3: SQL Data Systems Projects

**Repository:** github.com/aman-bhaskar-codes/sql-data-systems-projects
**Stars:** 2 | **Language:** PLpgSQL (primary)
**Status:** Completed

### What it is
A collection of SQL database engineering projects including a complete university data system, analytics queries, and large-scale dataset simulations using PostgreSQL. This is my foundation — before building AI systems, I needed to understand data deeply.

### Projects Included
- **University Data System:** Complete relational schema for a university (students, courses, departments, grades, enrollment) with complex query patterns
- **Analytics Engine:** Time-series queries, aggregation pipelines, window functions
- **Large-scale Simulation:** Generating and querying realistic large datasets

### Technical Depth
- PLpgSQL stored procedures and functions
- Window functions (OVER, PARTITION BY, RANK, ROW_NUMBER)
- CTEs (Common Table Expressions) for complex multi-step queries
- Index optimization: B-tree, GIN, GiST indexes depending on query patterns
- Transaction management and ACID properties in practice
- Full-text search with tsvector and tsquery (which later became the BM25 foundation in my RAG work)

### Why This Project Matters
Most AI developers treat the database as a black box. I don't. Understanding PostgreSQL deeply — how the query planner works, how indexes are chosen, how pgvector extends the relational model — is what lets me design AI systems that use the database intelligently rather than just throwing data at it.

The tsvector work here directly informed how I implemented BM25 sparse retrieval in the RAG Research Assistant.

---

## PROJECT 4: Portfolio Website (ANTIGRAVITY OS)

**Repository:** github.com/aman-bhaskar-codes/portfolio-website
**Stars:** 0 (in development) | **Language:** TypeScript (primary)
**Status:** Active Development — most ambitious project

### What it is
This website. An agentic portfolio system built with Next.js 14, FastAPI, LangGraph, Qdrant, and a 12-service Docker stack. It's not a static portfolio — it's a living AI system that knows everything about me and can discuss my work intelligently with any visitor.

### Architecture (Target State)
- **Frontend:** Next.js 14 App Router, Three.js cinematic hero, SSE streaming chat
- **Backend:** FastAPI with 4 Uvicorn workers, LangGraph state machine
- **Agents:** Router → RAG Agent / Code Agent / Social Agent → Digital Twin Engine
- **Storage:** PostgreSQL + pgvector (episodic memory), Qdrant (semantic RAG), Redis (working memory)
- **Background:** Celery + Beat for GitHub sync, freshness sweeps, social sync
- **Observability:** Langfuse (LLM tracing), Prometheus + Grafana

### Key Technical Goals
- RAG pipeline with full knowledge of all my GitHub repos
- Visitor persona detection (recruiter vs engineer vs founder) before they type
- Digital Twin Engine that responds in my actual voice and references real projects
- Self-healing knowledge base that re-ingests when code changes

### Current Status
Foundation built. Core services boot. Active development on RAG pipeline and agent graph.

---

## PROJECT 5: TMNT Modern Version

**Repository:** github.com/aman-bhaskar-codes/TNMT_modern_version
**Language:** GDScript (Godot Engine)
**Status:** Completed

### What it is
A modern version of the classic Teenage Mutant Ninja Turtles beat-em-up game, rebuilt in Godot Engine with GDScript. This was one of my first complete projects.

### Technical Skills Demonstrated
- Game loop architecture (update/physics/render separation)
- State machines for character behavior (idle, walking, attacking, stunned)
- Collision detection and response systems
- Scene management and level design
- Input handling and game controller support

### Why It Matters
Game development teaches something backend developers often miss: real-time state management. Every game tick is a state machine update. The mental model of "what is the current state, what inputs can change it, what are the valid transitions" — that's directly applicable to LangGraph agent design.

---

## PROJECT 6: TMNT Beat-Em-Up

**Repository:** github.com/aman-bhaskar-codes/tmnt-beat-em-up
**Language:** GDScript (Godot Engine)
**Status:** Completed

### What it is
The original TMNT beat-em-up game project in Godot. This was the starting point of my programming journey.

### Significance
This is where it began. Before RAG pipelines and LangGraph agents, I was a teenager in Bijnor who wanted to make games. The discipline of shipping something complete — not just sketching it — started here.

---

## SKILLS SUMMARY (Across All Projects)

### Production AI/LLM Engineering
- RAG pipeline design and implementation (HyDE, BM25, RRF, cross-encoder)
- LangGraph multi-agent orchestration
- Ollama local LLM inference (zero API cost)
- Streaming LLM responses (SSE, generators)
- Pydantic v2 schema enforcement for LLM outputs
- Langfuse LLM observability and tracing
- Vector database design (Qdrant, pgvector)

### Backend Engineering
- FastAPI async application design
- PostgreSQL deep: pgvector, tsvector/BM25, window functions, CTEs
- Redis: caching patterns, working memory, Celery broker
- ARQ and Celery for background task processing
- Docker + Docker Compose multi-service orchestration
- Alembic database migrations

### Frontend Engineering
- Next.js 14 App Router (Server + Client components)
- React with Zustand (preferred over Redux for streaming performance)
- SSE consumption with ReadableStream API
- Three.js + React Three Fiber (3D scenes)
- Framer Motion animations
- Tailwind CSS

### Cloud & Deployment
- Google Cloud Run (serverless containers)
- Google Artifact Registry
- Neon Serverless PostgreSQL
- Upstash Redis (HTTP-based, serverless-compatible)
- Cost-optimized architecture: zero idle cost

### Database Engineering
- PostgreSQL (primary database)
- PLpgSQL stored procedures
- pgvector for AI applications
- Full-text search with tsvector
- Schema design for multi-tenant systems

# Aman Bhaskar — Complete Knowledge Base
## Used by the RAG pipeline to answer questions accurately

---

## Identity & Background

**Full name**: Aman Bhaskar
**Date of birth**: January 18, 2005 (age 20 in 2025)
**Location**: Bijnor, Uttar Pradesh, India (UTC+5:30)
**Role**: Agentic AI Developer & Software Engineer (self-taught)
**GitHub**: https://github.com/aman-bhaskar-codes
**LinkedIn**: https://www.linkedin.com/in/aman-bhaskar-18jan2005/
**Email**: amanbhaskarcodes@gmail.com
**Instagram**: https://www.instagram.com/mr.aman.bhaskar/
**Twitter/X**: https://x.com/_aman_bhaskar

I am a self-taught developer who started with game development in Godot and progressively moved into
database engineering, backend systems, and finally AI/LLM engineering. I believe in building
production-grade systems from day one, not toy demos.

My philosophy: local-first development (Ollama, local Postgres, zero cloud spend during dev),
then deploy lean when ready (Neon Serverless, Google Cloud Run, Docker).

---

## Career & Learning Timeline

### 2023 — Game Development (Godot/GDScript)
- Built TMNT (Teenage Mutant Ninja Turtles) beat-em-up game in Godot game engine
- Two versions: tmnt-beat-em-up (original) and TNMT_modern_version (improved version)
- Language: GDScript (Python-like language for Godot)
- This was my first serious programming project — learned systems thinking, game loops, collision detection, state machines
- Key lesson: "Programming is about managing state and responding to events"

### 2023–2024 — SQL & Database Engineering
- Built `sql-data-systems-projects` repository (PL/pgSQL, starred by 2 people)
- University data management systems — students, courses, grades, enrollment
- Analytics queries — aggregations, window functions, CTEs
- Large-scale dataset simulations — generating and querying millions of rows
- Key skills: PL/pgSQL, stored procedures, triggers, query optimization, schema design
- Learned: How databases work internally, not just how to write SELECT statements

### 2024 — LLM Engineering Lab (Structured Extraction Engine)
- Built `llm-engineering-lab` — production-grade structured extraction intelligence engine
- Full stack: FastAPI backend + Next.js frontend
- The core problem: LLMs return non-deterministic, conversational text. I solved this by binding outputs to Pydantic schemas, enforcing type safety across system boundaries.
- Multi-tier LLM routing: Simple Mode (gemma:2b), Advanced Mode (phi3:mini), Reasoning Mode (mistral)
- SSE (Server-Sent Events) streaming with heartbeat ticks to prevent browser proxy timeouts
- Tesseract OCR for visual document ingestion
- PyPDF for PDF parsing
- ARQ background workers for async processing
- Redis edge cache with SHA-256 hashing for deterministic cache keys
- JWT silent rotation interceptor in React
- NullPool PostgreSQL connection strategy for zero connection exhaustion
- Languages: Python (54%), TypeScript (44%), Docker, Shell

### 2024 — RAG Research Assistant (Main AI Project)
- Built `rag-research-assistant` — my most technically sophisticated project
- Full stack: FastAPI + Next.js 14 (App Router) + PostgreSQL (pgvector) + Redis + Ollama + Gemini
- Deployed: Google Cloud Run (backend), Neon Serverless Postgres, Upstash Redis
- Architecture is fully decoupled: Frontend → API Gateway → Orchestrator → RAG Engine → Memory
- This is the project I'm most proud of — it solves a real problem with real engineering rigor

### 2025 — Portfolio Website (This Project)
- Built agentic AI portfolio with RAG pipeline, visitor intelligence, GitHub knowledge sync
- Next.js 15 + Ollama + JSON vector store
- Auto-ingests GitHub repos via Octokit API
- Visitor persona detection (recruiter/engineer/founder/casual)
- SSE streaming chat with real-time markdown rendering

---

## Project Deep Dive: RAG Research Assistant

### What It Does
A production-grade RAG system for AI/ML research. Users upload papers or ask questions about
AI topics. The system retrieves relevant context from a knowledge base and generates grounded answers.

### Architecture Layers

**Frontend**: Next.js 14 App Router + Zustand state management
- Zustand chosen over Redux for atomic state slices — prevents full re-renders during high-speed streaming
- SSE consumed via native ReadableStream with byte-level parsing
- Error boundaries catch 422 errors and display them gracefully in the chat bubble
- react-markdown + rehype-highlight for code syntax highlighting
- framer-motion for smooth message animations

**API Gateway**: FastAPI + Uvicorn (ASGI)
- Pydantic v2 request validation — validates session_id as UUID, user_id as UUID
- StreamingResponse with Python generators (yield) for token-by-token streaming
- asyncio.gather for concurrent Redis and RAG fetches
- Domain mode routing: mode == "programming" → BM25, mode == "ai_ml" → vector retrieval

**RAG Engine (The Core)**:

1. Query Intelligence:
   - Query rewriting for specificity
   - Multi-query generation (explore multiple perspectives)
   - HyDE (Hypothetical Document Embeddings): generate a fake answer first, embed it,
     search with the synthetic answer embedding. Dramatically improves precision because
     the hypothetical answer is in the same vector space as real answers.

2. Hybrid Retrieval:
   - Vector retrieval: pgvector with L2 distance, sentence-transformers (FastEmbed) embeddings
   - BM25 keyword retrieval: PostgreSQL native tsvector full-text search for exact term matching
   - RRF (Reciprocal Rank Fusion): mathematically fuses vector and BM25 ranked lists
     Formula: score(doc) = Σ 1/(k + rank) where k=60
   - Why RRF: Vector gives float 0-1, BM25 gives large integers — you can't compare directly.
     RRF relies only on rank position, not score magnitude.

3. Reranking:
   - Cross-encoder reads query AND chunk simultaneously (not separate embeddings)
   - Cuts top-20 RRF results to top-3 most precise chunks
   - Much more accurate than bi-encoder similarity alone

4. Ingestion Pipeline:
   - PDF + text loaders
   - Recursive chunking: 300-500 token chunks with domain-aware boundaries
   - FastEmbed for local embedding generation (no OpenAI calls)
   - Stored in PostgreSQL with pgvector extension: embedding VECTOR(1536) column
   - Evaluation: Recall@K metric, keyword-based ground truth matching

**Memory System (3 tiers)**:
- Tier 1 (Short-term): Upstash Redis — recent conversation context, O(1) access
- Tier 2 (Long-term episodic): PostgreSQL pgvector — summarized old conversations, semantic search
- Tier 3 (User personalization): Relational joins on user behavior patterns

**Database Stack**:
- Neon Serverless Postgres: scales to zero, costs $0 when idle
- NullPool connection pooling (offloads locking to PgBouncer at database level)
- pgvector extension for VECTOR(1536) columns
- Upstash Redis: HTTP-based Redis (works in serverless environments that ban persistent TCP)

**Deployment**:
- Docker: python:3.11-slim base image
- Google Artifact Registry for image storage
- Google Cloud Run: --min-instances 0 (costs $0 when idle), --max-instances 2, 512Mi RAM
- Region: asia-south1 (Mumbai, closest to India)

---

## Project Deep Dive: LLM Engineering Lab

### What It Does
Converts unstructured documents (PDFs, screenshots, raw text) into strictly-typed JSON structures.
Designed for SaaS with multi-tenant concurrency.

### Key Engineering Decisions

**Three-tier LLM routing based on document complexity**:
- Simple mode: gemma:2b — fast, for clean invoices and simple lists
- Advanced mode: phi3:mini — for contracts, long PDFs, recursive text with context compression
- Reasoning mode: mistral:latest — double-pass evaluation loop for ambiguous tables and medical docs

**Double-pass evaluation**: Extract → analyze confidence anomalies → re-extract failed fields
This handles hallucinations and low-confidence extractions automatically.

**Zero-overhead sanitizers**: Strip markdown fences, fix missing brackets,
convert single-quote indices — without forcing a model rerun.

**SSE heartbeat**: Every ~2s send [HB] ticks to prevent browser EventSource timeouts during
30,000-token PDF inference runs. Critical for production reliability.

**Billing system**: 50 queries/day free tier with HTTP 402 hard lockout.

**Edge cache**: SHA-256 hash of the request payload as cache key, sorted keys with minimal
separators for deterministic hashing across identical documents.

---

## Technical Philosophy & Opinions

**On RAG architecture**: "Standard cosine similarity on raw questions is underwhelming for technical queries.
HyDE matters — generating a hypothetical answer first and embedding that gets you into the same vector space
as real answers. Combined with BM25 for exact term matching and RRF fusion, you get dramatically better
retrieval than any single method."

**On LLM selection**: "I prefer smaller local models (llama3.2:3b, phi3:mini) for most tasks.
They're fast, private, and cost $0. Cloud models (Gemini, Claude) for tasks that genuinely need
frontier capability — reasoning mode, complex synthesis, critical extractions."

**On Python vs TypeScript**: "Python for AI/ML work — the ecosystem is unbeatable (LangChain,
sentence-transformers, Pydantic, FastAPI). TypeScript for anything user-facing — type safety catches
bugs at compile time, and the Next.js developer experience is excellent."

**On database choice**: "Neon Serverless Postgres is my default. It costs $0 when idle, supports
pgvector natively, and is standard Postgres so there's no vendor lock-in. Redis only for
high-frequency session data — not as a primary store."

**On deployment**: "Docker first, always. Google Cloud Run for Python backends — scale to zero means
zero cost during development. Vercel for Next.js frontends — the edge network is genuinely fast."

**On over-engineering**: "The enemy of shipped software is architecture astronautics. A working JSON
file-based vector store beats a broken 22-service Docker Compose stack every time. Start simple,
instrument everything, upgrade when you have real metrics to justify it."

**On learning**: "I don't follow tutorials. I pick a real problem, try to build it, hit walls,
and research specifically the walls I hit. Every project in my GitHub solved a problem I had —
not a problem that seemed interesting in a blog post."

---

## Skills Summary

### Expert (used in production)
- Python (async/await, FastAPI, Pydantic v2, SQLAlchemy)
- RAG pipeline engineering (hybrid retrieval, HyDE, RRF, cross-encoder reranking)
- PostgreSQL + pgvector (vector similarity search, full-text search, schema design)
- TypeScript + Next.js (App Router, SSE streaming, Zustand)
- Ollama (local LLM deployment, model selection, API integration)
- Docker + Docker Compose (containerization, multi-service orchestration)
- SSE (Server-Sent Events) — both producer (Python generators) and consumer (ReadableStream)

### Proficient (multiple projects)
- Redis / Upstash Redis (session cache, rate limiting, pub/sub)
- Google Cloud Run (deployment, scaling configuration)
- LangChain / LangGraph (agent orchestration)
- Gemini API (cloud LLM integration)
- PL/pgSQL (stored procedures, triggers, window functions)
- Framer Motion (animation in React)
- JWT authentication with silent refresh

### Learning / Exploring
- Godot Engine / GDScript (game dev background)
- Terraform / HCL (infrastructure as code)
- Prometheus + Grafana (observability)
- ColBERT reranking (late-interaction models)
- DSPy (automated prompt optimization)

---

## Availability & Work Preferences

**Currently**: Open to remote opportunities
**Preferred roles**: AI Engineer, LLM Engineer, Backend Engineer, Full-Stack AI Developer
**Location**: Remote (India, UTC+5:30)
**Response time**: Within 24 hours via email or LinkedIn
**Work style**: Independent, ships fast, documents decisions, writes production code not prototypes
**Compensation**: Market rate for India-based remote engineers; negotiable based on role fit

---

## Personality & Work Style

- Obsessed with understanding systems at the level below the abstraction I'm using
- Comfortable with ambiguity — I've built most things without a mentor or formal education
- Strong written communication — READMEs and documentation are as important as code
- I learn by shipping, not by studying. Every project is a forcing function.
- Honest about what I don't know — "I'd have to research that" beats false confidence
- Fast feedback loops: local dev → test → iterate, no waiting for cloud deployments during dev

---

## Fun Facts

- Started programming with Godot game engine (Python-like GDScript)
- My first AI project was not a chatbot — it was a structured extraction engine for PDFs
- I use uv (Astral's Rust-powered Python package manager) — 10x faster than pip
- I use ruff for Python linting — again because it's Rust-based and fast
- I run everything locally first: Ollama, local Postgres, local Redis — before touching cloud
- The RAG Research Assistant cost $0 in infrastructure during the entire build phase
- I've never taken a paid course — everything from Stack Overflow, documentation, and GitHub READMEs

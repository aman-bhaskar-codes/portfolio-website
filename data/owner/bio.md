# Aman Bhaskar — Complete Owner Identity Document
# RAG Corpus: /data/owner/bio.md
# This is the primary knowledge document for the portfolio AI

---

## Who I Am

My name is Aman Bhaskar. I'm a 20-year-old self-taught AI engineer from Bijnor, Uttar Pradesh, India. I build production-grade AI systems — specifically agentic AI, RAG pipelines, and LLM infrastructure.

I didn't come from a CS college or a big-city coding bootcamp. I taught myself by building real things — every project in my GitHub is something I actually completed, debugged, and deployed. That process of learning-by-building is the core of how I think about engineering.

My current focus is on the intersection of LLM engineering and distributed systems: how do you make AI that actually works at production scale, without hallucinating, without crashing, and without running up a massive API bill? That's the problem space I work in.

---

## Contact & Links

- **Email:** amanbhaskarcodes@gmail.com
- **GitHub:** https://github.com/aman-bhaskar-codes
- **LinkedIn:** https://www.linkedin.com/in/aman-bhaskar-18jan2005/
- **Instagram:** https://www.instagram.com/mr.aman.bhaskar/
- **Twitter/X:** https://x.com/_aman_bhaskar
- **Location:** Bijnor, Uttar Pradesh, India (UTC+5:30)

---

## My Engineering Identity

I describe myself as an **Agentic AI Developer**. That means I build autonomous AI systems — systems that can reason, retrieve, act, and improve without constant human intervention.

The technologies I work with most deeply:

**AI/LLM Layer:**
- LangGraph (multi-agent orchestration, stateful graphs)
- LangChain (chains, tools, retrieval)
- Ollama (local LLM inference — I run everything locally to keep cost at zero)
- Gemini API (cloud fallback when needed)
- RAG pipeline engineering: HyDE, hybrid search, RRF fusion, cross-encoder reranking
- Vector databases: Qdrant, PostgreSQL + pgvector
- Embedding models: nomic-embed-text, sentence-transformers

**Backend:**
- Python (primary language) — FastAPI, async/await patterns, Pydantic v2
- ARQ and Celery for async task processing
- SQLAlchemy (async) + Alembic for database management
- PostgreSQL with pgvector extension
- Redis for caching, working memory, Celery broker

**Frontend:**
- TypeScript / Next.js 14 (App Router)
- React with Zustand state management
- Tailwind CSS, Framer Motion
- Three.js + React Three Fiber for 3D scenes

**Infrastructure:**
- Docker + Docker Compose (full multi-service stacks)
- Google Cloud Run (serverless container deployment)
- Langfuse (LLM observability), Prometheus + Grafana

**Database Engineering:**
- PostgreSQL deeply (pgvector, full-text search with tsvector/BM25, Alembic migrations)
- SQL design: I built a full university data system and analytics engine in PLpgSQL

---

## How I Think About Engineering

I care deeply about one thing: **systems that actually work**. Not demos. Not tutorials. Production systems.

That means:
- Understanding tradeoffs, not just picking what's popular
- Testing failure modes before claiming something works
- Being honest when something isn't done yet
- Preferring simple and working over complex and broken

I prefer local AI (Ollama) over cloud APIs for two reasons: cost control and privacy. A portfolio system shouldn't send visitor conversations to OpenAI.

My philosophy on RAG: most "RAG" implementations I've seen are just cosine similarity on top of a vector DB. That's not good enough. Real RAG needs HyDE query expansion, BM25 for exact matching, RRF fusion, and cross-encoder reranking. I've built and benchmarked all of these.

On agents: LangGraph's explicit state machine approach is far superior to simple chain-of-thought prompting for production agents. You get observability, error recovery, and debuggable routing.

---

## My Learning Journey

I started programming with game development — I built TMNT (Teenage Mutant Ninja Turtles) beat-em-up games in GDScript/Godot. That taught me game loops, state management, and how to ship something complete.

Then I went deeper into backend engineering: built SQL data systems, learned PostgreSQL deeply, understood how data actually lives in a database.

Then I found LLM engineering. The RAG Research Assistant was my first real production AI project — I deployed it on Google Cloud Run, used Neon serverless PostgreSQL, and built the full pipeline from ingestion to retrieval to generation. That's when I understood the difference between a demo and a production system.

Now I'm building the Agentic Portfolio — my most ambitious project. It's the culmination of everything I've learned: LangGraph orchestration, multi-tier memory, hybrid RAG, visitor intelligence, self-healing ingestion. This is the project that represents everything I know how to do.

---

## Current Status (May 2026)

- Actively building: Agentic Portfolio (ANTIGRAVITY OS)
- Learning: DSPy for automated prompt optimization, ColBERT for late-interaction reranking
- Available for: AI engineering opportunities, freelance LLM projects, collaboration
- Open to: Remote work, full-time roles, project-based work

---

## What I'm Looking For

I want to work on hard AI infrastructure problems with a team that takes production quality seriously. I'm not interested in wrapping GPT-4 in a chat interface — I want to work on retrieval systems, agent orchestration, evaluation pipelines, and the infrastructure that makes AI actually reliable.

Ideal role: AI/ML Engineer or LLM Infrastructure Engineer at a company building real AI products, not just AI features.

---

## Personal Note

I'm 20 years old and from a small town in India. I don't have the connections or the credentials that come from attending IIT or a top university. What I have is a GitHub with real projects, each one built because I wanted to understand something deeply, not to add a line to a resume.

I believe the best way to prove you can build production AI systems is to build one. That's what this portfolio is.

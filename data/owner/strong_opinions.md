# Aman Bhaskar — Strong Engineering Opinions
# RAG Corpus: /data/owner/strong_opinions.md

---

## On RAG

Simple cosine similarity isn't RAG. Real RAG needs HyDE + BM25 + RRF + reranking.
The retrieval pipeline is 80% of the work. The LLM part is easy.
If your retrieval quality is bad, no amount of prompt engineering will save you.

## On Local AI vs Cloud AI

Run everything locally with Ollama during development and for privacy-sensitive data.
Cloud fallback (Gemini/Claude) only for production when local inference isn't fast enough.
The cost difference at portfolio scale is: $0 (local) vs $50-200/month (cloud).
A portfolio AI shouldn't be sending visitor conversations to OpenAI's servers.

## On Agentic Systems

LangGraph > simple chains for production agents.
Explicit state machines are debuggable. Implicit chaining is a black box.
If you can't trace exactly which agent node ran and what state it produced, you can't debug it in production.

## On Databases

PostgreSQL does almost everything. pgvector for embeddings, tsvector for keyword search.
Don't add a separate vector DB unless you actually need its features.
I use Qdrant when I need ANN at scale with metadata filtering; pgvector for simpler use cases.
Most AI devs treat the database as a black box. That's a mistake.

## On LLM Output Trust

You cannot trust LLM output format in production. Ever.
Every extraction/generation pipeline needs:
1. Pydantic schema validation
2. Stream sanitization (stripping markdown wrappers, fixing brackets)
3. Retry logic for failed extractions
Building the engineering around the LLM is what determines whether the system works.

## On Testing AI

Ragas metrics (faithfulness, relevance, groundedness) beat vibes-based RAG evaluation.
Every AI system needs an evaluation harness before going to production.
"It feels like it works" is not acceptable. Recall@K is measurable.

## On Architecture Simplicity

Start with the minimum stack that actually works. 9 Docker services, not 22.
Add observability (Prometheus/Grafana) after the core AI chat works.
Add analytics (Umami) after you have traffic.
Add object storage (MinIO) after you have files to store.
Premature infrastructure is the same mistake as premature optimization.

## On Framework Choices

- **FastAPI over Django**: Async-first, Pydantic-native, explicit routing
- **Zustand over Redux**: Simpler mental model, better for streaming state updates
- **ARQ over Celery** (for small projects): Pure async Python, lighter weight
- **Celery** (for larger projects): Battle-tested, better ecosystem, Beat scheduler
- **Next.js App Router**: Server components + client components = best of both worlds

## On Shipping

The best way to prove you can build production AI systems is to build one.
Not to talk about it. Not to write about it. To build it and deploy it.
A working system with honest limitations is more impressive than a broken system with impressive architecture diagrams.

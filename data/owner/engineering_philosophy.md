# Aman Bhaskar — Engineering Philosophy
# RAG Corpus: /data/owner/engineering_philosophy.md

---

## Core Principle: Systems That Actually Work

I care deeply about one thing: **systems that actually work**. Not demos. Not tutorials. Not proof-of-concepts that break when you change the input. Production systems.

That means:
- Understanding tradeoffs, not just picking what's popular
- Testing failure modes before claiming something works
- Being honest when something isn't done yet
- Preferring simple and working over complex and broken

---

## On Local AI vs Cloud AI

I prefer local AI (Ollama) over cloud APIs for two reasons: **cost control** and **privacy**.

A portfolio system shouldn't send visitor conversations to OpenAI. And at portfolio scale, the cost difference is stark:
- Local (Ollama): $0/month
- Cloud (GPT-4, Claude): $50-200/month for even moderate traffic

I use Ollama for development and privacy-sensitive workloads. Cloud fallback (Gemini/Claude) only when local inference isn't fast enough for production latency requirements.

---

## On RAG — Most Implementations Are Wrong

Most "RAG" implementations I've seen are just cosine similarity on top of a vector DB. That's not good enough for production.

Real RAG needs:
1. **HyDE query expansion** — embed a hypothetical answer, not the question
2. **BM25 for exact matching** — vectors miss exact code names and technical terms
3. **RRF fusion** — merge dense and sparse ranked lists by position, not score
4. **Cross-encoder reranking** — token-level attention between query and document

The retrieval pipeline is 80% of the work. The LLM generation part is easy. If your retrieval is wrong, no amount of prompt engineering fixes it.

---

## On Agents — LangGraph Over Chains

LangGraph's explicit state machine approach is far superior to simple chain-of-thought prompting for production agents.

Why:
- **Observability**: You can see exactly which node executed and what state it produced
- **Error recovery**: Failed nodes can retry or route to fallback paths
- **Debuggable routing**: Conditional edges are explicit, not hidden in prompt instructions
- **Typed state**: TypedDict state passing between nodes catches errors at design time

Simple chains work for demos. State machines work for production.

---

## On Databases

PostgreSQL does almost everything. Before reaching for a specialized database, ask if PostgreSQL already handles it:
- **pgvector** for embeddings and similarity search
- **tsvector** for full-text/BM25 keyword search
- **JSONB** for flexible document storage
- **Window functions** for analytics

I use Qdrant when I need ANN at scale with advanced filtering. For simpler use cases, pgvector is enough and eliminates an entire service from the stack.

---

## On Testing AI Systems

"Vibes-based" evaluation doesn't work. You need quantitative metrics:
- **Recall@K**: Are the right chunks being retrieved?
- **Faithfulness**: Is the response grounded in the retrieved context?
- **Relevance**: Does the response actually answer the question?
- **Groundedness**: Are claims traceable to source documents?

Every AI system needs an evaluation harness before going to production. I learned this the hard way building the RAG Research Assistant — the system "felt" good but Recall@K showed it was missing critical chunks.

---

## On Learning

I learn by building. Not by reading documentation. Not by watching tutorials. By building something real, hitting every wall, and solving each problem.

Every project in my GitHub exists because I wanted to understand something deeply:
- TMNT games → state machines, game loops, shipping complete things
- SQL projects → how data actually lives in a database
- RAG Research Assistant → production AI infrastructure
- LLM Engineering Lab → structured output enforcement
- Agentic Portfolio → everything combined

The discipline of shipping something complete — not just sketching it — is the most important skill I've developed.

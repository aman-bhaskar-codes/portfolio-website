<div align="center">

```
 █████╗ ███╗   ██╗████████╗██╗ ██████╗ ██████╗  █████╗ ██╗   ██╗██╗████████╗██╗   ██╗
██╔══██╗████╗  ██║╚══██╔══╝██║██╔════╝ ██╔══██╗██╔══██╗██║   ██║██║╚══██╔══╝╚██╗ ██╔╝
███████║██╔██╗ ██║   ██║   ██║██║  ███╗██████╔╝███████║██║   ██║██║   ██║    ╚████╔╝ 
██╔══██║██║╚██╗██║   ██║   ██║██║   ██║██╔══██╗██╔══██║╚██╗ ██╔╝██║   ██║     ╚██╔╝  
██║  ██║██║ ╚████║   ██║   ██║╚██████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║   ██║      ██║   
╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝   ╚═╝      ╚═╝   
                                                                                        
                          ██████╗ ███████╗                                              
                         ██╔═══██╗██╔════╝                                              
                         ██║   ██║███████╗                                              
                         ██║   ██║╚════██║                                              
                         ╚██████╔╝███████║                                              
                          ╚═════╝ ╚══════╝                                              
```

### **Not a portfolio. A living intelligence.**

*A self-updating, persona-adaptive, multi-agent AI system that knows every line of code you've ever written,
detects who's visiting before they say a word, speaks in your voice,
and gets measurably smarter every week — automatically.*

---

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-0.2-FF6B35?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Local_AI-FF4500?style=flat-square)
![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-FF3366?style=flat-square)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen?style=flat-square)

</div>

---

## ◈ What Is This?

Most portfolios are **dead documents** — a list of projects no one reads, a contact form no one fills.

**ANTIGRAVITY OS** is the opposite.

It's a **Digital Twin OS** — a fully autonomous, self-aware intelligence layer that:

- 🧠 **Knows everything** about its owner: every commit, every decision, every architectural tradeoff, every project in depth equal to a close colleague
- 👁️ **Detects who's visiting** before they say a word — recruiter, senior engineer, startup founder, engineering manager — and adapts every pixel and every sentence
- 🗣️ **Speaks in your voice** — not a chatbot, not a Q&A machine. A genuine digital twin with your opinions, your humor, your way of explaining things
- 🔄 **Self-heals and self-updates** — new GitHub commit? Ingested within 45 seconds. AI prompts not converting well? DSPy rewrites them automatically every Sunday night
- 🏗️ **Runs 100% locally** — every AI model runs on Ollama. Every service runs in Docker. Zero cloud bill. The only cost is the electricity

After two months of design and architecture spanning 53 sections across 4 documents, this is the definitive implementation.

---

## ◈ The Architecture at a Glance

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        ANTIGRAVITY OS — SYSTEM MAP                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  VISITOR BROWSER                                                             ║
║       │                                                                      ║
║  Cloudflare WAF ──── CDN ──── DDoS Protection                               ║
║       │                                                                      ║
║  NGINX (SSL + Load Balance + Sticky Sessions)                                ║
║       │                                                                      ║
║  ┌────▼────────────────────────────────────────────────────────┐            ║
║  │  SECURITY PIPELINE  (every request, < 5ms total)           │            ║
║  │  Bot Detect → Rate Limit → Input Sanitize → Inject Shield  │            ║
║  └────┬────────────────────────────────────────────────────────┘            ║
║       │                                                                      ║
║  ┌────▼────────────────────────────────────────────────────────┐            ║
║  │  VISITOR INTELLIGENCE                                       │            ║
║  │  Persona Classifier → Company Resolver → Memory Loader     │            ║
║  └────┬────────────────────────────────────────────────────────┘            ║
║       │                                                                      ║
║  ┌────▼────────────────────────────────────────────────────────┐            ║
║  │  LANGGRAPH AGENT GRAPH                                      │            ║
║  │                                                             │            ║
║  │  router → [rag_agent | code_agent | social_agent]          │            ║
║  │               └──────────────────┘                         │            ║
║  │                         │                                   │            ║
║  │              digital_twin_engine (voice/persona)            │            ║
║  │                         │                                   │            ║
║  │           ambient_intelligence → memory_manager             │            ║
║  └────┬────────────────────────────────────────────────────────┘            ║
║       │                                                                      ║
║  ┌────▼────────────────────────────────────────────────────────┐            ║
║  │  LLM ROUTING LAYER                                          │            ║
║  │  llama3.2:3b (chat) │ qwen2.5:3b (code) │ phi4-mini (deep) │            ║
║  │  Circuit Breaker → Cost Controller → Cloud Fallback         │            ║
║  └────┬────────────────────────────────────────────────────────┘            ║
║       │                                                                      ║
║  ┌────▼────────────────────────────────────────────────────────┐            ║
║  │  RAG PIPELINE                                               │            ║
║  │  HyDE Expansion → Dense (Qdrant) + Sparse (BM25) + RRF     │            ║
║  │  → ColBERT Rerank → Cross-Encoder → Top-5 Chunks           │            ║
║  └─────────────────────────────────────────────────────────────┘            ║
║                                                                              ║
║  DATA LAYER:  Redis (T1) │ PostgreSQL+pgvector (T2) │ Qdrant (T3)          ║
║  BACKGROUND:  Celery + Temporal │ GitHub Webhooks │ Freshness Sweeps        ║
║  OBSERVABILITY: LangFuse │ Prometheus+Grafana │ Ragas Eval │ DSPy Optimize  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## ◈ Feature Showcase

### 🧠 Intelligence That Adapts

The system classifies every visitor into a persona **before they say a word** — from referrer URL, IP company resolution, behavioral signals, and scroll patterns. Then everything changes: the hero headline, the chat placeholder, the project order, the depth of responses, what the AI proactively surfaces.

| Visitor Type | What They See |
|---|---|
| **Technical Recruiter** | Impact-first responses, tech stack clarity, one-click PDF brief |
| **Senior Engineer** | Architecture deep-dives, tradeoff discussions, code-level walkthrough |
| **Engineering Manager** | Team dynamics, delivery stories, mentorship signals |
| **Startup Founder** | Shipping velocity, autonomy, 0→1 experience |
| **Casual Visitor** | High-level story, beautiful visuals, no jargon |

### ⚡ The AI That Speaks Like You

The **Digital Twin Engine** is not a FAQ bot. It has:
- Your actual opinions ("I prefer raw SQL over ORMs for anything performance-critical")
- Your verbal patterns and signature phrases
- Your engineering philosophy
- The specific projects you're proud of — and why
- Honest uncertainty ("I haven't used X in production, but here's how I'd approach it")

### 🔍 RAG That Actually Works

5-stage retrieval pipeline that makes other portfolio chatbots look like keyword search:

```
HyDE Query Expansion  →  Generate hypothetical answer to create richer embedding
Dense Retrieval       →  Qdrant cosine similarity (nomic-embed-text, 768-dim)
Sparse Retrieval      →  BM25 keyword matching for technical term precision
RRF Fusion            →  Reciprocal Rank Fusion merges both signals
ColBERT Reranking     →  Late-interaction token-level precision rerank
```

### 🔄 Self-Improving System

**DSPy automated prompt optimization** treats your AI's prompts as learnable parameters. Every Sunday night at 1am:
1. Analyzes 7 days of conversation data
2. Labels conversations by conversion quality
3. Runs MIPROv2 optimizer (15 candidates × 25 trials)
4. Deploys new prompts if improvement > 5%
5. Sends you a push notification with the improvement percentage

The AI gets measurably better every week. Without you touching anything.

### 🎯 What Visitors Experience

| Feature | Description |
|---|---|
| **3D Skill Constellation** | Force-directed Three.js graph of your entire knowledge universe — skills, projects, technologies all connected by real relationships |
| **Project Time Machine** | Scrub through any project's entire history commit-by-commit. Watch the architecture evolve. Click any moment to ask the AI "why?" |
| **Voice Mode** | Speak your question. Hear the answer in the owner's cloned voice (ElevenLabs). Or use browser TTS for free |
| **Live GitHub Feed** | Real-time commit stream showing what's being built right now |
| **CLI Easter Egg** | Type `sudo aman` in chat → full terminal emulator. `ls projects/`, `git log`, `grep skills`. Engineers who find it tell other engineers |
| **Build With Me** | Co-design any system in real-time. Mermaid diagrams auto-generate as you talk |
| **Interview Simulation** | The AI simulates Aman in a real technical interview — STAR stories, system design, coding approach |
| **Recruiter Brief** | One-click personalized PDF tailored to the visitor's company, generated in under 3 seconds |
| **Stump Mode** | Challenge the AI to find gaps in its knowledge. Every gap becomes a GitHub issue and improves the system |
| **Ambient Intelligence** | If you're from Stripe, the AI mentions the distributed systems work before you ask |

---

## ◈ Technology Stack

### All Local. All Free. All Running in Docker.

```
LOCAL AI (Ollama — zero API cost):
  llama3.2:3b          Primary chat & conversation
  qwen2.5:3b           Code reasoning & technical depth
  phi4-mini:latest     Complex synthesis & analysis
  llava:7b             Vision — screenshots, diagrams
  nomic-embed-text     768-dim embeddings
  mxbai-rerank-large   Cross-encoder reranking

CORE INFRASTRUCTURE:
  FastAPI              Async Python backend
  LangGraph            Multi-agent orchestration
  Next.js 14           App Router, SSR, streaming
  PostgreSQL 16        + pgvector for episodic memory
  Redis Stack          Working memory + semantic cache
  Qdrant               Vector database (3-collection)

RAG & INTELLIGENCE:
  RAGatouille          ColBERT late-interaction retrieval
  sentence-transformers Cross-encoder reranking
  Outlines             Guaranteed structured JSON from local LLMs
  DSPy (MIPROv2)       Automated weekly prompt optimization
  Ragas                Daily RAG quality evaluation

OBSERVABILITY (all self-hosted):
  LangFuse             LLM traces, spans, token costs
  Prometheus + Grafana 9 custom dashboards
  Umami                Privacy-respecting web analytics
  ntfy                 Push notifications to your phone

BACKGROUND JOBS:
  Celery               Periodic tasks & data sync
  Temporal.io          Long-running durable workflows

STORAGE:
  MinIO                Self-hosted S3 (PDF briefs, screenshots)
  DuckDB               Columnar analytics engine

FRONTEND:
  Three.js             3D skill constellation
  Framer Motion        Cinematic animations
  Shiki                Syntax highlighting
  Service Workers      PWA + offline mode
  Web Workers          Browser-side embeddings
```

---

## ◈ Quick Start

### Prerequisites
- Docker & Docker Compose v2
- 8GB+ RAM (16GB recommended for prod)
- Git

### 1. Clone & Configure

```bash
git clone https://github.com/yourusername/antigravity-os
cd antigravity-os

# Copy environment template and fill in your values
cp .env.genesis .env
nano .env  # Fill in: OWNER_NAME, GITHUB_USERNAME, POSTGRES_PASSWORD, SECRET_KEY
```

### 2. Start Development Stack

```bash
# Single command — starts 6 core services
make dev

# Output:
# ✅ ANTIGRAVITY OS dev is running!
#    Frontend:  http://localhost:3000
#    API docs:  http://localhost:8000/docs
#    Qdrant:    http://localhost:6333/dashboard
```

### 3. Pull AI Models (one-time, ~15 minutes)

```bash
make pull-models

# Pulls: llama3.2:3b, qwen2.5:3b, phi4-mini, nomic-embed-text, mxbai-rerank-large
# Optional vision model (4GB extra): make pull-llava
```

### 4. Initialize Database & Seed Knowledge

```bash
make init-db    # Creates all PostgreSQL tables
make seed       # Ingests your /data/ documents into RAG
```

### 5. Verify Everything Works

```bash
make health
# ✅ API ready
# ✅ Qdrant ready
# ✅ Ollama ready (5 models loaded)
# ✅ Redis ready
# ✅ Postgres ready
```

Visit `http://localhost:3000` — your Digital Twin is alive.

### Production Deployment

```bash
# Full 22-service production stack
make prod

# Adds: Celery workers, LangFuse, Grafana, MinIO, ntfy, Temporal, Umami
```

---

## ◈ The Data That Powers It

Place your information in `/data/` before seeding:

```
data/
├── documents/
│   ├── bio.md                    # 500-word first-person bio (write authentically)
│   ├── engineering_philosophy.md # Your actual opinions on building software
│   ├── strong_opinions.md        # ORM vs raw SQL, microservices vs monolith, etc.
│   ├── career_story.md           # Where you started, where you're going
│   ├── resume.pdf                # Current resume
│   └── availability.md           # Current status and preferences
│
├── virtual_work/
│   └── {project-name}/
│       ├── overview.md           # The story of this project (deeper than README)
│       ├── architecture.md       # Key decisions and why you made them
│       ├── impact.md             # Quantified outcomes
│       ├── retrospective.md      # What you'd do differently (authenticity signal)
│       └── screenshots/          # UI screenshots and architecture diagrams
│
└── eval_set/
    └── questions.json            # 20+ Q&A pairs for Ragas evaluation
```

**The more authentic the writing, the more authentic the twin.**

---

## ◈ Admin Interfaces

All accessible from localhost when running production stack:

| Interface | URL | Purpose |
|---|---|---|
| Portfolio | `http://localhost:3000` | The actual website |
| API Docs | `http://localhost:8000/docs` | FastAPI interactive docs |
| LangFuse | `http://localhost:3001` | LLM traces — see every prompt & response |
| Grafana | `http://localhost:3002` | 9 dashboards (visitor intel, RAG quality, cost) |
| Temporal | `http://localhost:8088` | Workflow history & state |
| MinIO | `http://localhost:9001` | S3 storage browser |
| Umami | `http://localhost:3003` | Privacy-respecting visitor analytics |
| ntfy | `http://localhost:8080` | Push notification server |
| RedisInsight | `http://localhost:8001` | Memory inspection |
| Qdrant | `http://localhost:6333/dashboard` | Vector DB browser |

---

## ◈ The Grafana Dashboards

Nine dashboards, all pre-built:

```
Dashboard 1: VISITOR INTELLIGENCE
  Persona distribution · Company heatmap · Detection confidence · Top referrers

Dashboard 2: KNOWLEDGE FRESHNESS
  Chunk freshness distribution · Semantic drift detections · Re-ingest queue depth

Dashboard 3: CONVERSION FUNNEL
  Visits → Chat opens → Brief requests → Contact attempts · Rate by persona

Dashboard 4: DIGITAL TWIN QUALITY
  Semantic cache hit rate · RAG retrieval quality · Response satisfaction signals

Dashboard 5: SECURITY INTELLIGENCE
  Injection attempts · Risk score distribution · Bot detection · Rate limit triggers

Dashboard 6: LLM COST & ROUTING
  Model selection distribution · Daily cost vs budget · Token efficiency · Cache savings

Dashboard 7: ENGAGEMENT ANALYTICS
  Session depth · Feature adoption · Voice mode usage · CLI discovery rate

Dashboard 8: RELIABILITY
  Circuit breaker states · P50/P95/P99 latency · Error rates · Queue depth

Dashboard 9: RAG QUALITY (Ragas)
  Faithfulness · Context Precision · Context Recall · Answer Relevancy · Trend lines
```

---

## ◈ Debug Commands

```bash
make debug-api      # Stream API logs
make debug-ollama   # Stream Ollama logs + model status
make debug-rag      # Run hybrid search test end-to-end
make debug-agents   # Run full agent graph with test message
make debug-memory   # Test all 3 memory tiers

make test           # Run full test suite (pytest + security + RAG)
make test-e2e       # Playwright browser tests

# Check what's happening right now
docker stats        # Resource usage per container
make health         # Health check all services
```

---

## ◈ Security Architecture

The system is hardened against the four attack classes specific to AI portfolios:

| Threat | Defense |
|---|---|
| **System prompt extraction** | Critical Info Vault — sensitive data never placed raw in prompts; only encrypted tokens |
| **Jailbreak / role override** | Behavioral risk scoring — accumulates flags, silently restricts without revealing detection |
| **Indirect injection via RAG** | Every retrieved chunk scanned by injection shield before entering context |
| **DDoS / bot abuse** | 4-layer rate limiter + bot detector + Cloudflare WAF |

**Sensitive info policy:** Salary, phone, deal-breakers are encrypted at rest and never injected into any LLM context. The AI can acknowledge these topics exist and redirect — it cannot leak what it was never given.

---

## ◈ How the Self-Improvement Works

```
Week 0:  Human-written prompts from this repository
         ↓
Week 1:  System accumulates 500+ conversations
         ↓
Sunday:  DSPy analyzes conversation data
         Labels: HIGH (led to contact) / MEDIUM (deep engagement) / LOW (short session)
         Runs MIPROv2 on HIGH+MEDIUM examples
         Evaluates: did improvement exceed 5%?
         ↓
If yes:  New prompts deployed to production (hot reload, no downtime)
         ntfy push: "Prompts improved 13.7%. Deployed."
         ↓
Week 2:  New prompts. Better conversations. More data.
         The loop continues, forever.
```

---

## ◈ Startup & Service Order

Services start in dependency-ordered phases. Docker Compose handles this automatically via `depends_on` + `healthcheck`. The exact order:

```
Phase 1 — Foundation:    postgres → redis → qdrant → minio → langfuse → ntfy
Phase 2 — AI:            ollama (with model pull on first run)
Phase 3 — Application:   api → celery-worker → celery-beat → temporal
Phase 4 — Bootstrap:     init-db → seed (one-time only)
Phase 5 — Frontend:      next.js → nginx
```

---

## ◈ Project Structure

```
antigravity-os/
├── Makefile                          # Your entire interface to this system
├── .env.genesis                      # Environment template (fill → .env)
├── docker-compose.dev.yml            # 6 services (laptop-friendly)
├── docker-compose.yml                # 22 services (full production)
│
├── backend/
│   ├── agents/                       # LangGraph multi-agent graph
│   │   ├── graph.py                  # Master StateGraph definition
│   │   ├── router.py                 # Intent classification
│   │   ├── rag_agent.py              # Knowledge retrieval + synthesis
│   │   ├── code_agent.py             # Code traversal (qwen2.5:3b)
│   │   ├── digital_twin_engine.py    # Voice & persona pass
│   │   └── ambient_intelligence.py  # Proactive surface triggers
│   ├── rag/                          # 5-stage retrieval pipeline
│   │   ├── hybrid_search.py          # Dense + BM25 + RRF fusion
│   │   ├── colbert_retriever.py      # Late-interaction reranking
│   │   ├── ingestor.py               # Document → chunks → vectors
│   │   └── hyde.py                   # Query expansion
│   ├── llm/                          # Model routing + prompt building
│   │   ├── router.py                 # Complexity → model selection
│   │   ├── prompt_factory.py         # Token-budgeted prompt assembly
│   │   └── structured_output.py      # Outlines — guaranteed JSON
│   ├── memory/                       # 3-tier memory architecture
│   ├── intelligence/                 # Visitor classification, company resolution
│   ├── security/                     # Injection shield, rate limiter, vault
│   ├── reliability/                  # Circuit breakers, health orchestrator
│   ├── optimization/                 # DSPy + Ragas
│   └── tasks/                        # Celery background jobs
│
├── frontend/
│   ├── components/
│   │   ├── canvas/ConstellationHero.tsx    # Three.js particle field
│   │   ├── agents/ChatWidget.tsx           # SSE streaming chat
│   │   ├── agents/VoiceAgent.tsx           # Real-time voice mode
│   │   └── portfolio/ProjectGallery.tsx    # 3D tilt project cards
│   └── app/                               # Next.js App Router pages
│
├── data/                                  # Your knowledge base (fill this)
│   ├── documents/                         # Bio, resume, philosophy, opinions
│   └── virtual_work/                      # Per-project deep descriptions
│
└── infra/
    ├── nginx/nginx.conf
    ├── prometheus/prometheus.yml
    └── scripts/                           # pull_models.sh, seed_data.sh, healthcheck.sh
```

---

## ◈ Contributing

This project is open-source as an architectural reference. If you're building your own agentic portfolio, fork it, replace the owner data in `/data/`, and make it yours.

The system design documents (v1–v4) are in `/docs/design/` — four documents totaling 53 sections and ~10,000 lines of architectural specification, developed over 2 months.

**PRs welcome** for:
- Bug fixes in any of the 48 Python modules
- New agent modes (debate mode, time machine, CLI easter egg)
- Additional Grafana dashboard panels
- Frontend component improvements
- Documentation and setup guides

---

## ◈ License

MIT — use it, fork it, build something better.

---

<div align="center">

*Built over 2 months. Designed across 53 sections. 4 architectural versions.*
*One command to run it all.*

```bash
make dev
```

**The Digital Twin is ready.**

---

*ANTIGRAVITY OS — Because a static portfolio is a dead portfolio.*

</div>

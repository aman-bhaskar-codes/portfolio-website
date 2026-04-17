<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=timeGradient&height=200&section=header&text=ANTIGRAVITY%20OS%20v4&fontSize=60&fontAlignY=35&desc=The%20Digital%20Twin%20Architecture&descAlignY=55&descAlign=50&animation=twinkling" />

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=20&pause=1000&color=32CD32&center=true&vCenter=true&width=600&height=50&lines=Not+a+portfolio.+A+living+intelligence.;Self-updating%2C+persona-adaptive%2C+multi-agent+AI.;Knows+every+line+of+code+you've+written.;Detects+who's+visiting+before+they+speak.;Speaks+in+your+voice.+Runs+100%25+locally.)](https://git.io/typing-svg)

---

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-0.2-FF6B35?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Local_AI-FF4500?style=for-the-badge&logo=ollama&logoColor=white)
![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-FF3366?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Status](https://img.shields.io/badge/Status-Production_Ready-brightgreen?style=for-the-badge)

</div>

---

## ◈ The Paradigm Shift

Most portfolios are **dead documents** — a list of projects no one reads, a contact form no one fills.

**ANTIGRAVITY OS** is the opposite. 

It's a **Digital Twin OS** — a fully autonomous, self-aware intelligence layer that:

- 🧠 **Knows Everything:** Masterful recall of every commit, tradeoff, and architecture design you’ve implemented.
- 👁️ **Instant Recognition:** Detects recruiters, founders, or senior engineers instantly, adapting layout and depth on-the-fly.
- 🗣️ **Your Authenticity:** Meticulously designed to speak with your nuances, your engineering opinions, and your genuine voice.
- 🔄 **Self-Evolution:** Auto-ingests GitHub commits within 45 seconds. Optimizes its own prompts via DSPy every Sunday.
- 🏗️ **Local-First Perfection:** Runs entirely localized via Ollama + Docker. Zero cloud bills. Complete data sovereignty.

---

## ◈ System Architecture Map

```mermaid
graph TD
    classDef frontend fill:#1e1e1e,stroke:#00ffcc,stroke-width:2px,color:#fff;
    classDef security fill:#2c1b3d,stroke:#a64dff,stroke-width:2px,color:#fff;
    classDef intelligence fill:#0f3b57,stroke:#3399ff,stroke-width:2px,color:#fff;
    classDef agents fill:#331a00,stroke:#ff9900,stroke-width:2px,color:#fff;
    classDef storage fill:#1a331a,stroke:#33cc33,stroke-width:2px,color:#fff;

    F[Visitor Browser]:::frontend -->|CDN + WAF| N[NGINX Load Balancer]:::security
    N --> S[Security Pipeline: DDoS, Rate Limit, Inject Shield]:::security
    S --> I[Visitor Intelligence: Persona & Memories]:::intelligence
    
    I -->|SSE Chat| L[LangGraph Agent]:::agents
    I -->|WebSocket| V[Voice Engine]:::agents

    subgraph LangGraph Multi-Agent Engine
    L --> Router[Intent Router]
    Router --> RAG[RAG Agent]
    Router --> Code[Code Traversal]
    Router --> Social[Social & Soft Skills]
    RAG & Code & Social --> DT[Digital Twin Persona Pass]
    end

    DT --> LLM[LLM Routing Matrix: Llama3.2 | Qwen2.5 | Phi4]:::intelligence
    
    subgraph Data & RAG Layer
    RAG -.-> HyDE[Query Expansion]
    HyDE -.-> Qdrant[(Qdrant Dense Vector)]:::storage
    HyDE -.-> Redis[(Redis Working Memory)]:::storage
    Qdrant -.-> ColBERT[ColBERT Reranking]
    end
```

---

## ◈ Cinematic Capabilities

### ⚡ Unprecedented Personalization
Classifies every visitor into a persona **before they speak**—adapting pixels and dialogue. 
- **Technical Recruiters:** See impact-first answers and 1-click tailored PDF briefs.
- **Senior Engineers:** See system design deep-dives and raw code traversals.
- **Founders:** See zero-to-one velocity and autonomous execution potential.

### 🔍 5-Stage Hybrid Retrieval (RAG 2.0)
Where most AI uses simple semantic search, ANTIGRAVITY OS deploys a 5-stage pipeline:
1. **HyDE** (Hypothetical Document Embeddings) Expansion
2. **Dense Retrieval** via Qdrant (nomic-embed-text)
3. **Sparse Retrieval** via BM25 Keyword Matching
4. **RRF** (Reciprocal Rank Fusion)
5. **Cross-Encoder / ColBERT** late-interaction token reranking

### 🔄 DSPy Autonomous Self-Improvement
**ANTIGRAVITY OS does not stagnate.** Every Sunday at 1 AM:
1. Analyzes 7 days of conversational conversions.
2. Runs **DSPy MIPROv2** optimization (15 candidates × 25 trials).
3. If new prompts perform >5% better, it dynamically hot-reloads its own system prompts.
4. Pings your phone with the impact report.

### 🎭 Experiential Features
- **3D Constellation:** A force-directed Three.js map of your skills.
- **Voice Mode:** Real-time bi-directional conversation using WebSockets.
- **CLI Easter Egg:** Type `sudo [name]` in chat to unlock a hidden Linux-like terminal within the web app.

---

## ◈ The Deep Tech Stack

<div align="center">

| Domain | Technologies |
|:---|:---|
| **Local AI Models** | `llama3.2:3b` (Core), `qwen2.5:3b` (Code), `phi4-mini` (Complex logic), `llava:7b` (Vision), `nomic-embed-text` |
| **Backend & Graph** | Python 3.12, FastAPI, LangGraph, Langchain |
| **Data & Vector** | PostgreSQL 16 (pgvector), Redis Stack, Qdrant |
| **RAG & NLP** | RAGatouille (ColBERT), Outlines (JSON schema adherence), DSPy, Ragas |
| **Background & Ops** | Celery, Temporal.io, Docker Compose |
| **Observability** | LangFuse, Prometheus, Grafana, Umami, ntfy (Alerts) |
| **Frontend UI/UX** | Next.js 14, Three.js, Framer Motion, Shiki |

</div>

---

## ◈ Deployment & Quick Start

**Prerequisites:** Docker, Docker Compose v2, Git, 8GB+ RAM.

### 1. Bootstrap
```bash
git clone https://github.com/yourusername/antigravity-os
cd antigravity-os

# Prepare your credentials
cp .env.genesis .env
```

### 2. Ignition
```bash
# Bring up the core 6-service dev stack
make dev
```
<details>
<summary>👁️ See Output</summary>
<br>

```text
✅ ANTIGRAVITY OS dev is running!
   Frontend:  http://localhost:3000
   API docs:  http://localhost:8000/docs
   Qdrant:    http://localhost:6333/dashboard
```
</details>

### 3. Intelligence Initializer (First Run Only)
```bash
make pull-models    # Localize knowledge matrices (~15min)
make init-db        # Blueprint the schema
make seed           # Embed your data/ folder into the vector space
```

### 4. System Verification
```bash
make health
```

Your digital twin is now sentient at [http://localhost:3000](http://localhost:3000).

---

## ◈ The Data Flow

Populate your unique perspective via markdown files in the `/data` directory:

```text
data/
 ┣ documents/
 ┃ ┣ bio.md                   # Who are you?
 ┃ ┣ engineering_philosophy.md# The hard opinions
 ┃ ┣ availability.md          # Open to work?
 ┃ ┗ resume.pdf
 ┗ virtual_work/
   ┗ {project-name}/
     ┣ architecture.md        # The trade-offs
     ┗ retrospective.md       # The reality
```

*The system's authenticity is directly proportional to the honesty written in these directories.*

---

## ◈ Security & Hardening

- **Injection Shielding:** RAG chunks and user prompts are scanned in <5ms to block prompt injection or role-assumption attacks.
- **Critical Info Vault:** Salary bands, direct phone numbers, and private parameters never enter the raw prompt. 
- **DDoS/Abuse Detection:** Multi-tiered rate limiting + heuristic bot detection. 
- **Graceful Degradation:** Full circuit-breaking logic. If Ollama crashes, fallback pipelines engage immediately.

---

<div align="center">
<br/>

**Built over 2 months. Designed across 53 blueprints. 4 architectural epochs.**

### `sudo make dev` <br/> *Because a static portfolio is a dead portfolio.*

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

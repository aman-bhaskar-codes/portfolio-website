<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=timeGradient&height=250&section=header&text=Agentic%20Portfolio%20Website&fontSize=65&fontAlignY=35&desc=A%20Living,%20Autonomous%20Digital%20Twin&descAlignY=55&descAlign=50&animation=twinkling" width="100%" />

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=20&pause=1000&color=00FFCC&center=true&vCenter=true&width=600&height=50&lines=Not+a+portfolio.+A+living+intelligence.;Self-updating%2C+persona-adaptive%2C+multi-agent+AI.;Knows+every+line+of+code+you've+written.;Detects+who's+visiting+before+they+speak.;Speaks+in+your+voice.+Runs+100%25+locally.)](https://git.io/typing-svg)

<br/>

<img align="center" src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Robot.png" alt="Robot" width="60" /> <img align="center" src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People%20and%20body/Brain.png" alt="Brain" width="60" /> <img align="center" src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png" alt="Rocket" width="60" />

<br/><br/>

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-0.2-FF6B35?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Local_AI-FF4500?style=for-the-badge&logo=ollama&logoColor=white)
![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-FF3366?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

</div>

---

## <img align="center" src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Sparkles.png" alt="Sparkles" width="35" /> The Paradigm Shift

Most portfolios are **dead documents** — a list of projects no one reads, a contact form no one fills.

The **Agentic Portfolio Website** is the exact opposite. 

It's a fully autonomous, self-aware intelligence layer that acts as your personal representative on the web:

- 🧠 **Omniscient Recall:** Masterful recall of every commit, tradeoff, and architecture design you’ve implemented.
- 👁️ **Instant Recognition:** Detects recruiters, founders, or senior engineers instantly, adapting its layout and language depth on-the-fly.
- 🗣️ **Authentic Voice:** Meticulously designed to speak with your nuances, engineering opinions, and genuine tone.
- 🔄 **Autonomous Evolution:** Engages a background loop to auto-ingest new GitHub commits and optimizes its own prompts via DSPy algorithms.
- 🏗️ **Local-First Sanctity:** Runs entirely localized via Ollama + Docker. Zero cloud bills. Complete data sovereignty.

---

## <img align="center" src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Laptop.png" alt="Laptop" width="35" /> System Architecture Map

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
    
    I -->|SSE Chat Streaming| L[LangGraph Agent]:::agents
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

## <img align="center" src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Crystal%20Ball.png" alt="Crystal Ball" width="35" /> Cinematic Capabilities

### ⚡ Unprecedented Personalization
Classifies every visitor into a persona **before they speak**—adapting pixels and dialogue. 
- 💼 **Technical Recruiters:** See impact-first answers and 1-click tailored PDF briefs.
- 💻 **Senior Engineers:** Dive straight into system designs, tradeoff logs, and raw code traversals.
- 🚀 **Founders:** Are presented with zero-to-one velocity and autonomous execution narratives.

### 🔍 5-Stage Hybrid Retrieval
Where most AI chatbots use simple semantic search, this system deploys a heavy-duty pipeline:
1. **HyDE** (Hypothetical Document Embeddings)
2. **Dense Retrieval** via Qdrant (`nomic-embed-text`)
3. **Sparse Retrieval** via BM25
4. **RRF** (Reciprocal Rank Fusion)
5. **ColBERT / Cross-Encoder** late-interaction token reranking

### 🔄 DSPy Autonomous Self-Improvement
**The Agentic Portfolio does not stagnate.** Every Sunday at 1 AM:
1. The engine analyzes 7 days of conversational conversions.
2. Runs **DSPy MIPROv2** optimization.
3. Evaluates if the new prompt candidate performs >5% better.
4. Auto-deploys via hot-reloading and pings you the impact report.

### 🎭 Beautiful Experiences
- 🌌 **3D Constellation:** A force-directed Three.js map of your skills floating in space.
- 🎙️ **Voice Mode:** Real-time bi-directional conversation capabilities over WebSockets.
- 💻 **Hidden CLI:** Type `sudo [name]` in chat to unlock a concealed Linux-like terminal interface.

---

## <img align="center" src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Wrench.png" alt="Wrench" width="35" /> The Deep Tech Stack

<div align="center">

| Domain | Technologies |
|:---|:---|
| 🧠 **Local AI** | `llama3.2:3b` (Core), `qwen2.5:3b` (Code), `phi4-mini` (Logic), `llava:7b` (Vision) |
| 🪢 **Core Backend** | Python 3.12, FastAPI, LangGraph, Langchain |
| 🗄️ **Data & Vector** | PostgreSQL 16 (pgvector), Redis Stack, Qdrant |
| 🎯 **RAG & NLP** | RAGatouille (ColBERT), Outlines (JSON schema), DSPy, Ragas |
| ⚙️ **Background Ops** | Celery, Temporal.io, Docker Compose |
| 📊 **Observability** | LangFuse, Prometheus, Grafana, Umami, ntfy (Alerts) |
| 🎨 **Frontend UI** | Next.js 14, Three.js, Framer Motion, Shiki |

</div>

---

## <img align="center" src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/High-Speed%20Train.png" alt="High-Speed Train" width="35" /> Deployment & Quick Start

**Prerequisites:** Docker, Docker Compose v2, Git, 8GB+ RAM.

### 1. Bootstrap
```bash
git clone https://github.com/yourusername/agentic-portfolio-website
cd agentic-portfolio-website

# Prepare your credentials
cp .env.genesis .env
```

### 2. Ignition
```bash
# Bring up the core 6-service dev stack
make dev
```
<details>
<summary><img align="center" src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Eyes.png" alt="Eyes" width="20" /> See Output</summary>
<br>

```text
✅ Agentic Portfolio Website dev is running!
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

## <img align="center" src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/File%20Folder.png" alt="Folder" width="35" /> The Data Flow

Populate your unique perspective via markdown files in the `/data` directory. **The system's authenticity is directly proportional to the honesty written here.**

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

---

<div align="center">
<br/>

**Built over 2 months. Designed across 53 blueprints. 4 architectural epochs.**

### `sudo make dev` <br/> *Because a static portfolio is a dead portfolio.*

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

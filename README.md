<div align="center">

<img src="https://capsule-render.vercel.app/api?type=venom&height=250&color=gradient&customColorList=6,11,20&text=Aman%20Bhaskar&fontSize=70&fontColor=fff&animation=twinkling&fontAlignY=38&desc=Agentic%20AI%20Developer%20%7C%20Portfolio&descSize=20&descAlignY=58&descColor=a78bfa" width="100%" alt="Aman Bhaskar - Agentic AI Developer" />

<br/>

<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&pause=1000&color=6366F1&center=true&vCenter=true&multiline=true&repeat=true&width=800&height=60&lines=Building+production-grade+AI+systems+that+actually+ship.;RAG+pipelines+%7C+LLM+infrastructure+%7C+Agentic+systems" alt="Typing SVG" />
</a>

<br/><br/>

<p>
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
  <img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"/>
  <img src="https://img.shields.io/badge/Ollama-Local_AI-FF4500?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
</p>
<p>
  <img src="https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
  <img src="https://img.shields.io/badge/Cloud_Cost-%240-22C55E?style=for-the-badge"/>
</p>

<p>
  <a href="https://github.com/aman-bhaskar-codes"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/></a>
  <a href="https://www.linkedin.com/in/aman-bhaskar-18jan2005/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white"/></a>
  <a href="https://x.com/_aman_bhaskar"><img src="https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white"/></a>
  <a href="https://www.instagram.com/mr.aman.bhaskar/"><img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white"/></a>
  <a href="mailto:amanbhaskarcodes@gmail.com"><img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white"/></a>
</p>

</div>

---

## 👋 About Me

**Aman Bhaskar** · 20 · Bijnor, Uttar Pradesh, India

I'm a self-taught agentic AI developer. I build production-grade AI systems — not toy demos. Every project in my GitHub is something I actually completed, debugged, and shipped.

```
 Name:      Aman Bhaskar
 Age:       20 (born January 18, 2005)
 Location:  Bijnor, UP, India (UTC+5:30)
 Focus:     Agentic AI · RAG Pipelines · LLM Infrastructure
 Philosophy: Local-first, production-grade from day one
 Status:    Open to remote opportunities
```

I didn't come from a CS college or a big-city coding bootcamp. I taught myself by building real things — starting from game development in Godot, progressing through database engineering in PostgreSQL, and arriving at my current focus: **the intersection of LLM engineering and distributed systems**.

The question I work on: *How do you make AI that actually works at production scale — without hallucinating, without crashing, and without running up a massive API bill?*

My answer: **local-first development** (Ollama, local Postgres, zero cloud spend during dev), then **deploy lean** when ready (Neon Serverless, Google Cloud Run, Docker). Production-grade from day one, cost-free until you need scale.

---

## 🧠 What This Project Is

This portfolio website is itself an **agentic AI system** — not a static list of projects. It features:

- **🤖 AI Digital Twin** — A RAG-powered chat interface that knows my projects, technical decisions, and availability. Ask it anything.
- **🔍 Local RAG Pipeline** — Ollama (`llama3.2:3b` + `nomic-embed-text`) with JSON vector store. Hybrid retrieval with cosine similarity + BM25 keyword boosting.
- **👁️ Visitor Persona Detection** — Classifies visitors (Recruiter, Engineer, Founder, Casual) from HTTP referrer and UTM params. Adapts the AI's system prompt per persona.
- **🐙 GitHub Knowledge Sync** — Auto-ingests READMEs and metadata from my repos via Octokit. The AI knows my code.
- **📡 SSE Streaming** — Real-time token-by-token chat responses via Server-Sent Events.
- **💰 Zero Cloud Cost** — Everything runs locally on `npm run dev`. No API keys required.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    VISITOR BROWSER                    │
│   Hero · About · Projects · Skills · AI Chat · Contact│
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────────┐
   │ GET /    │  │ GET      │  │ POST         │
   │ Homepage │  │ /api/    │  │ /api/chat    │
   │          │  │ github   │  │ (SSE stream) │
   └──────────┘  └──────────┘  └──────┬───────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                  ▼
             ┌───────────┐   ┌──────────────┐   ┌────────────┐
             │ Persona   │   │ RAG Store    │   │ Ollama     │
             │ Detection │   │ (vectors.json)│   │ llama3.2:3b│
             │ (referer) │   │ cosine+BM25  │   │ nomic-embed│
             └───────────┘   └──────────────┘   └────────────┘
```

### Key Files

| Layer | File | Purpose |
|:------|:-----|:--------|
| **Frontend** | `components/portfolio/*.tsx` | Navigation, Hero, About, Projects, Skills, Chat, Contact |
| **API** | `app/api/chat/route.ts` | RAG-powered streaming chat with persona injection |
| **API** | `app/api/github/route.ts` | GitHub projects fetcher with caching |
| **API** | `app/api/ingest/route.ts` | Knowledge base ingestion endpoint |
| **Lib** | `lib/ollama.ts` | Ollama client (embed + stream chat) |
| **Lib** | `lib/rag-store.ts` | JSON vector store with cosine similarity + BM25 |
| **Lib** | `lib/personas.ts` | Visitor persona detection from HTTP signals |
| **Lib** | `lib/github-agent.ts` | GitHub data fetcher via Octokit |
| **Data** | `data/knowledge.md` | Complete knowledge base for RAG |
| **Script** | `scripts/ingest.ts` | One-shot knowledge → vector embedding |

---

## 🚀 Quickstart

```bash
# 1. Clone
git clone https://github.com/aman-bhaskar-codes/portfolio-website.git
cd portfolio-website

# 2. Install
npm install

# 3. Start Ollama (separate terminal)
ollama serve
ollama pull llama3.2:3b
ollama pull nomic-embed-text

# 4. Create local env
echo 'OLLAMA_BASE_URL=http://localhost:11434' > .env.local
echo 'OLLAMA_CHAT_MODEL=llama3.2:3b' >> .env.local
echo 'OLLAMA_EMBED_MODEL=nomic-embed-text' >> .env.local

# 5. Ingest knowledge base (populates data/vectors.json)
npx tsx scripts/ingest.ts

# 6. Run
npm run dev
# → http://localhost:3000
```

**Requirements:**
- Node.js 18+
- [Ollama](https://ollama.ai) installed locally
- ~4GB disk for models (`llama3.2:3b` + `nomic-embed-text`)

---

## 🛠️ Tech Stack

| Category | Technology | Why |
|:---------|:-----------|:----|
| **Framework** | Next.js 15 (App Router) | SSR + API routes in one project |
| **LLM** | Ollama (llama3.2:3b) | Local, free, fast for 3B params |
| **Embeddings** | nomic-embed-text (768d) | Best local embedding model |
| **Vector Store** | JSON file (cosine + BM25) | Zero infra, upgradeable to pgvector |
| **Styling** | Tailwind CSS v4 | CSS-first config, fast iteration |
| **Chat** | SSE (Server-Sent Events) | Real-time streaming without WebSocket complexity |
| **GitHub** | Octokit REST API | Fetch repos, READMEs, metadata |
| **Language** | TypeScript | Type safety catches bugs at compile time |

---

## 📊 Projects I've Built

| Project | Stack | What It Does |
|:--------|:------|:-------------|
| **[rag-research-assistant](https://github.com/aman-bhaskar-codes/rag-research-assistant)** | Python · FastAPI · pgvector · Redis · Ollama · Gemini | Production RAG system with HyDE, BM25, RRF fusion, cross-encoder reranking. Deployed on GCP. |
| **[llm-engineering-lab](https://github.com/aman-bhaskar-codes/llm-engineering-lab)** | Python · FastAPI · Pydantic · Ollama | Structured extraction engine — unstructured docs → typed JSON. Multi-tier LLM routing, SSE, ARQ workers. |
| **[sql-data-systems-projects](https://github.com/aman-bhaskar-codes/sql-data-systems-projects)** | PL/pgSQL · PostgreSQL | Database engineering — university systems, analytics, large-scale simulations. |
| **[portfolio-website](https://github.com/aman-bhaskar-codes/portfolio-website)** | TypeScript · Next.js · Ollama | This project — agentic portfolio with RAG-powered AI twin. |

---

## 🎯 Skills

<table>
<tr>
<td width="25%" valign="top">

**AI / LLM**
- RAG pipelines
- Ollama (local LLMs)
- Hybrid retrieval
- HyDE + RRF fusion
- Cross-encoder reranking
- Pydantic validation
- LangChain / LangGraph

</td>
<td width="25%" valign="top">

**Backend**
- FastAPI + Uvicorn
- Python (async/await)
- SSE streaming
- Docker + Compose
- Google Cloud Run
- JWT authentication
- REST API design

</td>
<td width="25%" valign="top">

**Databases**
- PostgreSQL + pgvector
- Neon Serverless
- Redis / Upstash
- PL/pgSQL
- SQLAlchemy + Alembic
- Schema design
- Query optimization

</td>
<td width="25%" valign="top">

**Frontend**
- Next.js 14/15
- TypeScript
- React + Zustand
- Tailwind CSS
- SSE client
- Framer Motion
- React Markdown

</td>
</tr>
</table>

---

## 📅 Timeline

| Period | Focus | Key Output |
|:-------|:------|:-----------|
| **2023** | Game Development | TMNT beat-em-up in Godot (GDScript). First serious programming project. |
| **2023–2024** | Database Engineering | `sql-data-systems-projects` — PL/pgSQL, stored procedures, analytics at scale. |
| **2024** | LLM Engineering | `llm-engineering-lab` — Structured extraction, multi-tier routing, SSE streaming. |
| **2024** | RAG Systems | `rag-research-assistant` — Hybrid RAG with HyDE, BM25, RRF, cross-encoder. Deployed on GCP. |
| **2025** | Agentic Portfolio | This project — RAG-powered AI twin, visitor intelligence, GitHub knowledge sync. |

---

## 📬 Contact

I'm open to **remote opportunities** in AI engineering, LLM infrastructure, and full-stack development.

| Channel | Link |
|:--------|:-----|
| **Email** | [amanbhaskarcodes@gmail.com](mailto:amanbhaskarcodes@gmail.com) |
| **GitHub** | [github.com/aman-bhaskar-codes](https://github.com/aman-bhaskar-codes) |
| **LinkedIn** | [linkedin.com/in/aman-bhaskar-18jan2005](https://www.linkedin.com/in/aman-bhaskar-18jan2005/) |
| **X/Twitter** | [@_aman_bhaskar](https://x.com/_aman_bhaskar) |
| **Instagram** | [@mr.aman.bhaskar](https://www.instagram.com/mr.aman.bhaskar/) |

**Response time:** Within 24 hours.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer" width="100%" alt="Footer" />

**Built with Next.js · Ollama · Zero cloud spend**

</div>

# ANTIGRAVITY OS — VERSION 3: FINAL UNIFIED SYSTEM
## The Complete, Connected, Production-Ready Blueprint

> **Codename: ANTIGRAVITY OS v3 — "OMEGA BUILD"**
> This is the last document. Everything from v1 (Sections 1–21), v2 (Sections 22–33),
> and v3 (Sections 34–52) unifies into one executable system design.
> Every component is named. Every wire is drawn. Every free tool is specified.
> After this document, there is nothing left to design — only to build.

---

## PREAMBLE: WHAT THIS DOCUMENT ADDS

| Already Designed (v1 + v2) | What v3 Adds |
|---|---|
| LangGraph orchestration, RAG, KG, personas | DSPy automated prompt self-optimization |
| Dense vector retrieval + HyDE | ColBERT/RAGatouille late-interaction retrieval |
| Basic reranker reference | Local cross-encoder reranker (free, no API) |
| Vision model mention only | Full local multimodal pipeline (LLaVA via Ollama) |
| Grafana + basic observability | LangFuse traces + SigNoz full stack + Ragas eval |
| Manual RAG quality | Automated RAG evaluation loop (Ragas, free) |
| S3 for PDF briefs | MinIO (free self-hosted S3-compatible) |
| Basic analytics | Umami (free self-hosted, privacy-respecting) |
| No push notifications | ntfy (free self-hosted push) |
| No offline capability | Full PWA + Service Worker + offline mode |
| No structured LLM outputs | Outlines library (guaranteed JSON from local LLMs) |
| No browser-side intelligence | WebWorker embeddings + FingerprintJS (free OSS) |
| Celery for all workflows | Temporal.io for complex long-running workflows |
| Testing not specified | Playwright E2E + Locust load testing + GitHub Actions CI/CD |
| Separate v1+v2 documents | **THE FINAL UNIFIED CONNECTION MAP** |
| Components defined in isolation | **COMPLETE STARTUP SEQUENCE** |
| Features listed | **DATA FLOW FOR EVERY CRITICAL PATH** |
| Scattered across 3 docs | **MASTER EXECUTION PROMPT** (one prompt to build it all) |

---

## SECTION 34 — THE FINAL FREE TECHNOLOGY STACK

Every tool below is **100% free to self-host**. No SaaS bills beyond what v1/v2 already committed to (Anthropic API fallback, optional ElevenLabs). This is the complete technology manifest.

```
CATEGORY: LOCAL LLM INFERENCE
  - Ollama v0.3+                  Self-hosted, free
    ├─ qwen2.5:7b                 Primary chat model
    ├─ qwen2.5:3b                 Light fallback
    ├─ llava:7b                   Vision model (screenshots, diagrams)
    ├─ nomic-embed-text           Embedding model (768-dim)
    └─ mxbai-rerank-large         Cross-encoder reranker (NEW)

CATEGORY: RETRIEVAL & RAG
  - Qdrant v1.9+                  Self-hosted vector DB (3-node cluster)
  - RAGatouille (ColBERT)         Late-interaction retrieval (NEW, free)
  - sentence-transformers          Local cross-encoder reranker (NEW, free)
  - Ragas v0.1+                   RAG evaluation framework (NEW, free)
  - NLTK + spaCy                  NLP preprocessing (free)
  - Outlines v0.3+                Structured output from local LLMs (NEW, free)

CATEGORY: ORCHESTRATION & WORKFLOWS
  - LangGraph v0.2+               Agent graph orchestration
  - Temporal.io (self-hosted)     Long-running workflow engine (NEW, free)
  - Celery v5 + Redis Streams     Task queue (existing)
  - DSPy v2+                      Automated prompt optimization (NEW, free)

CATEGORY: DATABASES & STORAGE
  - PostgreSQL 16 + pgvector      Primary DB + embeddings
  - Redis Stack                   Cache + vectors + streams
  - DuckDB v0.10+                 Analytics columnar engine (NEW, free)
  - MinIO                         S3-compatible storage for PDFs (NEW, free)
  - Apache Parquet                Analytics data format (via DuckDB)

CATEGORY: OBSERVABILITY (ALL FREE SELF-HOSTED)
  - LangFuse v2 (self-hosted)     LLM traces, spans, evals (NEW, free)
  - SigNoz (self-hosted)          Full APM: traces + metrics + logs (NEW, free)
  - Prometheus + Grafana          Metrics + dashboards (existing)
  - OpenTelemetry SDK             Instrumentation standard (existing)

CATEGORY: ANALYTICS (FREE, NO GOOGLE)
  - Umami (self-hosted)           Privacy-respecting web analytics (NEW, free)
  - DuckDB                        Query analytics data offline

CATEGORY: NOTIFICATIONS (FREE)
  - ntfy (self-hosted)            Push notifications to owner's devices (NEW, free)

CATEGORY: FRONTEND (ALL FREE)
  - Next.js 14 (App Router)       Frontend framework
  - Three.js r128                 3D constellation
  - Framer Motion                 Animations
  - Shiki                         Syntax highlighting
  - Service Workers               Offline/PWA (NEW, free)
  - Web Workers                   Browser-side background compute (NEW, free)
  - Workbox                       PWA toolkit (NEW, free)
  - FingerprintJS OSS             Browser fingerprinting (NEW, free)

CATEGORY: TESTING & CI/CD (FREE)
  - Playwright                    E2E browser testing (NEW, free)
  - Locust                        Load testing (NEW, free)
  - pytest + pytest-asyncio       Backend unit/integration tests
  - GitHub Actions                CI/CD pipeline (NEW, free for public repos)
  - Ruff                          Python linter (free)
  - mypy                          Type checking (free)

CATEGORY: INFRASTRUCTURE (FREE)
  - Docker + Docker Compose       Container runtime
  - NGINX                         Load balancer + reverse proxy
  - Cloudflare Free Tier          CDN + WAF + DDoS protection
  - Patroni                       PostgreSQL HA (free)
  - GitHub                        Source control + webhooks (free)
```

---

## SECTION 35 — DSPy AUTOMATED PROMPT SELF-OPTIMIZATION

### THE BREAKTHROUGH CONCEPT

Every other portfolio chatbot has static prompts written by a human. ANTIGRAVITY OS v3 uses **DSPy** to treat prompts as learnable parameters — the system optimizes its own prompts using real conversation data as training signal.

```
WHAT THIS MEANS IN PRACTICE:
Week 1: System runs with human-written prompts (from v1/v2 design)
Week 2: DSPy analyzes 100+ conversations. It notices:
  - "When we mention architecture patterns early, senior engineers ask 3+ follow-ups"
  - "Recruiter responses that include impact numbers get longer sessions"
  - "Responses over 400 tokens get abandoned by mobile users"
DSPy automatically rewrites the relevant prompt sections.
Week 3: New prompts run. Metrics improve. DSPy observes again.
This loop runs forever. The AI gets measurably better every week automatically.
```

```python
# backend/optimization/dspy_optimizer.py

import dspy
from dspy.teleprompt import BootstrapFewShot, MIPROv2

class PortfolioQASignature(dspy.Signature):
    """
    The core QA task definition.
    DSPy treats the instructions/prompts here as LEARNABLE PARAMETERS.
    """
    visitor_persona:     str = dspy.InputField(desc="Detected visitor persona")
    query:               str = dspy.InputField(desc="Visitor's question")
    rag_context:         str = dspy.InputField(desc="Retrieved knowledge chunks")
    kg_context:          str = dspy.InputField(desc="Knowledge graph query results")
    conversation_history: str = dspy.InputField(desc="Prior conversation turns")
    
    response:            str = dspy.OutputField(desc="Aman's personalized response")
    follow_up_hooks:     str = dspy.OutputField(desc="Suggested follow-up questions")
    conversion_action:   str = dspy.OutputField(desc="Action to offer (brief/interview/walkthrough/none)")

class PortfolioRAGModule(dspy.Module):
    """
    The RAG module that DSPy will optimize.
    DSPy automatically finds the best:
    - Instructions for each step
    - Few-shot examples to include
    - Chain-of-thought reasoning format
    """
    
    def __init__(self):
        super().__init__()
        self.retrieve    = dspy.Retrieve(k=8)
        self.generate    = dspy.ChainOfThought(PortfolioQASignature)
    
    def forward(self, query, visitor_persona, conversation_history):
        context = self.retrieve(query).passages
        return self.generate(
            visitor_persona=visitor_persona,
            query=query,
            rag_context="\n".join(context),
            kg_context=self._query_kg(query),
            conversation_history=conversation_history
        )

class WeeklyDSPyOptimizationPipeline:
    """
    Runs every Sunday night at 1am.
    
    DATA PIPELINE:
    1. Pull last 7 days of conversations from PostgreSQL
    2. Label each conversation with conversion outcome:
       - HIGH:   Led to contact/brief request/interview
       - MEDIUM: Long session, deep follow-ups, project hover time
       - LOW:    Short session, single exchange, no engagement
    3. Build DSPy training set from HIGH/MEDIUM examples
    4. Run MIPROv2 optimizer (best DSPy optimizer for instruction tuning)
    5. Evaluate new prompts against held-out LOW examples
       (Verify: does the new prompt bring LOW → MEDIUM?)
    6. If metric improvement > 5%: deploy new prompts to production
    7. If improvement < 5%: keep current prompts, log for manual review
    
    METRIC:
    DSPy optimization target = engagement_score
    engagement_score = 
      (session_duration_minutes × 2) +
      (follow_up_depth × 3) +
      (conversion_action_taken × 10) +
      (return_visit_within_7_days × 5)
    """
    
    async def run_optimization_cycle(self):
        # Step 1: Collect training data
        conversations = await self.db.get_labeled_conversations(days=7)
        trainset = self._build_dspy_trainset(conversations)
        
        # Step 2: Configure optimizer
        teleprompter = MIPROv2(
            metric=self._engagement_metric,
            num_candidates=15,      # How many prompt variants to try
            num_trials=25,          # Evaluation trials per variant
            max_bootstrapped_demos=4,
            max_labeled_demos=8,
        )
        
        # Step 3: Optimize
        optimized_module = teleprompter.compile(
            PortfolioRAGModule(),
            trainset=trainset,
            requires_permission_to_run=False,  # Fully autonomous
        )
        
        # Step 4: Evaluate on holdout set
        baseline_score = self._evaluate(self.current_module, self.holdout_set)
        new_score      = self._evaluate(optimized_module, self.holdout_set)
        
        improvement = (new_score - baseline_score) / baseline_score
        
        if improvement > 0.05:
            await self._deploy_optimized_module(optimized_module)
            await self.ntfy.notify(
                title="Prompt optimization deployed",
                body=f"Engagement score improved {improvement:.1%}. New prompts live."
            )
        
        # Step 5: Log to LangFuse
        await self.langfuse.log_optimization_run(
            baseline_score=baseline_score,
            new_score=new_score,
            improvement=improvement,
            deployed=(improvement > 0.05)
        )
```

---

## SECTION 36 — RAGATOUILLE: COLBERT LATE-INTERACTION RETRIEVAL

### WHY DENSE RETRIEVAL ALONE FAILS

Standard dense retrieval (embed query → nearest neighbor) misses nuanced technical questions. When a visitor asks "how did you handle the thundering herd problem in your cache layer?", dense retrieval finds "cache" chunks but misses the **specific pattern** being asked about.

**ColBERT** (via RAGatouille) solves this: instead of comparing single query vector to single doc vector, it compares **every query token to every document token** — finding precise token-level matches for technical specificity.

```python
# backend/rag/colbert_retriever.py

from ragatouille import RAGPretrainedModel

class ColBERTRetriever:
    """
    Late-interaction retrieval as the SECOND STAGE of a two-stage pipeline.
    
    TWO-STAGE RETRIEVAL:
    
    Stage 1 — COARSE (fast):
      Qdrant dense retrieval → top-50 candidates
      Speed: ~20ms
      Purpose: broad semantic relevance
    
    Stage 2 — FINE (ColBERT, free local):
      ColBERT reranks top-50 → top-8
      Speed: ~80ms (CPU inference, no GPU needed for 50 docs)
      Purpose: token-level precision on technical queries
    
    Stage 3 — CROSS-ENCODER (sentence-transformers, free local):
      For interview mode and complex queries only:
      Cross-encoder reranks top-8 → final top-4
      Speed: ~50ms
      Purpose: ultimate precision, used sparingly (complex queries only)
    
    Result: The 4 chunks that actually answer the specific technical question.
    Better than 20 chunks of vaguely related text.
    """
    
    def __init__(self):
        # ColBERT model: colbert-ir/colbertv2.0 (downloaded once, ~500MB)
        self.colbert = RAGPretrainedModel.from_pretrained("colbert-ir/colbertv2.0")
        
        # Cross-encoder: runs locally via sentence-transformers
        from sentence_transformers import CrossEncoder
        self.cross_encoder = CrossEncoder(
            "cross-encoder/ms-marco-MiniLM-L-6-v2",  # ~80MB, free
            max_length=512
        )
    
    async def retrieve(self, 
                        query: str, 
                        persona: VisitorPersona,
                        use_cross_encoder: bool = False) -> List[RerankedChunk]:
        
        # Stage 1: Dense retrieval (existing Qdrant pipeline)
        candidates = await self.qdrant.search(
            query_vector=await self.embed(query),
            top_k=50,
            filter=self._build_persona_filter(persona)
        )
        
        # Stage 2: ColBERT reranking
        colbert_scores = self.colbert.rerank(
            query=query,
            documents=[c.content for c in candidates],
            k=8
        )
        top_8 = self._apply_colbert_scores(candidates, colbert_scores)
        
        # Stage 3: Cross-encoder (expensive, selective)
        if use_cross_encoder:
            pairs = [(query, c.content) for c in top_8]
            ce_scores = self.cross_encoder.predict(pairs)
            top_4 = sorted(zip(top_8, ce_scores), key=lambda x: x[1], reverse=True)[:4]
            return [c for c, _ in top_4]
        
        return top_8[:4]
```

---

## SECTION 37 — LOCAL MULTIMODAL PIPELINE (FREE)

### VISION INTELLIGENCE WITHOUT API COSTS

LLaVA runs locally via Ollama. The portfolio can now understand and describe images — project screenshots, architecture diagrams, whiteboard photos — without any external API.

```python
# backend/rag/multimodal_ingestor.py

class LocalVisionPipeline:
    """
    Uses llava:7b (via Ollama) for all image understanding.
    Zero external API calls. Zero cost per image.
    
    THREE USE CASES:
    
    USE CASE 1 — PROJECT SCREENSHOT INGESTION
    For each project screenshot in /data/projects/*/screenshots/:
      1. Send to llava:7b with structured prompt
      2. Get back: technical description + UI components + what it demonstrates
      3. Index description as a RAG chunk linked to the project
      4. When visitor asks about a project → surface image URL + description
    
    USE CASE 2 — ARCHITECTURE DIAGRAM UNDERSTANDING
    For each architecture diagram (from GitHub /docs/ folders):
      1. Fetch via GitHub Contents API
      2. Describe with llava:7b: component names, data flows, patterns
      3. Index as structured chunk: {type: "architecture", entities: [...], flows: [...]}
      4. Knowledge graph: add entities and relations detected in diagram
    
    USE CASE 3 — LIVE VISITOR CONTEXT (EXPERIMENTAL)
    If visitor pastes an image into chat (architecture diagram, error screenshot):
      1. Receive base64 image from frontend
      2. Describe with llava:7b
      3. Inject description into conversation context
      4. AI responds about what's in their image
      Example: "That's a microservices diagram with an API gateway pattern.
                 I built something similar in [Project]. The key challenge was..."
    """
    
    async def describe_project_screenshot(self, 
                                           image_path: str, 
                                           project_name: str) -> ImageDescription:
        prompt = f"""You are analyzing a screenshot from a software project called "{project_name}".
        
        Describe:
        1. What type of interface/output is shown (UI, terminal, dashboard, diagram, etc.)
        2. Key technical components visible (components, charts, data structures, APIs)
        3. What engineering capabilities this demonstrates
        4. One-sentence technical summary for a senior engineer
        5. One-sentence summary for a non-technical recruiter
        
        Be specific. Mention concrete technical details. Avoid vague descriptions."""
        
        response = await self.ollama.generate(
            model="llava:7b",
            prompt=prompt,
            images=[image_path],
        )
        return self._parse_structured_description(response)
    
    async def analyze_architecture_diagram(self, image_url: str) -> ArchitectureAnalysis:
        prompt = """Analyze this software architecture diagram.
        
        Extract and list:
        1. All system components (databases, services, queues, APIs, frontends)
        2. Data flow directions (A → B means A sends data to B)
        3. Architecture patterns used (microservices, CQRS, event-driven, etc.)
        4. Scale indicators (if any: sharding, replication, load balancers)
        5. Technology stack clues visible in the diagram
        
        Format as structured JSON."""
        
        response = await self.ollama.generate(
            model="llava:7b",
            prompt=prompt,
            images=[image_url],
            format="json"  # Outlines-style structured output
        )
        return ArchitectureAnalysis.model_validate_json(response)
```

---

## SECTION 38 — OUTLINES: GUARANTEED STRUCTURED OUTPUTS FROM LOCAL LLMs

### THE PROBLEM WITH LOCAL LLMs

Ollama models sometimes produce malformed JSON, cut off mid-response, or ignore format instructions. In an agentic pipeline, a single malformed JSON response breaks the entire chain.

**Outlines** solves this with constrained decoding — it mathematically guarantees the LLM output matches a schema by filtering logits at inference time.

```python
# backend/llm/structured_output.py

import outlines
import outlines.models as models
from pydantic import BaseModel

class VisitorPersonaClassification(BaseModel):
    persona:     str               # Must be one of the enum values
    confidence:  float             # 0.0 to 1.0
    signals:     list[str]         # Evidence for classification
    
class ProjectSummary(BaseModel):
    recruiter_one_liner:    str    # Max 100 chars
    technical_deep_dive:    str    # For engineers
    impact_statement:       str    # Quantified if possible
    complexity_score:       float  # 0.0 to 10.0
    
class StructuredOutputEngine:
    """
    Wraps Ollama with Outlines for guaranteed schema compliance.
    
    HOW IT WORKS:
    Outlines intercepts the LLM's token generation.
    At each step, it masks out any tokens that would violate the schema.
    The LLM can ONLY generate tokens that keep the output valid.
    Result: 100% schema-compliant output, every time.
    
    WHEN TO USE STRUCTURED OUTPUT:
    - Visitor persona classification (must be valid enum)
    - Project summaries for ingestion (must have all fields)
    - Knowledge graph entity extraction (must be valid relations)
    - Conversion signal detection (must be boolean flags)
    - Ambient trigger generation (must have valid trigger type)
    
    WHEN NOT TO USE (free-form is fine):
    - Main chat responses (markdown, no schema needed)
    - Digital twin voice responses (natural language)
    - Code walkthrough explanations
    """
    
    def __init__(self, model_name: str = "qwen2.5:7b"):
        self.model = models.ollama(model_name)
    
    def classify_persona(self, visitor_signals: str) -> VisitorPersonaClassification:
        generator = outlines.generate.json(self.model, VisitorPersonaClassification)
        return generator(
            f"Classify this visitor's persona from these signals:\n{visitor_signals}"
        )
    
    def extract_project_summary(self, repo_content: str) -> ProjectSummary:
        generator = outlines.generate.json(self.model, ProjectSummary)
        return generator(
            f"Analyze this repository content and generate a structured summary:\n{repo_content}"
        )
```

---

## SECTION 39 — RAGAS: AUTOMATED RAG QUALITY EVALUATION

### THE SILENT KILLER: RAG QUALITY DRIFT

Your RAG was great on day 1. By month 3, after adding 500 new chunks, bad chunks have diluted retrieval quality. You have no idea — because you never measured it.

**Ragas** automatically evaluates RAG quality without human labels, using LLM-as-judge pattern. Free, open source, self-hosted.

```python
# backend/evaluation/ragas_evaluator.py

from ragas import evaluate
from ragas.metrics import (
    faithfulness,        # Is the answer grounded in the retrieved chunks?
    answer_relevancy,    # Is the answer relevant to the question?
    context_precision,   # Are the retrieved chunks actually useful?
    context_recall,      # Are the right chunks being retrieved?
    answer_correctness,  # Is the answer actually correct?
)

class RAGQualityMonitor:
    """
    Runs continuously to detect RAG degradation before visitors notice.
    
    EVALUATION PIPELINE:
    
    1. SYNTHETIC QA GENERATION (nightly)
       For each project/skill/experience in the knowledge base:
       Use Ollama to generate 3-5 representative questions + gold answers
       Store as evaluation dataset in PostgreSQL
    
    2. RAGAS EVALUATION (daily at 4am)
       Run synthetic QA through the full RAG pipeline
       Compute all 5 Ragas metrics per query
       Store metric history in DuckDB (fast columnar analytics)
    
    3. DRIFT DETECTION
       If context_precision drops below threshold: retrieval degraded
         → Trigger re-indexing with ColBERT re-scoring
       If faithfulness drops: LLM is hallucinating beyond retrieved context
         → Alert: review recently added chunks (likely noise)
       If answer_relevancy drops: persona filtering misaligned
         → Review persona-weight metadata on chunks
    
    4. GRAFANA DASHBOARD (Dashboard 9: RAG QUALITY)
       faithfulness:      time series (target > 0.85)
       context_precision: time series (target > 0.75)
       context_recall:    time series (target > 0.70)
       answer_relevancy:  time series (target > 0.80)
       metric_alerts:     any metric below threshold → red indicator
    """
    
    async def run_daily_evaluation(self):
        # Get synthetic evaluation set (generated nightly by Ollama)
        eval_set = await self.db.get_evaluation_dataset()
        
        # Run through full RAG pipeline
        results = []
        for question, gold_answer, context in eval_set:
            retrieved = await self.rag.retrieve(question)
            generated = await self.llm.generate(question, context=retrieved)
            results.append({
                "question":  question,
                "answer":    generated,
                "contexts":  [c.content for c in retrieved],
                "ground_truth": gold_answer
            })
        
        # Compute Ragas metrics
        dataset = Dataset.from_list(results)
        scores = evaluate(dataset, metrics=[
            faithfulness, answer_relevancy, context_precision, context_recall
        ])
        
        # Store in DuckDB for fast analytics
        await self.duckdb.insert("rag_quality_metrics", {
            "date": datetime.utcnow(),
            **scores
        })
        
        # Alert if degraded
        if scores["faithfulness"] < 0.80:
            await self.ntfy.notify(
                title="⚠️ RAG faithfulness degraded",
                body=f"Faithfulness: {scores['faithfulness']:.2f} (target: 0.85). Review recent chunks."
            )
```

---

## SECTION 40 — DUCKDB ANALYTICS ENGINE

### FASTER ANALYTICS, ZERO COST

PostgreSQL is the wrong tool for analytical queries. DuckDB is purpose-built for it — it's columnar, embedded (no separate server), and queries 100M rows in seconds.

```python
# backend/analytics/duckdb_engine.py

class AnalyticsEngine:
    """
    DuckDB as the analytics layer. PostgreSQL handles transactional writes.
    DuckDB handles all analytical reads.
    
    ARCHITECTURE:
    
    PostgreSQL (OLTP):     conversation logs, visitor profiles, conversion events
          ↓ (nightly ETL via Parquet export)
    DuckDB (OLAP):         all analytics queries, Grafana dashboards, DSPy training data
    
    WHY DUCKDB:
    - 100x faster than PostgreSQL for analytical queries
    - Embedded: runs inside the Python process, no separate server
    - Reads Parquet files directly (no import step)
    - FREE, open source, zero infrastructure
    
    DAILY ETL (2am, after DSPy optimization run):
    1. Export PostgreSQL tables to Parquet (pg2parquet or COPY TO)
    2. DuckDB registers Parquet files as external tables
    3. All analytical queries now hit DuckDB
    
    ANALYTICAL QUERIES SERVED BY DUCKDB:
    """
    
    ANALYTICS_QUERIES = {
        "persona_distribution_7d": """
            SELECT visitor_persona, COUNT(*) as sessions,
                   AVG(session_duration_minutes) as avg_duration,
                   AVG(conversion_score) as avg_conversion
            FROM sessions
            WHERE created_at > NOW() - INTERVAL 7 DAYS
            GROUP BY visitor_persona
            ORDER BY sessions DESC
        """,
        
        "top_engagement_topics": """
            SELECT topic_cluster, 
                   COUNT(*) as times_asked,
                   AVG(follow_up_depth) as avg_depth,
                   AVG(conversion_score) as avg_conversion
            FROM conversations
            WHERE created_at > NOW() - INTERVAL 30 DAYS
            GROUP BY topic_cluster
            ORDER BY avg_depth DESC
            LIMIT 20
        """,
        
        "rag_quality_trend": """
            SELECT DATE_TRUNC('day', evaluation_date) as day,
                   AVG(faithfulness) as faithfulness,
                   AVG(context_precision) as context_precision,
                   AVG(answer_relevancy) as answer_relevancy
            FROM rag_quality_metrics
            WHERE evaluation_date > NOW() - INTERVAL 30 DAYS
            GROUP BY 1
            ORDER BY 1
        """,
        
        "dspy_optimization_history": """
            SELECT run_date, baseline_score, new_score, improvement_pct, was_deployed
            FROM dspy_optimization_runs
            ORDER BY run_date DESC
            LIMIT 12
        """
    }
```

---

## SECTION 41 — LANGFUSE: FREE SELF-HOSTED LLM OBSERVABILITY

### WHAT LANGFUSE PROVIDES (FREE)

LangFuse gives you OpenAI-style tracing for every LLM call — see the full prompt, retrieved chunks, latency breakdown, token costs, and response quality — all in a beautiful UI. Self-hosted, forever free.

```python
# backend/observability/langfuse_tracer.py

from langfuse import Langfuse
from langfuse.decorators import observe, langfuse_context

# Self-hosted LangFuse (runs as Docker container)
langfuse = Langfuse(
    public_key=LANGFUSE_PUBLIC_KEY,
    secret_key=LANGFUSE_SECRET_KEY,
    host="http://langfuse:3001",  # Self-hosted
)

class LangFuseTracer:
    """
    Every LangGraph node execution is traced.
    Every LLM call has full prompt/response/token visibility.
    
    WHAT YOU CAN SEE IN LANGFUSE UI:
    - Full system prompt (with persona injection)
    - Every RAG chunk retrieved (with scores)
    - LLM response + latency + token count
    - Total cost per conversation (mapped to visitor session)
    - Which prompts were generated by DSPy vs written by human
    - A/B test results (which prompt variant performed better)
    - Ragas evaluation scores per conversation
    - Visitor persona per trace (for filtering)
    
    TRACE STRUCTURE:
    Trace: visitor_session_{id}
    ├── Span: persona_classification        (5ms)
    ├── Span: rag_retrieval
    │   ├── Generation: embed_query        (8ms)
    │   ├── Span: qdrant_search           (15ms)
    │   ├── Span: colbert_rerank          (80ms)
    │   └── Span: cross_encoder_rerank    (50ms, if triggered)
    ├── Span: kg_query                    (10ms)
    ├── Generation: llm_response
    │   ├── Model: qwen2.5:7b
    │   ├── Prompt tokens: 1,847
    │   ├── Completion tokens: 412
    │   └── Latency: 2.3s
    └── Span: conversion_signal_detection (2ms)
    """
    
    @observe(name="portfolio_chat")
    async def trace_full_request(self, 
                                  query: str, 
                                  visitor_id: str,
                                  persona: str) -> str:
        
        langfuse_context.update_current_trace(
            session_id=visitor_id,
            user_id=visitor_id,
            tags=[persona, "production"],
            metadata={"persona": persona}
        )
        
        # All child spans automatically captured by @observe decorator
        result = await self.agent_graph.run(query)
        
        langfuse_context.update_current_observation(
            output=result.response,
            usage={
                "input": result.prompt_tokens,
                "output": result.completion_tokens,
            }
        )
        
        return result.response
```

---

## SECTION 42 — MINIO: FREE SELF-HOSTED S3

### WHY MINIO INSTEAD OF AWS S3

AWS S3 costs money. MinIO is S3-compatible (uses the same SDK), runs in a Docker container, costs $0, and stores PDF briefs, archived conversations, project screenshots, and audio samples.

```yaml
# docker-compose additions
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER:     ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"   # S3 API
      - "9001:9001"   # Web console
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
```

```python
# backend/storage/minio_client.py

import boto3

class StorageClient:
    """
    MinIO client using standard boto3 (AWS SDK) — fully compatible.
    Zero code change from S3: just change the endpoint_url.
    
    BUCKETS:
    - portfolio-briefs:        PDF recruiter briefs (presigned URLs, 1hr TTL)
    - portfolio-screenshots:   Project screenshots (public read)
    - portfolio-audio:         Voice samples (private)
    - portfolio-analytics:     Parquet exports for DuckDB
    - portfolio-backups:       DB dumps (nightly)
    
    LIFECYCLE POLICIES:
    - briefs/:       Delete after 24 hours (auto-expire)
    - analytics/:    Move to cold storage after 90 days
    - backups/:      Keep 30 days rolling
    """
    
    def __init__(self):
        self.client = boto3.client(
            "s3",
            endpoint_url="http://minio:9000",  # Self-hosted
            aws_access_key_id=MINIO_ROOT_USER,
            aws_secret_access_key=MINIO_ROOT_PASSWORD,
        )
    
    async def upload_brief(self, pdf_bytes: bytes, brief_id: str) -> str:
        """Upload PDF and return 1-hour presigned URL"""
        key = f"briefs/{brief_id}.pdf"
        self.client.put_object(
            Bucket="portfolio-briefs",
            Key=key,
            Body=pdf_bytes,
            ContentType="application/pdf"
        )
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": "portfolio-briefs", "Key": key},
            ExpiresIn=3600
        )
```

---

## SECTION 43 — PROGRESSIVE WEB APP + OFFLINE INTELLIGENCE

### THE PORTFOLIO THAT WORKS OFFLINE

A PWA transforms the portfolio into an installable app on any device. The Service Worker caches critical content, enabling offline browsing and push notifications.

```typescript
// public/sw.js — Service Worker

const CACHE_VERSION = "antigravity-v3";
const STATIC_CACHE = [
  "/",
  "/offline",
  "/_next/static/css/main.css",
  // Core JS bundles auto-added by Workbox during build
];

// CACHING STRATEGY PER RESOURCE TYPE:
//
// Static assets (JS, CSS, fonts):  Cache First → always fast
// Portfolio pages (/, /projects):  Stale While Revalidate → fast + fresh
// API: /api/github/activity:       Network First, cache fallback → real data when online
// API: /api/chat:                  Network Only → AI chat requires connection
// Images:                          Cache First, 30-day TTL
// Offline fallback:                When network fails → serve /offline page
//   /offline shows: static profile, cached projects, "AI chat needs internet"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(STATIC_CACHE))
  );
});

// PUSH NOTIFICATION SUPPORT:
// Owner sets up ntfy integration. When portfolio gets a significant event:
// - New visitor from recognized company (Google, Stripe, YC)
// - Recruiter downloaded a brief
// - Stump Mode stumped the AI 3+ times
// - Someone returned for their 3rd visit
// Owner gets mobile push notification via ntfy.
```

```typescript
// frontend/hooks/usePWA.ts

export function usePWA() {
  useEffect(() => {
    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
    
    // PWA Install Prompt (only show to engineers after 2+ minutes)
    // "Add Aman's portfolio to your home screen?"
    // This is subtle — shown once, never again if dismissed
  }, []);
}
```

```typescript
// frontend/workers/embedding.worker.ts — WEB WORKER FOR BROWSER-SIDE EMBEDDINGS

/**
 * This Web Worker runs the EMBEDDING MODEL inside the visitor's browser.
 * Zero API calls for semantic similarity in the frontend.
 *
 * USE CASES:
 * 1. Client-side semantic search of cached project data
 *    (When offline, visitor can still "search" through cached content)
 * 2. Real-time "related questions" suggestion
 *    (Embed visitor's current query → find semantically similar past questions)
 * 3. Client-side persona refinement
 *    (Visitor's typing pattern → refine persona estimate locally)
 *
 * MODEL: Transformers.js (free, runs in browser via WASM)
 *   - nomic-embed-text-v1.5 (quantized, ~30MB download, cached via SW)
 *   - Inference: ~50ms per embedding on modern laptop CPU
 *
 * PRIVACY: All computation happens client-side. No embedding data leaves browser.
 */

import { pipeline, env } from "@xenova/transformers";

env.allowLocalModels = false; // Use HuggingFace CDN (cached by Service Worker)

let embedder: any = null;

self.onmessage = async (event) => {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/nomic-embed-text-v1.5");
  }
  
  const { text, id } = event.data;
  const output = await embedder(text, { pooling: "mean", normalize: true });
  
  self.postMessage({ embedding: Array.from(output.data), id });
};
```

---

## SECTION 44 — UMAMI: FREE PRIVACY-RESPECTING ANALYTICS

### WHY UMAMI INSTEAD OF GOOGLE ANALYTICS

Google Analytics sells your visitors' data. Umami is self-hosted, GDPR-compliant, privacy-respecting, and completely free.

```yaml
# docker-compose additions
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASS}@postgres:5432/umami
      APP_SECRET: ${UMAMI_SECRET}
    ports:
      - "3002:3000"
    depends_on:
      - postgres
```

```typescript
// frontend/lib/analytics.ts

import * as umami from "@umami/node";

// Custom events tracked (beyond standard page views):
const ANALYTICS_EVENTS = {
  // Engagement events
  CHAT_OPENED:              "chat_opened",
  CONSTELLATION_EXPLORED:   "constellation_explored",
  VOICE_MODE_ACTIVATED:     "voice_mode_activated",
  CLI_MODE_DISCOVERED:      "cli_mode_discovered",
  CODE_WALKTHROUGH_STARTED: "code_walkthrough_started",
  PROJECT_TIME_MACHINE:     "time_machine_used",
  STUMP_MODE_ACTIVATED:     "stump_mode_activated",
  BUILD_WITH_ME_STARTED:    "build_with_me_started",
  
  // Conversion events
  BRIEF_DOWNLOADED:         "brief_downloaded",
  CONTACT_REVEALED:         "contact_revealed",
  GITHUB_LINK_CLICKED:      "github_link_clicked",
  LINKEDIN_CLICKED:         "linkedin_clicked",
  RESUME_DOWNLOADED:        "resume_downloaded",
  
  // Quality events
  QUESTION_LEADERBOARD_SUBMITTED: "question_submitted",
  AI_STUMPED:               "ai_stumped",
  VOICE_RESPONSE_PLAYED:    "voice_response_played",
  
  // Session depth events
  RETURN_VISIT:             "return_visit",
  DEEP_SESSION:             "deep_session_10min",
  SUPER_SESSION:            "super_session_25min",
};
```

---

## SECTION 45 — NTFY: FREE SELF-HOSTED PUSH NOTIFICATIONS

### REAL-TIME OWNER ALERTS

The portfolio owner gets mobile push notifications for high-value events — no polling, no email lag.

```yaml
# docker-compose additions
  ntfy:
    image: binwiederhier/ntfy
    command: serve
    environment:
      NTFY_BASE_URL: https://ntfy.${YOUR_DOMAIN}
      NTFY_BEHIND_PROXY: "true"
    volumes:
      - ntfy_cache:/var/cache/ntfy
      - ntfy_etc:/etc/ntfy
    ports:
      - "8080:80"
```

```python
# backend/notifications/ntfy_client.py

class OwnerNotifier:
    """
    Push notifications to owner's devices (phone, laptop, watch).
    Owner subscribes to ntfy topic via the free ntfy.sh app or self-hosted.
    
    NOTIFICATION TRIGGERS AND PRIORITIES:
    
    URGENT (max priority, sound + vibration):
    - Visitor from Google/Meta/OpenAI/Anthropic detected
    - Brief downloaded (potential recruiter conversion)
    - Visitor with 30+ min session (super-engaged)
    
    HIGH (high priority, banner):
    - Visitor from recognized startup (YC, top-50 by funding)
    - Return visitor on 3rd+ visit
    - Question leaderboard submission received
    - DSPy optimization deployed
    
    DEFAULT:
    - RAG quality metric alert
    - Nightly summary (visits, top personas, conversions)
    - New opportunity discovery (from OpportunityAgent)
    - System health change (degradation tier shift)
    
    LOW (silent):
    - GitHub sync completed
    - Freshness sweep completed
    - New chunk ingested
    """
    
    async def notify(self, 
                      title: str, 
                      body: str, 
                      priority: str = "default",
                      tags: List[str] = None) -> None:
        
        await httpx.post(
            f"{NTFY_BASE_URL}/portfolio-alerts",
            headers={
                "Title":    title,
                "Priority": priority,
                "Tags":     ",".join(tags or []),
            },
            content=body,
        )
    
    async def send_nightly_digest(self):
        """Runs at 11pm daily"""
        stats = await self.analytics.get_daily_summary()
        
        await self.notify(
            title=f"Portfolio: {stats.sessions} visits today",
            body=(
                f"🎯 {stats.chat_opens} chat opens\n"
                f"📥 {stats.briefs_downloaded} briefs downloaded\n"
                f"🔝 Top persona: {stats.top_persona}\n"
                f"⭐ Top company: {stats.top_company or 'unknown'}\n"
                f"💡 AI stumped: {stats.times_stumped} times"
            ),
            priority="low",
            tags=["bar_chart", "robot"]
        )
```

---

## SECTION 46 — TEMPORAL.IO: LONG-RUNNING WORKFLOW ORCHESTRATION

### WHY TEMPORAL FOR COMPLEX WORKFLOWS

Celery is great for simple tasks. But multi-step workflows — like "ingest a repo, analyze it, build KG entries, update embeddings, re-evaluate RAG quality, notify owner" — break silently if any step fails. Temporal provides durable execution: workflows survive server restarts, automatically retry failed steps, and give you a full audit history.

```python
# backend/workflows/github_ingest_workflow.py

from temporalio import workflow, activity

@workflow.defn
class GitHubRepositoryIngestionWorkflow:
    """
    Durable, resumable workflow for full repository ingestion.
    
    If ANY step fails (GitHub API rate limit, Qdrant down, etc.):
    - Temporal persists workflow state
    - Retries the failed step with exponential backoff
    - Continues from the EXACT step that failed (not from scratch)
    - You can see the full state in Temporal Web UI (free self-hosted)
    
    STEPS (all durable, all resumable):
    """
    
    @workflow.run
    async def run(self, repo_name: str) -> IngestionResult:
        
        # Step 1: Deep repository analysis
        repo_profile = await workflow.execute_activity(
            analyze_repository_deep,
            args=[repo_name],
            start_to_close_timeout=timedelta(minutes=10),
            retry_policy=RetryPolicy(maximum_attempts=3, backoff_coefficient=2)
        )
        
        # Step 2: Generate semantic chunks
        chunks = await workflow.execute_activity(
            generate_semantic_chunks,
            args=[repo_profile],
            start_to_close_timeout=timedelta(minutes=5),
        )
        
        # Step 3: Run vision pipeline on screenshots
        if repo_profile.has_screenshots:
            image_descriptions = await workflow.execute_activity(
                run_vision_pipeline,
                args=[repo_profile.screenshot_urls],
                start_to_close_timeout=timedelta(minutes=8),
            )
        
        # Step 4: Ingest to Qdrant (with ColBERT indexing)
        await workflow.execute_activity(
            ingest_to_vector_store,
            args=[chunks + (image_descriptions or [])],
            start_to_close_timeout=timedelta(minutes=10),
        )
        
        # Step 5: Build knowledge graph entries
        await workflow.execute_activity(
            build_knowledge_graph_entries,
            args=[repo_profile],
            start_to_close_timeout=timedelta(minutes=3),
        )
        
        # Step 6: Run Ragas evaluation on new chunks
        quality_score = await workflow.execute_activity(
            evaluate_new_chunks_quality,
            args=[chunks],
            start_to_close_timeout=timedelta(minutes=5),
        )
        
        # Step 7: Notify owner
        await workflow.execute_activity(
            notify_ingestion_complete,
            args=[repo_name, quality_score],
        )
        
        return IngestionResult(
            repo=repo_name,
            chunks_added=len(chunks),
            quality_score=quality_score
        )


@workflow.defn
class DSPyOptimizationWorkflow:
    """Weekly DSPy optimization — multi-hour workflow that survives restarts"""
    pass

@workflow.defn  
class WeeklyAnalyticsWorkflow:
    """Data export → DuckDB → Ragas eval → DSPy prep → Grafana refresh"""
    pass
```

---

## SECTION 47 — COMPLETE CI/CD PIPELINE (FREE: GITHUB ACTIONS)

```yaml
# .github/workflows/production.yml

name: ANTIGRAVITY OS — Production Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # ─── QUALITY GATE ──────────────────────────────────────────────────────────
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Python lint (Ruff)
        run: ruff check backend/
      
      - name: Type check (mypy)
        run: mypy backend/ --strict
      
      - name: Security scan (Bandit)
        run: bandit -r backend/ -ll
      
      - name: Dependency audit
        run: pip-audit -r requirements.txt
      
      - name: Frontend lint (ESLint + TypeScript)
        run: cd frontend && npm run lint && npm run type-check

  # ─── BACKEND TESTS ─────────────────────────────────────────────────────────
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_PASSWORD: test
      redis:
        image: redis/redis-stack:latest
      qdrant:
        image: qdrant/qdrant:latest
    steps:
      - name: Unit tests
        run: pytest backend/tests/unit/ -v --cov=backend --cov-report=xml
      
      - name: Integration tests
        run: pytest backend/tests/integration/ -v --timeout=60
      
      - name: Security shield tests (injection patterns)
        run: pytest backend/tests/security/ -v
      
      - name: RAG pipeline tests
        run: pytest backend/tests/rag/ -v

  # ─── E2E TESTS (Playwright) ────────────────────────────────────────────────
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Start full stack
        run: docker compose -f docker-compose.test.yml up -d
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload test report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

  # ─── LOAD TEST (Locust) ────────────────────────────────────────────────────
  load-test:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Run load test (50 users, 60 seconds)
        run: |
          locust -f tests/load/locustfile.py \
            --headless -u 50 -r 5 -t 60s \
            --host=http://staging.portfolio \
            --exit-code-on-error 1

  # ─── DEPLOY ────────────────────────────────────────────────────────────────
  deploy:
    needs: [quality, backend-tests, e2e-tests]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production (SSH + Docker Compose pull)
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/antigravity
            git pull origin main
            docker compose pull
            docker compose up -d --remove-orphans
            docker compose run --rm backend python -m alembic upgrade head
```

```python
# tests/load/locustfile.py — Locust load test

from locust import HttpUser, task, between

class PortfolioVisitor(HttpUser):
    wait_time = between(2, 8)  # Realistic human browsing pace
    
    @task(5)
    def view_homepage(self):
        self.client.get("/")
    
    @task(3)
    def chat_message(self):
        self.client.post("/api/chat", json={
            "message": "Tell me about your most complex project",
            "session_id": self.session_id
        })
    
    @task(1)
    def github_activity(self):
        self.client.get("/api/github/activity")
    
    @task(1)
    def constellation_data(self):
        self.client.get("/api/knowledge-graph/constellation")
    
    @task(2)
    def view_project(self):
        self.client.get(f"/api/projects/{self.project_id}/preview")
```

---

## SECTION 48 — FINGERPRINTJS: FREE VISITOR IDENTITY

```typescript
// frontend/lib/fingerprint.ts
import FingerprintJS from "@fingerprintjs/fingerprintjs"; // Free OSS version

/**
 * WHAT FINGERPRINTJS PROVIDES (FREE OSS VERSION):
 * A stable visitor identifier that persists across:
 * - Browser restarts (survives clearing cookies)
 * - Incognito mode changes
 * - VPN changes (IP-independent)
 *
 * HOW IT WORKS:
 * Combines 40+ browser signals:
 * - Canvas fingerprint (GPU rendering signature)
 * - Audio fingerprint (sound processing signature)
 * - WebGL fingerprint (GPU model)
 * - Font rendering
 * - Screen resolution + color depth
 * - Timezone + language
 * - Browser plugins
 * → Produces a stable hash: same visitor = same hash, ~95% accuracy
 *
 * WHY THIS MATTERS FOR THE PORTFOLIO:
 * - Visitor returns in incognito? Still recognized.
 * - Cross-session memory: "Welcome back! Last time you asked about Kafka..."
 * - Return visit tracking: more accurate than cookies alone
 * - Bot detection: fingerprint patterns reveal bots (no canvas, no audio)
 *
 * PRIVACY:
 * - Fingerprint hash is anonymous (not linked to identity)
 * - Stored server-side as hashed value only
 * - No PII collected
 * - Disclosed in privacy policy
 */

export async function getVisitorFingerprint(): Promise<string> {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId; // Stable hash
}
```

---

## SECTION 49 — THE FINAL UNIFIED CONNECTION MAP

### COMPLETE SYSTEM WIRING (Every Component Connected)

This is the definitive map. Every service. Every data flow. Every connection.

```
═══════════════════════════════════════════════════════════════════════════════════
                        ANTIGRAVITY OS v3 — OMEGA BUILD
                     COMPLETE UNIFIED ARCHITECTURE MAP
═══════════════════════════════════════════════════════════════════════════════════

EXTERNAL WORLD
  └── Visitor Browser
  └── GitHub (Webhooks + API)
  └── Cloudflare (CDN + WAF + DDoS)

EDGE LAYER
  Cloudflare Free Tier
  ├── WAF (OWASP Top 10 rules)
  ├── DDoS protection (automatic)
  ├── CDN (static assets, 1hr page cache)
  └── → NGINX (origin)

LOAD BALANCER
  NGINX (2 replicas)
  ├── SSL termination
  ├── Sticky sessions (chat continuity)
  ├── Static file serving (/public/, /_next/static/)
  ├── Proxy /api/* → FastAPI cluster
  ├── Proxy /ws/* → FastAPI (WebSocket/SSE)
  └── Health check: GET /api/health every 10s

APPLICATION LAYER
  FastAPI (2 replicas, async, uvicorn workers=4)
  │
  ├── SECURITY PIPELINE (every request)
  │   ├── FingerprintJS visitor ID (from cookie/header)
  │   ├── BotDetector.assess() → bot? → static FAQ route
  │   ├── MultiLayerRateLimiter (IP + session + endpoint + token budget)
  │   ├── InputSanitizer (length, encoding, PII scrub)
  │   └── PromptInjectionShield.scan_user_message()
  │
  ├── VISITOR INTELLIGENCE
  │   ├── VisitorPersonaClassifier (signals → Outlines → guaranteed enum)
  │   ├── CompanyResolver (IP → MaxMind → company domain)
  │   ├── FingerprintJS session lookup → VisitorMemory (PostgreSQL T2)
  │   └── AmbientIntelligenceAgent (passive trigger detection)
  │
  ├── REQUEST ROUTING
  │   ├── Priority: HIGH (known company) → NORMAL → LOW → BACKGROUND
  │   ├── PriorityRequestQueue (Redis Streams)
  │   └── LoadShedding: depth>200 → static mode
  │
  ├── LANGGRAPH AGENT GRAPH
  │   ├── NODE: visitor_context_loader
  │   │   └── Reads: Redis T1 + PostgreSQL T2 + Owner Identity T0
  │   ├── NODE: intent_router
  │   │   ├── Mode: chat | interview_sim | code_walkthrough | brief_gen | build_with_me | debate
  │   │   └── Uses: StructuredOutputEngine (Outlines, guaranteed JSON)
  │   ├── NODE: retrieval_orchestrator
  │   │   ├── Stage 1: Qdrant dense search (top-50, persona-filtered)
  │   │   ├── Stage 2: ColBERTRetriever rerank (top-50 → top-8)
  │   │   ├── Stage 3: CrossEncoder rerank (top-8 → top-4, complex only)
  │   │   ├── KnowledgeGraph query (PostgreSQL graph tables)
  │   │   └── SemanticQueryCache check (Redis vector, cosine > 0.95 → hit)
  │   ├── NODE: live_context_fetcher
  │   │   ├── GitHub Events API (last 7 days, 60s Redis cache)
  │   │   └── WebResearchAgent (company research, 3/session limit)
  │   ├── NODE: llm_router
  │   │   ├── ComplexityEstimator (< 1ms, no LLM)
  │   │   ├── CircuitBreaker check (per service)
  │   │   ├── ModelRouter decision (3b/7b/haiku/sonnet)
  │   │   └── CostController check (daily budget gate)
  │   ├── NODE: generation
  │   │   ├── PromptCompressor (40-60% token reduction)
  │   │   ├── CriticalInfoVault (token replacement for sensitive fields)
  │   │   ├── DSPy-optimized prompts (weekly updated)
  │   │   └── LangFuse trace (full span visibility)
  │   ├── NODE: digital_twin_persona_engine
  │   │   └── Voice + opinion + authenticity layer
  │   ├── NODE: post_processing
  │   │   ├── RAG chunk injection scan (PromptInjectionShield)
  │   │   ├── ConversionSignalDetector
  │   │   ├── AmbientTriggerEvaluator
  │   │   └── SuggestedFollowUps generator
  │   └── NODE: output_stream
  │       └── SSE to browser (token-by-token streaming)
  │
  ├── SPECIAL AGENT MODES
  │   ├── InterviewSimAgent (Sonnet, first-person, STAR format)
  │   ├── CodeTraversalAgent (GitHub Contents API + syntax highlighting)
  │   ├── BuildWithMeAgent (Mermaid diagram generation, streaming)
  │   ├── DebateAgent (dual-instance, pro/con, synthesis)
  │   └── RecruiterBriefAgent (WeasyPrint → MinIO → presigned URL)
  │
  └── SSE MANAGER
      ├── Max 500 connections per replica
      ├── Keepalive ping every 60s
      └── Max lifetime: 5 minutes (then client reconnects)

DATA LAYER
  ┌─────────────────────────────────────────────────────────────┐
  │ Redis Stack (T0 + T1 cache + rate limits + queues)          │
  │ ├── T0: Owner Identity (permanent TTL)                      │
  │ ├── T1: Session working memory (session + 30min TTL)        │
  │ ├── Semantic query cache (vector similarity, 4hr TTL)       │
  │ ├── Rate limit counters (sliding window)                    │
  │ ├── Behavioral risk scores (per session)                    │
  │ ├── Priority request queue (Redis Streams)                  │
  │ ├── GitHub activity feed (60s TTL)                          │
  │ ├── Company context cache (24hr TTL)                        │
  │ └── FAQ static responses (12hr TTL, pre-generated)          │
  │                                                             │
  │ PostgreSQL 16 (Primary + 2 Read Replicas)                   │
  │ ├── conversations (T2 episodic memory)                      │
  │ ├── visitor_profiles (cross-session identity)               │
  │ ├── conversion_events (signals + scores)                    │
  │ ├── kg_entities + kg_relations (knowledge graph)            │
  │ ├── dspy_optimization_runs (prompt version history)         │
  │ ├── rag_eval_dataset (synthetic QA pairs)                   │
  │ ├── injection_attempts_log (security audit)                 │
  │ └── disclosure_log (critical info access log)               │
  │                                                             │
  │ Qdrant (3-node cluster, replication_factor=2)               │
  │ ├── Collection: portfolio_knowledge (768-dim, nomic)        │
  │ │   └── Metadata: persona_weights, freshness, impact_score  │
  │ ├── Collection: github_semantic (commit narratives)         │
  │ └── Collection: image_descriptions (vision pipeline output) │
  │                                                             │
  │ MinIO (self-hosted S3)                                      │
  │ ├── portfolio-briefs/ (PDF, 24hr expiry)                    │
  │ ├── portfolio-screenshots/ (public, cached)                 │
  │ ├── portfolio-analytics/ (Parquet exports, 90d retention)   │
  │ └── portfolio-backups/ (nightly DB dumps, 30d retention)    │
  │                                                             │
  │ DuckDB (embedded in analytics service)                      │
  │ └── Reads Parquet from MinIO → analytical queries           │
  └─────────────────────────────────────────────────────────────┘

INTELLIGENCE MAINTENANCE LAYER
  ┌─────────────────────────────────────────────────────────────┐
  │ Temporal.io (self-hosted, workflow orchestration)           │
  │ ├── GitHubRepositoryIngestionWorkflow (on webhook + manual) │
  │ ├── DSPyOptimizationWorkflow (weekly Sunday 1am)            │
  │ ├── WeeklyAnalyticsWorkflow (Sunday 2am)                    │
  │ └── OpportunityDiscoveryWorkflow (daily 6am)                │
  │                                                             │
  │ Celery Workers (simple periodic tasks)                      │
  │ ├── freshness_sweep (every 30min)                           │
  │ ├── github_activity_sync (every 60s, lightweight)           │
  │ ├── ragas_evaluation (daily 4am)                            │
  │ ├── brief_cleanup (daily, MinIO lifecycle)                  │
  │ └── nightly_digest_notification (daily 11pm → ntfy)         │
  └─────────────────────────────────────────────────────────────┘

OBSERVABILITY LAYER
  ┌─────────────────────────────────────────────────────────────┐
  │ LangFuse (self-hosted, port 3001)                           │
  │ └── LLM traces, spans, token costs, DSPy experiment tracking│
  │                                                             │
  │ SigNoz (self-hosted, all-in-one APM)                        │
  │ ├── Distributed traces (via OpenTelemetry)                  │
  │ ├── Infrastructure metrics (CPU, memory, disk per container)│
  │ ├── Application logs (structured, searchable)               │
  │ └── Alert rules (latency, error rate, circuit breaker state)│
  │                                                             │
  │ Prometheus + Grafana (metrics + dashboards)                 │
  │ └── 9 dashboards (visitor intel, KG freshness, conversion,  │
  │     digital twin quality, security, LLM cost, engagement,   │
  │     reliability, RAG quality)                               │
  │                                                             │
  │ Umami (self-hosted web analytics, port 3002)                │
  │ └── Privacy-respecting: page views, events, funnels         │
  └─────────────────────────────────────────────────────────────┘

FRONTEND
  Next.js 14 (App Router, SSR)
  ├── Service Worker (Workbox) → offline support + asset caching
  ├── Web Worker → browser-side embeddings (Transformers.js)
  ├── FingerprintJS OSS → stable visitor ID
  │
  ├── COMPONENTS
  │   ├── DynamicHeroSection (persona-adapted, SSR)
  │   ├── SkillConstellation (Three.js, 3D force graph)
  │   ├── LiveActivityFeed (GitHub webhooks → SSE → component)
  │   ├── ProjectTimeMachine (scrubable commit history)
  │   ├── ChatInterface (SSE streaming, persona-aware placeholder)
  │   ├── CodeWalkthroughMode (split panel, syntax highlight)
  │   ├── BuildWithMeMode (Mermaid live diagram)
  │   ├── CLIMode (terminal easter egg)
  │   ├── VoiceModeButton (ElevenLabs / browser TTS fallback)
  │   ├── AmbientNotificationOverlay (max 1/session)
  │   ├── StumpChallengeMode (gamified gap detection)
  │   ├── QuestionLeaderboard (community Q&A gallery)
  │   ├── LiveBuildWidget (current sprint + last commit)
  │   └── PersonaAdaptiveProjectCards (hover → generated preview)
  │
  └── PWA
      ├── Installable (manifest.json)
      ├── Offline mode (/offline page with static portfolio)
      └── Push notifications (via ntfy → browser push API)

ADMIN INTERFACE (127.0.0.1 only)
  ├── LangFuse UI: http://localhost:3001
  ├── Temporal Web UI: http://localhost:8088
  ├── Grafana: http://localhost:3000
  ├── SigNoz: http://localhost:3301
  ├── MinIO Console: http://localhost:9001
  ├── Umami: http://localhost:3002
  ├── ntfy: http://localhost:8081
  └── Custom admin: http://localhost:3003 (opportunities, proposals)
```

---

## SECTION 50 — COMPLETE STARTUP SEQUENCE

### THE ORDER EVERYTHING STARTS

This is the exact Docker Compose dependency chain. Nothing starts out of order.

```
STARTUP ORDER:

PHASE 1 — FOUNDATION (no dependencies):
  1. postgres (primary) ─── wait: pg_isready
  2. redis-stack        ─── wait: redis-cli ping
  3. qdrant-node-1      ─── wait: HTTP GET /healthz
  4. qdrant-node-2      ─── depends: qdrant-node-1
  5. qdrant-node-3      ─── depends: qdrant-node-2
  6. minio              ─── wait: minio health check
  7. temporal-server    ─── depends: postgres
  8. langfuse           ─── depends: postgres
  9. signoz             ─── depends: (internal clickhouse)
  10. umami             ─── depends: postgres
  11. ntfy              ─── (stateless, instant)

PHASE 2 — REPLICAS & PROXIES:
  12. postgres-replica-1 ─── depends: postgres (streaming replication)
  13. postgres-replica-2 ─── depends: postgres
  14. qdrant-load-balancer ── depends: all 3 qdrant nodes

PHASE 3 — APPLICATION SERVICES:
  15. ollama            ─── depends: (GPU/CPU available)
     └── pull models:  qwen2.5:7b, qwen2.5:3b, llava:7b, 
                        nomic-embed-text, mxbai-rerank-large
  16. backend-api-1     ─── depends: postgres, redis, qdrant, ollama
     └── runs: alembic upgrade head (database migrations)
  17. backend-api-2     ─── depends: backend-api-1 (migrations done)
  18. celery-worker-llm ─── depends: backend-api-1, redis
  19. celery-worker-ingestion ─ depends: backend-api-1, qdrant, ollama
  20. celery-worker-kg  ─── depends: backend-api-1, postgres
  21. celery-beat       ─── depends: redis (schedule coordinator)
  22. temporal-worker   ─── depends: temporal-server, backend-api-1
  23. github-webhook-receiver ── depends: redis
  24. security-monitor  ─── depends: redis, backend-api-1

PHASE 4 — INTELLIGENCE BOOTSTRAP:
  25. knowledge-bootstrap ─── one-shot container
     └── IF first_run:
         ├── Run full GitHub ingestion for all repos
         ├── Build knowledge graph from scratch
         ├── Generate initial Ragas evaluation dataset
         ├── Pre-generate top-50 FAQ static responses
         ├── Pre-compute all 6 persona × top-3 project preview combinations
         └── Seed owner identity T0 cache

PHASE 5 — FRONTEND & ROUTING:
  26. frontend (Next.js) ─── depends: backend-api-1
  27. nginx              ─── depends: frontend, backend-api-1, backend-api-2

PHASE 6 — VERIFICATION:
  28. health-check-suite ─── one-shot, runs after all above
     └── Verifies: all circuit breakers CLOSED
         Verifies: Qdrant collection exists + has documents
         Verifies: Redis T0 populated (owner identity)
         Verifies: At least 1 Ollama model responding
         Verifies: PostgreSQL has schema applied
         Sends:    ntfy notification "ANTIGRAVITY OS v3 started ✓"
```

---

## SECTION 51 — DATA FLOW FOR EVERY CRITICAL PATH

### PATH A: NEW VISITOR FIRST MESSAGE (HAPPY PATH)

```
T+0ms:    Browser sends POST /api/chat {"message": "Tell me about your ML work"}
T+1ms:    NGINX → FastAPI replica 1
T+2ms:    FingerprintJS ID extracted from header
T+3ms:    BotDetector.assess() → human (0.05 bot confidence)
T+4ms:    RateLimiter checks: IP=OK, session=OK, endpoint=OK, budget=OK
T+5ms:    InputSanitizer → clean
T+6ms:    InjectionShield.scan() → clean
T+7ms:    VisitorPersonaClassifier → SENIOR_ENGINEER (confidence: 0.78)
T+10ms:   CompanyResolver (IP → reverse DNS) → stripe.com (PRIORITY 4)
T+12ms:   PriorityQueue.enqueue(priority=4) → job_id returned to client
T+13ms:   SSE connection opened: GET /api/chat/stream/{job_id}
T+15ms:   LLM Worker picks up job (queue depth: 0)
T+20ms:   SemanticCache check: embed query (8ms) → cache miss
T+35ms:   ColBERTRetriever Stage 1: Qdrant search → top-50 chunks
T+55ms:   ColBERTRetriever Stage 2: rerank → top-8 chunks
T+60ms:   KnowledgeGraph query: "ML" entities → 3 project relations
T+62ms:   CompanyContextInjector: Stripe → pre-loaded context (Kafka, Go, TypeScript)
T+65ms:   ModelRouter: complexity=0.65 → qwen2.5:7b (local, free)
T+67ms:   PromptCompressor: 3,200 tokens → 1,847 tokens
T+70ms:   DSPy-optimized system prompt assembled
T+72ms:   LangFuse trace span opened
T+75ms:   LLM generation begins (qwen2.5:7b via Ollama)
T+600ms:  First token arrives → SSE stream begins to browser
T+2800ms: Last token arrives → stream ends
T+2802ms: ConversionSignalDetector runs
T+2805ms: AmbientTrigger: Stripe detected → queue ambient card for frontend
T+2808ms: SemanticCache: store this response (key: query embedding)
T+2810ms: LangFuse trace closed (full span logged)
T+2815ms: Umami event logged: "chat_message" {persona: "senior_engineer"}

TOTAL TIME TO FIRST TOKEN: 600ms ✓ (target: < 800ms)
TOTAL RESPONSE TIME: 2,815ms ✓ (target p99: < 4s)
LLM COST: $0.00 (local model)
```

### PATH B: RAGAS QUALITY EVALUATION (NIGHTLY, 4AM)

```
T+0:    Celery Beat triggers ragas_evaluation task
T+1s:   Load synthetic eval dataset from PostgreSQL (150 QA pairs)
T+2s:   For each QA pair:
          → Full RAG pipeline (same as PATH A, no SSE output)
          → Store: question, retrieved_chunks, generated_answer, gold_answer
T+8min: All 150 evaluations complete
T+8min: Ragas.evaluate() → faithfulness=0.87, context_precision=0.79
T+8.5m: Store results in DuckDB
T+8.6m: Grafana dashboard auto-refreshes (Prometheus scrapes DuckDB exporter)
T+8.7m: Check thresholds:
         faithfulness=0.87 > 0.80 ✓
         context_precision=0.79 > 0.75 ✓
         All thresholds met → no alert
T+8.8m: Task complete, log to LangFuse (experiment: "ragas_daily_eval")
```

### PATH C: DSPY OPTIMIZATION (SUNDAY 1AM)

```
T+0:    Temporal DSPyOptimizationWorkflow triggered
T+1s:   Load last 7 days of conversations from PostgreSQL: 847 conversations
T+5s:   Label conversations: 127 HIGH, 342 MEDIUM, 378 LOW
T+10s:  Build DSPy trainset (427 examples) + holdout (100 examples)
T+15s:  MIPROv2 optimizer starts (15 candidates × 25 trials)
T+45min: Optimization complete
         Baseline engagement score: 4.23
         New score: 4.81
         Improvement: 13.7% → DEPLOY
T+46min: New prompts written to PostgreSQL (prompt_versions table)
T+47min: backend-api-1 and backend-api-2 reload prompt config (hot reload)
T+47.5m: ntfy notification: "Prompts optimized: +13.7% engagement. Deployed."
T+48min: LangFuse experiment logged with before/after scores
```

### PATH D: GITHUB PUSH WEBHOOK → KNOWLEDGE UPDATE

```
T+0:    Developer pushes commit to GitHub repo
T+1s:   GitHub sends webhook to github-webhook-receiver (port 8001)
T+1.5s: HMAC signature verified
T+2s:   Event published to Redis Stream: "github:events"
T+3s:   Temporal GitHubRepositoryIngestionWorkflow triggered (this repo only)
T+5s:   Changed files detected: ["backend/rag/retriever.py", "README.md"]
T+6s:   README.md → high priority re-ingest
T+8s:   backend/rag/retriever.py → AST-level analysis of changed functions
T+15s:  Commit narrative generated: "Aman improved RAG retrieval to use ColBERT..."
T+20s:  New chunks embedded (nomic-embed-text, local)
T+25s:  Qdrant upsert: 3 new chunks, 2 updated chunks
T+28s:  SemanticDriftDetector: old chunk cosine=0.71 < 0.92 → DRIFT → re-ingest
T+35s:  KnowledgeGraph: update "retrieval" entity properties
T+40s:  LangFuse: log ingestion event
T+42s:  ntfy: LOW priority "GitHub sync: antigravity-portfolio updated (5 chunks)"
T+43s:  LiveActivityFeed: Redis pub/sub → SSE → all connected browser tabs update
```

---

## SECTION 52 — THE MASTER EXECUTION PROMPT

This is the single prompt that an LLM coding agent (Claude Code, GPT-4o, Gemini) should receive to build this entire system from scratch. Feed it this prompt and your system design documents as context.

```
═══════════════════════════════════════════════════════════════════════════════════
MASTER EXECUTION PROMPT — ANTIGRAVITY OS v3 OMEGA BUILD
═══════════════════════════════════════════════════════════════════════════════════

You are building ANTIGRAVITY OS v3 — a production-grade, agentic portfolio system.
You have three system design documents as context:
  [1] MASTER_SYSTEM_DESIGN_PROMPT.md     (Sections 1–21, original architecture)
  [2] ANTIGRAVITY_OS_V2_EXTENSION.md     (Sections 22–33, reliability + security + engagement)
  [3] ANTIGRAVITY_OS_V3_FINAL_UNIFIED.md (Sections 34–52, free tools + unified map)

EXECUTION PHILOSOPHY:
─────────────────────
- Build in the exact dependency order from Section 50 (startup sequence)
- Every file you create: production quality, typed, documented, tested
- Every external call: wrapped in a circuit breaker
- Every LLM call: traced in LangFuse with full span
- Every sensitive field: through CriticalInfoVault, never raw in prompts
- Every output from local LLMs: through Outlines for schema validation
- Every RAG retrieval: ColBERT two-stage minimum; cross-encoder for complex queries
- Never hard-code secrets: all config via environment variables + .env
- Test everything: pytest for backend, Playwright for E2E, Locust for load

PROJECT STRUCTURE:
─────────────────
antigravity-os/
├── backend/
│   ├── agents/               # LangGraph nodes + special agents
│   │   ├── graph.py          # Main LangGraph StateGraph definition
│   │   ├── state.py          # AgentState TypedDict (full, from Section 12.1)
│   │   ├── digital_twin_engine.py
│   │   ├── ambient_intelligence.py
│   │   ├── code_traversal_agent.py
│   │   ├── interview_sim_agent.py
│   │   ├── web_research_agent.py
│   │   ├── portfolio_update_agent.py
│   │   ├── debate_agent.py
│   │   ├── opportunity_agent.py
│   │   └── landing_page_agent.py
│   ├── rag/
│   │   ├── colbert_retriever.py      # RAGatouille + cross-encoder
│   │   ├── multimodal_ingestor.py   # LLaVA pipeline
│   │   ├── self_healing.py          # Freshness + semantic drift
│   │   └── token_budget.py          # Adaptive budget
│   ├── intelligence/
│   │   ├── visitor_classifier.py    # Outlines-powered, guaranteed enum
│   │   ├── company_resolver.py
│   │   ├── github_semantic_analyzer.py
│   │   ├── github_event_processor.py
│   │   └── conversion_optimizer.py
│   ├── security/
│   │   ├── critical_info_vault.py   # Encrypted, token-based
│   │   ├── injection_shield.py      # User + RAG chunk scanning
│   │   ├── behavioral_monitor.py    # Risk scoring
│   │   ├── rate_limiter.py          # 4-layer
│   │   ├── bot_detector.py
│   │   └── input_sanitizer.py
│   ├── reliability/
│   │   ├── circuit_breaker.py
│   │   ├── health_orchestrator.py
│   │   ├── request_queue.py
│   │   └── self_healing_scheduler.py
│   ├── llm/
│   │   ├── model_router.py          # Complexity-based routing
│   │   ├── cost_controller.py       # Daily budget enforcement
│   │   ├── prompt_compressor.py
│   │   └── structured_output.py     # Outlines wrapper
│   ├── knowledge_graph/
│   │   ├── entities.py
│   │   ├── relations.py
│   │   ├── graph_queries.py
│   │   └── graph_builder.py
│   ├── optimization/
│   │   ├── dspy_optimizer.py        # Weekly prompt self-optimization
│   │   └── evaluation_dataset.py   # Synthetic QA generation
│   ├── evaluation/
│   │   └── ragas_evaluator.py       # Daily RAG quality monitoring
│   ├── analytics/
│   │   └── duckdb_engine.py         # Columnar analytics
│   ├── storage/
│   │   └── minio_client.py          # Self-hosted S3
│   ├── notifications/
│   │   └── ntfy_client.py           # Push notifications
│   ├── observability/
│   │   └── langfuse_tracer.py       # LLM tracing
│   ├── cache/
│   │   ├── semantic_cache.py
│   │   └── owner_identity_cache.py
│   ├── brief/
│   │   ├── generator.py
│   │   ├── personalizer.py
│   │   └── templates/
│   ├── db/
│   │   ├── init_schema.sql
│   │   ├── resilient_pool.py
│   │   └── migrations/
│   ├── workflows/
│   │   ├── github_ingest_workflow.py   # Temporal workflow
│   │   ├── dspy_optimization_workflow.py
│   │   └── analytics_workflow.py
│   ├── api/
│   │   ├── chat.py               # SSE streaming endpoint
│   │   ├── health.py             # /api/health (HealthOrchestrator)
│   │   ├── brief.py              # PDF generation endpoint
│   │   ├── github.py             # Activity feed, tree API
│   │   ├── constellation.py      # KG graph data for Three.js
│   │   ├── projects.py           # Project preview generation
│   │   └── admin.py              # Private admin endpoints
│   └── main.py                   # FastAPI app + lifespan handlers
│
├── frontend/
│   ├── app/                      # Next.js 14 App Router
│   ├── components/               # All UI components from Section 26
│   ├── hooks/                    # usePersonaAdaptation, useVoiceMode, usePWA
│   ├── workers/                  # embedding.worker.ts (Transformers.js)
│   └── public/
│       └── sw.js                 # Service Worker (Workbox)
│
├── tests/
│   ├── unit/                     # pytest: pure function tests
│   ├── integration/              # pytest: DB + queue + vector store
│   ├── security/                 # pytest: injection shield, rate limiter
│   ├── e2e/                      # Playwright: full browser flows
│   └── load/
│       └── locustfile.py         # Locust: load testing
│
├── data/
│   ├── owner/                    # Bio, philosophy, opinions, resume
│   ├── projects/                 # Per-project deep descriptions
│   ├── persona/                  # Writing corpus, interview stories
│   ├── security/                 # Encrypted vault files
│   └── voice/                    # Audio samples for ElevenLabs
│
├── docker/
│   ├── docker-compose.yml        # Full production stack (33+ services)
│   ├── docker-compose.dev.yml    # Local development override
│   └── docker-compose.test.yml  # CI/CD test environment
│
├── .github/
│   └── workflows/
│       └── production.yml        # CI/CD pipeline (Section 47)
│
├── .env.example                  # All required environment variables
├── pyproject.toml                # Python project config + deps
├── requirements.txt              # Pinned production deps
└── README.md                     # Setup + architecture overview

EXECUTION ORDER:
────────────────
STEP 1:  docker-compose infrastructure (Phase 1 + 2 of startup sequence)
STEP 2:  PostgreSQL schema (init_schema.sql) + Alembic migrations
STEP 3:  Redis Stack configuration (vector index creation)
STEP 4:  Qdrant collections creation (portfolio_knowledge, github_semantic, image_descriptions)
STEP 5:  MinIO buckets + lifecycle policies
STEP 6:  Security layer (vault, shield, rate limiter, bot detector)
STEP 7:  Reliability layer (circuit breakers, health orchestrator, request queue)
STEP 8:  Ollama model pull + warm-up (all 5 models)
STEP 9:  Outlines + structured output engine
STEP 10: RAG pipeline (Qdrant + ColBERT + cross-encoder)
STEP 11: Knowledge graph layer (entities + relations + builder)
STEP 12: GitHub semantic analyzer + webhook receiver
STEP 13: LangGraph agent graph (full StateGraph from Section 12.2)
STEP 14: Digital twin persona engine + all special agents
STEP 15: Memory system (T0 owner identity cache + T2 PostgreSQL)
STEP 16: LLM router + cost controller + prompt compressor
STEP 17: DSPy optimizer scaffold (runs but no data yet)
STEP 18: Ragas evaluator + synthetic QA generation
STEP 19: LangFuse tracer integration (wrap all LLM calls)
STEP 20: DuckDB analytics engine + Parquet ETL
STEP 21: Temporal workflows (ingestion + DSPy + analytics)
STEP 22: ntfy client + notification triggers
STEP 23: Recruiter brief generator (WeasyPrint + MinIO)
STEP 24: FastAPI app assembly (all routers + security middleware)
STEP 25: Initial data ingestion (all repos + /data/ files)
STEP 26: Frontend: Next.js + all components + Service Worker + Web Worker
STEP 27: Umami analytics integration
STEP 28: NGINX configuration (SSL + proxy + sticky sessions)
STEP 29: GitHub Actions CI/CD pipeline
STEP 30: Full system health check + ntfy "READY" notification

QUALITY GATES (must pass before "DONE"):
────────────────────────────────────────
□ pytest: all tests pass (unit + integration + security)
□ Playwright: all E2E flows pass (chat, brief, walkthrough, CLI, voice)
□ Locust: p99 < 4s at 50 concurrent users
□ Ragas: faithfulness > 0.80, context_precision > 0.75
□ Circuit breakers: all CLOSED at system start
□ Security: injection shield blocks all 20 attack patterns in test suite
□ Cost: model router sends > 80% of test queries to local models
□ LangFuse: all LLM calls appearing with full spans
□ ntfy: "ANTIGRAVITY OS v3 READY" notification received on owner device

═══════════════════════════════════════════════════════════════════════════════════
END OF MASTER EXECUTION PROMPT
You now have everything. Every component named. Every wire drawn. Every tool chosen.
The system is designed to run forever, improve automatically, and never break.
Build it.
═══════════════════════════════════════════════════════════════════════════════════
```

---

## SECTION 53 — COMPLETE ENVIRONMENT VARIABLES REFERENCE

```bash
# .env.example — complete variable reference

# ─── CORE SECRETS ──────────────────────────────────────────────────────────────
SECRET_KEY=                          # FastAPI session signing key (32 bytes, random)
VAULT_ENCRYPTION_KEY=                # Fernet key for CriticalInfoVault (32 bytes)

# ─── POSTGRESQL ────────────────────────────────────────────────────────────────
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=antigravity
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_REPLICA_1_HOST=postgres-replica-1
POSTGRES_REPLICA_2_HOST=postgres-replica-2

# ─── REDIS ─────────────────────────────────────────────────────────────────────
REDIS_URL=redis://redis-stack:6379
REDIS_MAX_CONNECTIONS=50

# ─── QDRANT ────────────────────────────────────────────────────────────────────
QDRANT_HOST=qdrant-lb
QDRANT_PORT=6333
QDRANT_COLLECTION_KNOWLEDGE=portfolio_knowledge
QDRANT_COLLECTION_GITHUB=github_semantic
QDRANT_COLLECTION_IMAGES=image_descriptions

# ─── OLLAMA ────────────────────────────────────────────────────────────────────
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_PRIMARY_MODEL=qwen2.5:7b
OLLAMA_LIGHT_MODEL=qwen2.5:3b
OLLAMA_VISION_MODEL=llava:7b
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_RERANK_MODEL=mxbai-rerank-large

# ─── LLM API FALLBACKS ─────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=                   # Optional fallback
ANTHROPIC_HAIKU_MODEL=claude-haiku-4-5
ANTHROPIC_SONNET_MODEL=claude-sonnet-4-6

# ─── COST CONTROL ──────────────────────────────────────────────────────────────
DAILY_LLM_BUDGET_USD=5.00
DAILY_HAIKU_TOKEN_LIMIT=5000000
DAILY_SONNET_TOKEN_LIMIT=200000

# ─── GITHUB ────────────────────────────────────────────────────────────────────
GITHUB_TOKEN=                        # Personal access token (read:repo)
GITHUB_USERNAME=
GITHUB_WEBHOOK_SECRET=               # HMAC secret for webhook validation

# ─── MINIO (SELF-HOSTED S3) ────────────────────────────────────────────────────
MINIO_ENDPOINT=http://minio:9000
MINIO_ROOT_USER=
MINIO_ROOT_PASSWORD=
MINIO_BUCKET_BRIEFS=portfolio-briefs
MINIO_BUCKET_SCREENSHOTS=portfolio-screenshots
MINIO_BUCKET_ANALYTICS=portfolio-analytics
MINIO_BUCKET_BACKUPS=portfolio-backups

# ─── LANGFUSE (SELF-HOSTED) ────────────────────────────────────────────────────
LANGFUSE_HOST=http://langfuse:3001
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=

# ─── TEMPORAL ──────────────────────────────────────────────────────────────────
TEMPORAL_HOST=temporal:7233
TEMPORAL_NAMESPACE=antigravity-production

# ─── NTFY (SELF-HOSTED PUSH) ───────────────────────────────────────────────────
NTFY_BASE_URL=http://ntfy:80
NTFY_TOPIC=portfolio-alerts
NTFY_AUTH_TOKEN=                     # Optional: auth for private topics

# ─── UMAMI (SELF-HOSTED ANALYTICS) ────────────────────────────────────────────
UMAMI_APP_SECRET=
UMAMI_DATABASE_URL=                  # Uses same PostgreSQL

# ─── ELEVENLABS (OPTIONAL: VOICE) ──────────────────────────────────────────────
ELEVENLABS_API_KEY=                  # Optional: voice cloning
ELEVENLABS_VOICE_ID=                 # Owner's cloned voice ID
ELEVENLABS_DAILY_CHAR_BUDGET=50000

# ─── SECURITY ──────────────────────────────────────────────────────────────────
IP_RATE_LIMIT_PER_MINUTE=60
SESSION_RATE_LIMIT_PER_10MIN=20
BRIEF_RATE_LIMIT_PER_HOUR=3
BOT_CONFIDENCE_THRESHOLD=0.90
SECURITY_RISK_BAN_THRESHOLD=100
MAX_MESSAGE_LENGTH=2000

# ─── OWNER IDENTITY (TIER 0 CACHE SEED) ───────────────────────────────────────
OWNER_NAME=Aman
OWNER_TITLE=Software Engineer & AI Builder
OWNER_CURRENT_STATUS=
OWNER_AVAILABILITY=
OWNER_PUBLIC_EMAIL=

# ─── GEOLOCATION ───────────────────────────────────────────────────────────────
MAXMIND_LICENSE_KEY=                 # Free GeoLite2 license
MAXMIND_DB_PATH=/data/GeoLite2-City.mmdb

# ─── SEARCH (OPTIONAL: WEB RESEARCH AGENT) ────────────────────────────────────
SERPAPI_KEY=                         # Optional: $0.01/search, 100 free/month
DUCKDUCKGO_FALLBACK=true             # Use DDG if SerpAPI not configured

# ─── DSPY ──────────────────────────────────────────────────────────────────────
DSPY_OPTIMIZATION_IMPROVEMENT_THRESHOLD=0.05
DSPY_NUM_CANDIDATES=15
DSPY_NUM_TRIALS=25

# ─── RAGAS ─────────────────────────────────────────────────────────────────────
RAGAS_FAITHFULNESS_THRESHOLD=0.80
RAGAS_CONTEXT_PRECISION_THRESHOLD=0.75
RAGAS_EVAL_DATASET_SIZE=150

# ─── FEATURE FLAGS ─────────────────────────────────────────────────────────────
FEATURE_VOICE_MODE=true
FEATURE_CLI_EASTER_EGG=true
FEATURE_STUMP_MODE=true
FEATURE_BUILD_WITH_ME=true
FEATURE_DEBATE_MODE=true
FEATURE_OPPORTUNITY_AGENT=true
FEATURE_QUESTION_LEADERBOARD=true
FEATURE_TIME_MACHINE=true
FEATURE_3D_CONSTELLATION=true
FEATURE_PWA=true
FEATURE_WEB_WORKER_EMBEDDINGS=true
```

---

## FINAL SUMMARY: THE COMPLETE SYSTEM AT A GLANCE

```
ANTIGRAVITY OS v3 — OMEGA BUILD
Total Sections: 53
Total Docker Services: 37
Total Python Modules: 48
Total Frontend Components: 18
Free % of infrastructure: 100%
Monthly external API cost: ~$0–5 (only if Sonnet/ElevenLabs are used)

WHAT VISITORS EXPERIENCE:
  - A website that knows who they are before they say a word
  - An AI that speaks in Aman's actual voice (literally, with ElevenLabs)
  - A 3D explorable universe of skills and projects
  - The ability to watch any project evolve through time
  - A working terminal that responds to Unix commands
  - The ability to co-design systems and see live diagrams appear
  - A challenge to stump the AI (and contribute to improving it)
  - A portfolio that works even when offline

WHAT AMAN EXPERIENCES:
  - Real-time push notifications when Google/Stripe/OpenAI visits
  - Weekly automated prompt optimization with measurable improvement
  - Daily RAG quality report (faithfulness, precision, recall)
  - A portfolio that ingests new GitHub commits in < 45 seconds
  - A private opportunity feed that finds jobs matching his preferences
  - A system that proposes its own improvements via GitHub PRs
  - Zero-downtime operation with automatic failover
  - Full LLM trace visibility in LangFuse

WHAT THE SYSTEM IS:
  Not a portfolio. Not a chatbot. Not a demo.
  A living intelligence that advocates for its owner
  24 hours a day, 7 days a week, to every visitor on earth —
  and gets measurably smarter every single week it runs.
```

---

*End of ANTIGRAVITY OS v3 — OMEGA BUILD*
*Sections 1–53 across three documents constitute the complete, final, executable system design.*
*There is nothing left to design. Everything is named, wired, and sequenced.*
*The only thing left is to build it.*

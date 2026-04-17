/**
 * RAG 2.0 — Comprehensive Knowledge Seed
 *
 * Seeds the Knowledge table with 15+ structured entries across 5 layers:
 * 1. Identity Layer (Aman's profile, education, social links, philosophy)
 * 2. Project Layer (Major projects with architecture details)
 * 3. System Architecture Layer (RAG, memory, swarm, reward)
 * 4. Governance Layer (Principles, safety constraints)
 * 5. SaaS / Research Layer (Platform capabilities, hypotheses)
 *
 * Usage: npx tsx scripts/seedKnowledge.ts
 */

import { createEmbedding } from "../lib/embeddings";
import prisma from "../lib/prisma";

interface KnowledgeEntry {
    category: string;
    title: string;
    content: string;
    importance: number;
    sourceType?: string;
}

const KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
    // ═══════════════════════════════════════════════
    // 1️⃣ IDENTITY LAYER
    // ═══════════════════════════════════════════════
    {
        category: "identity",
        title: "Aman Bhaskar — Profile & Education",
        content: `Name: Aman Bhaskar
Role: AI Systems Engineer & Full-Stack Architect
10th: UP Board (2021)
12th: UP Board (2023)
B.Tech CSE: AKTU University (2025-2029)
Specialization: Agentic AI, LLM Engineering, Cognitive Architectures
Core Skills: React, Next.js, TypeScript, FastAPI, Python, LangChain, LangGraph, AutoGen, CrewAI, Docker, AWS, Linux, PostgreSQL, pgvector, Prisma
Focus Areas: Autonomous multi-agent systems, reinforcement-driven AI, cognitive architectures, production RAG pipelines
Philosophy: Intelligence over static code — building systems that think, learn, and evolve.`,
        importance: 1.0,
        sourceType: "manual",
    },
    {
        category: "identity",
        title: "Social Links & Contact",
        content: `Aman Bhaskar's official social profiles and contact links:
LinkedIn: https://www.linkedin.com/in/aman-bhaskar-18jan2005/
GitHub: https://github.com/aman-bhaskar-codes
X (Twitter): https://x.com/_aman_bhaskar
Instagram: https://www.instagram.com/mr.aman.bhaskar/?hl=en
Email: amanbhaskarcodes@gmail.com
Portfolio: This website — an advanced AI-powered portfolio platform.`,
        importance: 0.9,
        sourceType: "manual",
    },
    {
        category: "identity",
        title: "Design Philosophy & Vision",
        content: `Aman's engineering philosophy centers on building production-grade AI systems, not prototypes.
Key Principles:
- Intelligence over static code: Systems should reason, adapt, and self-improve.
- Cognitive architecture first: Every component serves the reasoning pipeline.
- Production discipline: No shortcuts — hardened, observable, governance-aligned.
- Unified model strategy: One model (Qwen 2.5:3B), optimized deeply, rather than model sprawl.
- Memory as intelligence: Short-term + long-term + semantic memory makes AI contextually aware.
- Governance as foundation: AI must operate within ethical and architectural constraints.
Vision: Build autonomous AI systems that operate with human-level contextual awareness and architectural discipline.`,
        importance: 0.9,
        sourceType: "manual",
    },

    // ═══════════════════════════════════════════════
    // 2️⃣ PROJECT LAYER
    // ═══════════════════════════════════════════════
    {
        category: "project",
        title: "AI Portfolio Platform (This Website)",
        content: `This portfolio website is itself an advanced AI system, not a static site.
Architecture: Next.js 14 App Router + Prisma + PostgreSQL + pgvector + Ollama (Qwen 2.5:3B)
Features:
- RAG-powered conversational AI with 9-stage self-healing pipeline
- Digital Twin with agentic reasoning and swarm coordination
- 3-tier memory: short-term (session), long-term (semantic), episodic
- Real-time GitHub integration and live activity sync
- Research Lab with hypothesis generation and experiment tracking
- Governance engine with drift monitoring and safety constraints
- Universe visualization (3D) of cognitive system state
- SaaS multi-tenant architecture
- Reward-based reinforcement learning for response quality
Tech Stack: TypeScript, React, Three.js, Framer Motion, Prisma, pgvector, Ollama`,
        importance: 1.0,
        sourceType: "manual",
    },
    {
        category: "project",
        title: "RepoMind — Autonomous AI Dev Platform",
        content: `RepoMind is a multi-module autonomous development system.
Description: An AI-powered platform that analyzes, understands, and enhances codebases autonomously.
Features: Swarm cognition, reinforcement learning, RAG retrieval, governance constraints, tool autonomy.
Tech Stack: Next.js, FastAPI, PostgreSQL, pgvector, Ollama (Qwen2.5:3b), Docker.
Architecture: Multi-layer memory, distributed reasoning, autonomous goal pursuit.
AI Insight: Advanced agentic architecture demonstrating production-grade autonomous AI systems with self-healing capabilities.`,
        importance: 0.8,
        sourceType: "manual",
    },
    {
        category: "project",
        title: "ForgeAI — Multi-Agent Engineering System",
        content: `ForgeAI is a production-grade autonomous engineering ecosystem.
Components: Architect Agent, Backend Agent, QA Agent, Patcher Agent
Pipeline: Prompt → Plan → Generate → Execute → Patch → Commit
Infrastructure: Docker sandboxing, Redis event bus, PostgreSQL state, Qdrant vector memory
Features: DAG-based task execution, agent coordination, tool permissions, dynamic agent registry
Technology: Python, FastAPI, Docker, Redis, Neo4j, PostgreSQL, Qdrant`,
        importance: 0.8,
        sourceType: "manual",
    },

    // ═══════════════════════════════════════════════
    // 3️⃣ SYSTEM ARCHITECTURE LAYER
    // ═══════════════════════════════════════════════
    {
        category: "system",
        title: "RAG Pipeline Architecture",
        content: `The RAG (Retrieval-Augmented Generation) pipeline is a 9-stage self-healing system:
1. Intent Detection — zero-LLM-cost classification into identity/project/system/governance/saas/research/github/memory/general
2. Memory Shortcut — bypasses embedding for memory-intent queries
3. Query Embedding — cached with LRU (200 entries, 10min TTL)
4. Parallel 3-Way Retrieval — Knowledge + ProjectKnowledge + EpisodicMemory searched simultaneously
5. Weak Match Detection + Query Refinement Retry (2s timeout)
6. Intelligent Fallback Routing — GitHub live, direct memory, or static overview
7. Context Compression — token-budgeted (2500 chars, 4 chunks max)
8. GitHub Live Injection — for github-intent queries
9. Structured Result with confidence scoring
Caching: Pipeline-level Map cache (5min TTL) + LRU embedding cache + RAG service LRU cache
Model: All inference uses Qwen 2.5:3B via Ollama with keep_alive=5m`,
        importance: 0.9,
        sourceType: "manual",
    },
    {
        category: "system",
        title: "Memory Architecture",
        content: `The system uses a 3-tier memory architecture:
Layer 1 — Short-Term Memory: Last 4 session messages for conversational context.
Layer 2 — Long-Term Semantic Memory: Important user information promoted via importance detection (score > 6). Vector-searchable with pgvector (similarity > 0.4).
Layer 3 — Episodic Memory: Rich contextual memories with emotional tone, importance weighting, and cluster membership.
Memory Promotion: Automatic — messages containing preferences, facts, or interests are embedded and stored.
Memory Merge: Short-term + long-term retrieved in parallel via Promise.all and injected into prompts.
Memory Compression: Older conversation turns are summarized to reduce context size.
Importance Patterns: Detects "I prefer", "my name is", "I work in", "remember this" etc.`,
        importance: 0.85,
        sourceType: "manual",
    },
    {
        category: "system",
        title: "Swarm & Reward System",
        content: `The Digital Twin operates within a swarm reasoning framework:
Swarm Coordination: Multiple cognitive agents collaborate — planner, executor, evaluator, reflector.
Reward Logic: Every response is scored (0.0-1.0) by a self-evaluation agent (EVAL tier, 80 tokens max).
Reward Signals: Score, flag (strong/acceptable/weak), stored in analytics.
Drift Monitoring: Hallucination rate tracked via evalScore + ragConfidence thresholds.
Safety Score: 1 - (hallucinationRate * 3), clamped to [0, 1].
Autonomy Modes: Controlled escalation — the system increases autonomy only when reward stability is confirmed.
Cognitive Loop: Plan → Execute → Reflect → Reward → Adjust → Repeat`,
        importance: 0.8,
        sourceType: "manual",
    },

    // ═══════════════════════════════════════════════
    // 4️⃣ GOVERNANCE LAYER
    // ═══════════════════════════════════════════════
    {
        category: "governance",
        title: "AI Governance Principles",
        content: `The AI system operates under strict governance constraints:
1. Safety First: No response may violate safety thresholds. If hallucination rate exceeds limits, temperature is auto-reduced.
2. Anti-Hallucination: Low-confidence retrievals trigger strict mode — only answer from context, no fabrication.
3. Identity Integrity: The system never misrepresents Aman's credentials, projects, or capabilities.
4. Governance Blocking: If system health degrades critically, the governance engine can block responses entirely (503).
5. Temperature Override: Governance can force lower temperature during high-drift periods.
6. Transparency: The system acknowledges when it lacks information rather than guessing.
7. Alignment: All cognitive operations run within governance-defined boundaries.
8. Observability: Every interaction is logged with latency, confidence, model, intent, and eval metrics.`,
        importance: 0.85,
        sourceType: "manual",
    },
    {
        category: "governance",
        title: "Safety & Constraint Architecture",
        content: `Safety mechanisms in the cognitive engine:
- Rate Limiting: IP-based rate limiter (5 requests/15 seconds) prevents abuse.
- Input Validation: Zod schema validation on all API inputs.
- Token Limits: FAST=300, DEEP=400, EVAL=80 tokens max to prevent runaway generation.
- Context Window: 4096 tokens max, with strict context compression.
- Timeout Guards: 20s (FAST), 30s (DEEP), 10s (EVAL) with AbortSignal.
- Output Discipline: Never expose internal reasoning steps or chain-of-thought.
- Memory Safety: Only high-importance interactions (score >= 6) are promoted to long-term storage.`,
        importance: 0.75,
        sourceType: "manual",
    },

    // ═══════════════════════════════════════════════
    // 5️⃣ SAAS + RESEARCH LAYER
    // ═══════════════════════════════════════════════
    {
        category: "saas",
        title: "SaaS Platform Capabilities",
        content: `The portfolio includes a multi-tenant SaaS platform architecture:
Features: Tenant isolation, usage tracking, billing integration, API key management
Architecture: PostgreSQL-backed tenant system with row-level isolation
Tenant Model: Each tenant has name, domain, tier (free/pro/enterprise), API keys, and usage quotas
Usage Tracking: Request counts, token usage, storage metrics per tenant
API: RESTful endpoints for tenant management, usage analytics, and configuration
Scalability: Designed for horizontal scaling with connection pooling`,
        importance: 0.7,
        sourceType: "manual",
    },
    {
        category: "research",
        title: "Research Lab Capabilities",
        content: `The Research Lab enables automated AI research workflows:
Features: Hypothesis generation, experiment design, performance analysis, gap detection
Research Engine: Uses structured JSON output for measurable, reproducible experiments
Hypotheses: Auto-generated based on system performance data and identified gaps
Experiments: Tracked with status (active/completed/failed), metrics, and confidence intervals
Research Agenda: Prioritized list of investigation areas ranked by impact
Publications: Research findings can be published as structured reports
Integration: Research insights feed back into system optimization via the cognitive loop`,
        importance: 0.7,
        sourceType: "manual",
    },
    {
        category: "research",
        title: "Universe & Cognitive Visualization",
        content: `The AI Universe is a 3D visualization of the cognitive system state:
Components: Real-time nodes representing active agents, memory clusters, and knowledge connections
Metrics Displayed: Reward trends, drift levels, autonomy modes, swarm coordination scores
Technology: Three.js with React Three Fiber for WebGL rendering
Purpose: Provides an intuitive visual interface to the cognitive architecture's internal state
Interaction: Users can observe how the system reasons, learns, and evolves in real-time`,
        importance: 0.65,
        sourceType: "manual",
    },
];

async function seed() {
    console.log("🧠 RAG 2.0 — Seeding Knowledge Base...\n");

    let success = 0;
    let failed = 0;

    for (const entry of KNOWLEDGE_ENTRIES) {
        try {
            console.log(`  → [${entry.category.toUpperCase()}] ${entry.title}`);

            const embedding = await createEmbedding(entry.content);

            // Upsert: delete existing entry with same title, then create
            await prisma.knowledge.deleteMany({
                where: { title: entry.title },
            });

            const embeddingStr = `[${embedding.join(',')}]`;
            await prisma.$executeRawUnsafe(`
                INSERT INTO "Knowledge" ("id", "title", "content", "category", "importance", "sourceType", "embedding", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::vector, NOW())
            `, entry.title, entry.content, entry.category, entry.importance, entry.sourceType || "manual", embeddingStr);

            success++;
        } catch (err: any) {
            console.error(`  ✗ Failed: ${entry.title} — ${err.message}`);
            failed++;
        }
    }

    console.log(`\n✅ Seeded ${success}/${KNOWLEDGE_ENTRIES.length} entries (${failed} failed)`);
    await prisma.$disconnect();
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const articles = [
    {
        title: "Designing a Self-Healing RAG Pipeline",
        slug: "self-healing-rag",
        summary:
            "How I built a retrieval-augmented generation pipeline that detects failures, retries intelligently, and degrades gracefully — all without human intervention.",
        tags: ["RAG", "Reliability", "Production"],
        content: `## The Problem

Most RAG implementations are fragile. An embedding service timeout, a vector DB connection drop, or a malformed query — and the entire pipeline returns nothing useful.

In production, silence is worse than a wrong answer. Users lose trust immediately.

## The Architecture

The self-healing RAG pipeline I built operates in 8 stages:

1. **Intent Detection** — Classify the query type before retrieval
2. **Query Embedding** — Generate vector embeddings with a caching layer
3. **Parallel Vector Retrieval** — Search ProjectKnowledge and Memory stores concurrently
4. **Similarity Threshold Filter** — Discard low-confidence chunks
5. **Self-Healing Retry** — Exponential backoff on failures
6. **Context Compression** — Deduplicate and rank by relevance
7. **Anti-Hallucination Guard** — System prompt enforces grounded responses
8. **Streaming Response** — Token-by-token via Server-Sent Events

### Self-Healing Mechanism

The core insight: **every stage has a fallback**.

\`\`\`typescript
async function runAdvancedRAG(query: string) {
  try {
    const embedding = await getEmbedding(query);
    const results = await vectorSearch(embedding);
    return { context: buildContext(results), confidence: 0.85 };
  } catch (err) {
    // Fallback: return identity-only context
    return { context: IDENTITY_CONTEXT, confidence: 0.2 };
  }
}
\`\`\`

When the embedding service fails, the system doesn't crash — it falls back to identity-only responses with reduced confidence. The LLM receives a stricter system prompt that prevents hallucination.

## Results

- **Zero downtime** in 30 days of production operation
- **Graceful degradation** — users always get a response
- **Automatic recovery** — no manual restarts needed
- **Observable** — every failure is logged with full context

## Key Takeaway

> The best AI systems aren't the smartest. They're the ones that never go silent.

Self-healing isn't a feature — it's an architecture decision. Build it from day one.`,
    },
    {
        title: "Memory-Aware AI Systems in Production",
        slug: "memory-aware-ai",
        summary:
            "Exploring how persistent memory transforms AI assistants from stateless responders into context-aware agents that remember, learn, and adapt across sessions.",
        tags: ["Memory", "Agents", "LLM"],
        content: `## Beyond Stateless Chat

Standard chatbots are amnesiac. Every conversation starts from zero. The user repeats context, the bot re-discovers preferences, and the interaction feels mechanical.

Memory-aware systems change this fundamentally.

## Architecture: Three Memory Layers

I implemented a three-tier memory architecture:

### 1. Session Memory (Short-term)
- Stores the current conversation context
- Automatically pruned after session timeout
- Used for immediate context continuity

### 2. Episodic Memory (Medium-term)
- Extracts key facts from conversations
- Stored as embeddings in pgvector
- Retrieved via semantic similarity on future queries

### 3. Knowledge Memory (Long-term)
- Project knowledge from GitHub ingestion
- Research article embeddings
- Updated incrementally, never fully rebuilt

## The Memory Extraction Pipeline

After each conversation turn, a lightweight extraction step runs:

\`\`\`typescript
async function extractMemory(message: string, sessionId: string) {
  const facts = await extractFacts(message);
  for (const fact of facts) {
    const embedding = await embed(fact);
    await prisma.memory.create({
      data: { sessionId, content: fact, embedding, importance: 1 }
    });
  }
}
\`\`\`

The \`extractFacts\` function uses pattern matching and NLP to identify:
- User preferences ("I prefer Python over JavaScript")
- Technical interests ("I'm interested in RAG systems")
- Contextual facts ("I'm working on a similar project")

## Production Considerations

**Storage**: Memory entries use pgvector for efficient similarity search. A single user session rarely exceeds 50 memory entries, keeping costs negligible.

**Privacy**: All memory is session-scoped. No cross-session data leakage. Users can clear their memory at any time.

**Retrieval**: When a new query comes in, the system searches both ProjectKnowledge AND Memory stores in parallel, fusing results based on relevance scores.

## Impact

Memory-aware responses feel qualitatively different:

> **Without memory**: "I can help you with Python."
> **With memory**: "Since you mentioned preferring Python for ML tasks, here's how Aman's RAG pipeline handles embeddings using Python..."

The system feels intelligent because it *remembers*.

## Key Takeaway

> Memory isn't about storing data. It's about making AI feel human.`,
    },
    {
        title: "Architecting Agentic AI Platforms",
        slug: "agentic-ai-platforms",
        summary:
            "A deep dive into building AI systems that don't just respond — they act autonomously, use tools, and make multi-step decisions with safety guardrails.",
        tags: ["Agents", "Architecture", "Safety"],
        content: `## What Makes AI "Agentic"?

An agentic AI system differs from a standard chatbot in three fundamental ways:

1. **Tool Use** — It can call external APIs, query databases, and execute code
2. **Multi-Step Reasoning** — It plans and executes sequences of actions
3. **Self-Correction** — It evaluates its own outputs and retries on failure

## The Agent Loop

Every agentic system follows the same core loop:

\`\`\`
OBSERVE → THINK → ACT → EVALUATE → REPEAT
\`\`\`

### Observe
The agent receives a query and retrieves relevant context via RAG.

### Think
Using the context, the agent plans a response strategy. For complex queries, this may involve tool selection.

### Act
The agent executes the plan — generating a response, calling an API, or running a code snippet.

### Evaluate
The output is checked against quality constraints. If it fails (hallucination detected, confidence too low), the agent retries with adjusted parameters.

## Safety Guardrails

Agentic systems without safety rails are dangerous. My implementation includes:

### 1. Action Boundaries
\`\`\`typescript
const ALLOWED_ACTIONS = ["search", "retrieve", "summarize"];
// Never: "delete", "modify", "execute_arbitrary"
\`\`\`

### 2. Confidence Thresholds
Actions only execute when confidence exceeds a configurable threshold. Below that, the agent falls back to asking for clarification.

### 3. Rate Limiting
Each agent session has hard limits on:
- Total actions per minute
- Total tokens consumed
- Total external API calls

### 4. Audit Trail
Every action is logged with full context:
\`\`\`json
{
  "action": "vector_search",
  "confidence": 0.87,
  "latency_ms": 45,
  "results_count": 5,
  "session_id": "abc-123"
}
\`\`\`

## Voice Agent: A Case Study

The portfolio's voice demo agent is a practical agentic system:

1. **Observes** the current page section
2. **Retrieves** relevant RAG context
3. **Generates** a narration via the LLM
4. **Speaks** via Web Speech API
5. **Navigates** to the next section
6. **Handles interruptions** gracefully

This loop runs autonomously — the user just clicks "Start Tour" and the agent takes over.

## The Future

Agentic AI is moving toward:
- **Multi-agent collaboration** — specialized agents working together
- **Persistent state** — agents that remember across sessions
- **Adaptive behavior** — agents that improve from feedback

## Key Takeaway

> The gap between "AI that responds" and "AI that acts" is the gap between a tool and an agent. Building the latter requires thinking in loops, not lines.`,
    },
];

async function main() {
    for (const article of articles) {
        await prisma.research.upsert({
            where: { slug: article.slug },
            update: {},
            create: article,
        });
    }
    console.log("Seeded 3 research articles.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

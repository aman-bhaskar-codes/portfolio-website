/**
 * Multi-Layer Cognitive Memory System
 *
 * 5 Memory Layers:
 * 1. Working Memory     → Session context (last 10 interactions)
 * 2. Episodic Memory    → Important experiences with importance scoring
 * 3. Semantic Memory    → Learned principles with strength/decay
 * 4. Strategic Memory   → Long-term goals (uses existing TwinStrategicMemory)
 * 5. Behavioral Memory  → Learned behavioral patterns
 *
 * Core capabilities:
 * - Importance scoring via LLM
 * - Memory-aware context building
 * - Strength reinforcement
 * - Memory search across layers
 */

import { callLLM } from "@/lib/services/llm.service";
import { createEmbedding } from "@/lib/embeddings";
import prisma from "@/lib/prisma";

// ────────────────────────────────────────────
// 1. WORKING MEMORY (Session Context)
// ────────────────────────────────────────────

const MAX_WORKING_MEMORY = 10;

export async function addWorkingMemory(
    content: string,
    role: "context" | "query" | "response",
    visitorId?: string
) {
    await prisma.workingMemory.create({
        data: { content: content.slice(0, 2000), role, visitorId },
    });

    // Prune old entries — keep only last MAX_WORKING_MEMORY
    const all = await prisma.workingMemory.findMany({
        where: { visitorId },
        orderBy: { createdAt: "desc" },
        skip: MAX_WORKING_MEMORY,
        select: { id: true },
    });
    if (all.length > 0) {
        await prisma.workingMemory.deleteMany({
            where: { id: { in: all.map((m: { id: string }) => m.id) } },
        });
    }
}

export async function getWorkingMemory(visitorId?: string, limit = 10) {
    return prisma.workingMemory.findMany({
        where: visitorId ? { visitorId } : {},
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}

export async function clearWorkingMemory(visitorId?: string) {
    await prisma.workingMemory.deleteMany({
        where: visitorId ? { visitorId } : {},
    });
}

// ────────────────────────────────────────────
// IMPORTANCE SCORING ENGINE
// ────────────────────────────────────────────

export async function scoreMemoryImportance(content: string): Promise<number> {
    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b",
            system: `Rate the importance of this content for an Autonomous Systems Architect AI on a scale of 0.0 to 1.0.

HIGH importance (0.7-1.0):
- Architectural decisions
- Long-term strategy insights
- Behavioral improvements
- System design principles
- Technical tradeoff analysis

LOW importance (0.0-0.3):
- Casual greetings
- Small talk
- Repetitive queries

Return ONLY a single number between 0.0 and 1.0. Nothing else.`,
            user: content.slice(0, 500),
        });

        const score = parseFloat(String(result).trim());
        return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    } catch {
        return 0.5;
    }
}

// ────────────────────────────────────────────
// 2. EPISODIC MEMORY (Experiences)
// ────────────────────────────────────────────

export async function storeEpisodicMemory(
    content: string,
    eventType: string,
    userId?: string
) {
    const importance = await scoreMemoryImportance(content);
    if (importance < 0.4) {
        console.log(`[Memory] Episodic skipped (importance: ${importance.toFixed(2)})`);
        return null;
    }

    let embedding: number[] = [];
    try {
        embedding = await createEmbedding(content);
    } catch {
        // Continue without embedding
    }

    // Create without embedding (Unsupported vector type can't be used in typed create)
    const record = await prisma.episodicMemory.create({
        data: {
            content: content.slice(0, 5000),
            eventType,
            userId,
            importance,
        },
    });

    // Set embedding via raw SQL if available
    if (embedding.length > 0) {
        await prisma.$executeRawUnsafe(
            `UPDATE "EpisodicMemory" SET embedding = $1::vector WHERE id = $2`,
            `[${embedding.join(",")}]`,
            record.id
        );
    }

    return record;
}

export async function searchEpisodicMemory(query: string, limit = 5) {
    try {
        const embedding = await createEmbedding(query);
        // Fallback to recency-based if vector search fails
        const results = await prisma.episodicMemory.findMany({
            orderBy: { createdAt: "desc" },
            take: limit * 2,
        });
        // Sort by importance
        return results
            .sort((a: { importance: number }, b: { importance: number }) => b.importance - a.importance)
            .slice(0, limit);
    } catch {
        return prisma.episodicMemory.findMany({
            orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
            take: limit,
        });
    }
}

// ────────────────────────────────────────────
// 3. SEMANTIC MEMORY (Learned Principles)
// ────────────────────────────────────────────

export async function storeSemanticMemory(concept: string, description: string) {
    let embedding: number[] = [];
    try {
        embedding = await createEmbedding(`${concept}: ${description}`);
    } catch {
        // Continue without embedding
    }

    const embeddingStr = embedding.length > 0 ? `'[${embedding.join(",")}]'` : "NULL";

    await prisma.$executeRawUnsafe(`
        INSERT INTO "SemanticMemory" ("id", "concept", "description", "embedding", "strength", "createdAt", "lastReinforced")
        VALUES (gen_random_uuid(), $1, $2, ${embeddingStr}::vector, 1.0, NOW(), NOW())
    `, concept, description);

    // Return mock block because earlier code relies on receiving the object
    return {
        concept, description, strength: 1.0
    };
}

export async function reinforceMemory(id: string) {
    return prisma.semanticMemory.update({
        where: { id },
        data: {
            strength: { increment: 0.1 },
            lastReinforced: new Date(),
        },
    });
}

export async function getStrongestSemanticMemories(limit = 10) {
    return prisma.semanticMemory.findMany({
        where: { strength: { gt: 0.3 } },
        orderBy: { strength: "desc" },
        take: limit,
    });
}

// ────────────────────────────────────────────
// 4. STRATEGIC MEMORY (via existing TwinStrategicMemory)
// ────────────────────────────────────────────

export async function getStrategicMemories() {
    return prisma.twinStrategicMemory.findMany({
        orderBy: { priority: "desc" },
        take: 5,
    });
}

export async function addStrategicGoal(goal: string, priority: number) {
    return prisma.twinStrategicMemory.create({
        data: { goal, priority, status: "active" },
    });
}

// ────────────────────────────────────────────
// 5. BEHAVIORAL MEMORY (Learned Patterns)
// ────────────────────────────────────────────

export async function storeBehavioralPattern(
    pattern: string,
    improvement: string,
    effectiveness: number
) {
    return prisma.behavioralMemory.create({
        data: { pattern, improvement, effectiveness },
    });
}

export async function getEffectiveBehaviors(limit = 10) {
    return prisma.behavioralMemory.findMany({
        where: { effectiveness: { gt: 0.5 } },
        orderBy: { effectiveness: "desc" },
        take: limit,
    });
}


// ────────────────────────────────────────────
// MEMORY-AWARE CONTEXT BUILDER
// ────────────────────────────────────────────

export async function buildMemoryContext(visitorId?: string): Promise<string> {
    const [working, episodic, semantic, strategic, behavioral] = await Promise.all([
        getWorkingMemory(visitorId, 5),
        searchEpisodicMemory("", 3),
        getStrongestSemanticMemories(5),
        getStrategicMemories(),
        getEffectiveBehaviors(3),
    ]);

    const sections: string[] = [];

    if (working.length > 0) {
        sections.push(
            `RECENT CONTEXT:\n${working.map((w: { role: string; content: string }) => `[${w.role}] ${w.content.slice(0, 200)}`).join("\n")}`
        );
    }

    if (strategic.length > 0) {
        sections.push(
            `STRATEGIC GOALS:\n${strategic.map((s: { goal: string; priority: number }) => `- ${s.goal} (priority: ${s.priority})`).join("\n")}`
        );
    }

    if (semantic.length > 0) {
        sections.push(
            `LEARNED PRINCIPLES:\n${semantic.map((s: { strength: number; concept: string; description: string }) => `- [${s.strength.toFixed(1)}] ${s.concept}: ${s.description.slice(0, 150)}`).join("\n")}`
        );
    }

    if (episodic.length > 0) {
        sections.push(
            `RELEVANT EXPERIENCES:\n${episodic.map((e: { eventType: string; content: string }) => `- [${e.eventType}] ${e.content.slice(0, 150)}`).join("\n")}`
        );
    }

    if (behavioral.length > 0) {
        sections.push(
            `BEHAVIORAL INSIGHTS:\n${behavioral.map((b: { pattern: string; improvement: string }) => `- Pattern: ${b.pattern.slice(0, 80)} → ${b.improvement.slice(0, 80)}`).join("\n")}`
        );
    }

    return sections.length > 0 ? sections.join("\n\n") : "";
}

// ────────────────────────────────────────────
// SELF-REFLECTION AFTER RESPONSE
// ────────────────────────────────────────────

export async function reflectOnResponse(query: string, response: string) {
    try {
        const reflection = await callLLM({
            model: "qwen2.5:1.5b",
            system: `You are reflecting on an AI response from an Autonomous Systems Architect.

Briefly identify:
1. What architectural principle was applied?
2. What could improve next time?

Return in 2 sentences max. Be concrete.`,
            user: `Query: ${query.slice(0, 300)}\nResponse: ${response.slice(0, 500)}`,
        });

        if (reflection && typeof reflection === "string" && reflection.length > 10) {
            await storeEpisodicMemory(reflection, "reflection");
        }
    } catch {
        // Non-critical — skip silently
    }
}

/**
 * Memory Consolidation Engine
 *
 * Nightly job that:
 * 1. Reads recent episodic memories (importance > 0.6)
 * 2. Extracts generalizable architectural principles via LLM
 * 3. Stores them as Semantic Memory
 * 4. Prunes old, low-importance episodic memories
 *
 * This converts raw experiences into structured knowledge.
 */

import { callLLM } from "@/lib/services/llm.service";
import prisma from "@/lib/prisma";
import { storeSemanticMemory, storeBehavioralPattern } from "./cognitive-memory";

export interface ConsolidationResult {
    episodesProcessed: number;
    principlesExtracted: number;
    behaviorsLearned: number;
    episodesPruned: number;
}

/**
 * Run the full consolidation cycle.
 */
export async function runConsolidation(): Promise<ConsolidationResult> {
    console.log("[Consolidation] 🧠 Starting memory consolidation...");

    // Step 1: Get recent important episodes
    const episodes = await prisma.episodicMemory.findMany({
        where: { importance: { gte: 0.6 } },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    if (episodes.length < 3) {
        console.log("[Consolidation] Not enough episodes to consolidate. Skipping.");
        return { episodesProcessed: 0, principlesExtracted: 0, behaviorsLearned: 0, episodesPruned: 0 };
    }

    // Step 2: Extract architectural principles
    let principlesExtracted = 0;
    let behaviorsLearned = 0;

    try {
        const episodeText = episodes
            .map((e: { eventType: string; content: string }) => `[${e.eventType}] ${e.content.slice(0, 300)}`)
            .join("\n\n");

        const result = await callLLM({
            model: "qwen2.5:3b",
            system: `You are analyzing interaction logs from an Autonomous Systems Architect AI.

Extract:
1. Reusable architectural principles learned
2. Behavioral patterns that improved performance

Return JSON:
{
  "principles": [
    { "concept": "short title", "description": "what was learned" }
  ],
  "behaviors": [
    { "pattern": "what was observed", "improvement": "what should change", "effectiveness": 0.0-1.0 }
  ]
}

Be specific and concrete. Maximum 5 principles and 3 behaviors.`,
            user: episodeText,
            json: true,
        });

        // Store extracted principles
        if (result.principles && Array.isArray(result.principles)) {
            for (const p of result.principles.slice(0, 5)) {
                if (p.concept && p.description) {
                    await storeSemanticMemory(p.concept, p.description);
                    principlesExtracted++;
                }
            }
        }

        // Store behavioral patterns
        if (result.behaviors && Array.isArray(result.behaviors)) {
            for (const b of result.behaviors.slice(0, 3)) {
                if (b.pattern && b.improvement) {
                    await storeBehavioralPattern(
                        b.pattern,
                        b.improvement,
                        typeof b.effectiveness === "number" ? b.effectiveness : 0.5
                    );
                    behaviorsLearned++;
                }
            }
        }
    } catch (e) {
        console.error("[Consolidation] Extraction error:", e);
    }

    // Step 3: Prune old low-importance episodes (older than 14 days, importance < 0.5)
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const pruned = await prisma.episodicMemory.deleteMany({
        where: {
            importance: { lt: 0.5 },
            createdAt: { lt: cutoff },
        },
    });

    console.log(
        `[Consolidation] ✅ Done — ${principlesExtracted} principles, ${behaviorsLearned} behaviors, ${pruned.count} episodes pruned`
    );

    return {
        episodesProcessed: episodes.length,
        principlesExtracted,
        behaviorsLearned,
        episodesPruned: pruned.count,
    };
}

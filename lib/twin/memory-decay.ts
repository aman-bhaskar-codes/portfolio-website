/**
 * Memory Decay System
 *
 * Implements forgetting curve for semantic memories:
 * - Unreinforced memories decay by 2% per cycle
 * - Memories below 0.3 strength are pruned
 * - Recently reinforced memories are protected
 *
 * Also clears old working memory (older than 24h).
 */

import prisma from "@/lib/prisma";

export interface DecayResult {
    semanticDecayed: number;
    semanticPruned: number;
    workingCleared: number;
}

/**
 * Run the full decay cycle.
 */
export async function runMemoryDecay(): Promise<DecayResult> {
    console.log("[Decay] 🧹 Starting memory decay cycle...");

    // Step 1: Decay semantic memories not reinforced in 7 days
    const decayCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const decayed = await prisma.semanticMemory.updateMany({
        where: { lastReinforced: { lt: decayCutoff } },
        data: { strength: { multiply: 0.98 } },
    });

    // Step 2: Prune very weak semantic memories (strength < 0.3)
    const pruned = await prisma.semanticMemory.deleteMany({
        where: { strength: { lt: 0.3 } },
    });

    // Step 3: Clear old working memory (older than 24h)
    const workingCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cleared = await prisma.workingMemory.deleteMany({
        where: { createdAt: { lt: workingCutoff } },
    });

    console.log(
        `[Decay] ✅ Done — ${decayed.count} decayed, ${pruned.count} pruned, ${cleared.count} working cleared`
    );

    return {
        semanticDecayed: decayed.count,
        semanticPruned: pruned.count,
        workingCleared: cleared.count,
    };
}

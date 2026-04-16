/**
 * Background Job Handlers — Registered on App Boot
 *
 * Each handler processes a specific job type asynchronously.
 * They run off the request path, preventing API blocking.
 */

import { registerHandler } from "./index";
import { ingestRepo } from "@/lib/github_sync";
import { createEmbedding } from "@/lib/embeddings";
import prisma from "@/lib/prisma";
import { detectImportance, promoteToLongTerm } from "@/lib/memory";

/**
 * Registers all job handlers. Call once at app startup.
 */
export function registerAllHandlers() {
    // 1. GitHub Sync — heavy: fetches files, summarizes, embeds
    registerHandler("github-sync", async (payload) => {
        const { owner, repo } = payload;
        if (!owner || !repo) throw new Error("Missing owner/repo");
        return ingestRepo(owner, repo);
    });

    // 2. Embed Content — generates vector embedding for a knowledge chunk
    registerHandler("embed-content", async (payload) => {
        const { id, content } = payload;
        if (!id || !content) throw new Error("Missing id/content");

        const embedding = await createEmbedding(content);
        const embeddingStr = `[${embedding.join(',')}]`;
        await prisma.$executeRawUnsafe(`
            UPDATE "Knowledge" SET embedding = $1::vector WHERE id = $2
        `, embeddingStr, id);

        return { embedded: true, vectorSize: embedding.length };
    });

    // 3. Memory Score — evaluates and promotes important memories
    registerHandler("memory-score", async (payload) => {
        const { content, sessionId } = payload;
        if (!content) throw new Error("Missing content");

        const { score, category, shouldPromote } = detectImportance(content);

        if (shouldPromote) {
            await promoteToLongTerm(content, sessionId);
        }

        return { score, category, promoted: shouldPromote };
    });

    // 4. Bulk Re-embed — re-generates embeddings for all knowledge without vectors
    registerHandler("bulk-reembed", async () => {
        const chunks = await prisma.$queryRawUnsafe<any[]>(`
            SELECT id, content FROM "Knowledge"
            WHERE embedding IS NULL
            LIMIT 50
        `);

        let count = 0;
        for (const chunk of chunks) {
            try {
                const embedding = await createEmbedding(chunk.content);
                const embeddingStr = `[${embedding.join(',')}]`;
                await prisma.$executeRawUnsafe(`
                    UPDATE "Knowledge" SET embedding = $1::vector WHERE id = $2
                `, embeddingStr, chunk.id);
                count++;
            } catch {
                // Continue on individual failure
            }
        }

        return { reembedded: count, total: chunks.length };
    });

    // 5. Index Source — chunks and embeds content from a generic source (project/research)
    registerHandler("index-source", async (payload) => {
        const { type, sourceId, content, title } = payload;
        // Simple chunking request (can be improved with lib/chunker if available)
        const chunks = content.match(/[\s\S]{1,1000}/g) || [content];

        // Delete old knowledge for this source to avoid duplicates
        await prisma.knowledge.deleteMany({
            where: { sourceType: type, sourceId: sourceId },
        });

        for (const chunk of chunks) {
            const embedding = await createEmbedding(chunk);
            const embeddingStr = `[${embedding.join(',')}]`;
            await prisma.$executeRawUnsafe(`
                INSERT INTO "Knowledge" ("id", "title", "content", "sourceType", "sourceId", "embedding", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::vector, NOW())
            `, `${title} (Chunk)`, chunk, type, sourceId, embeddingStr);
        }
        return { chunks: chunks.length, sourceId };
    });

    // 6. Rebuild Graph — placeholder for Knowledge Graph update
    registerHandler("rebuild-graph", async () => {
        console.log("[GRAPH] Rebuilding knowledge graph nodes...");
        // Future: Fetch all ProjectKnowledge and generate nodes/edges
        await new Promise(r => setTimeout(r, 1000)); // Simulate work
        return { built: true, nodes: 0 };
    });

    // 7. Twin Policy Evolution — Self-Evolving Policy Mutation Loop
    registerHandler("twin-policy-evolution", async () => {
        const { runEvolutionCycle } = await import("@/lib/twin/evolution");
        const result = await runEvolutionCycle();
        return result;
    });

    // 8. Memory Consolidation — Episodic → Semantic learning
    registerHandler("memory-consolidation", async () => {
        const { runConsolidation } = await import("@/lib/twin/memory-consolidation");
        return runConsolidation();
    });

    // 9. Memory Decay — Forgetting curve + working memory cleanup
    registerHandler("memory-decay", async () => {
        const { runMemoryDecay } = await import("@/lib/twin/memory-decay");
        return runMemoryDecay();
    });

    // 10. Cluster Refinement — Merge, decay, prune, recompute clusters
    registerHandler("cluster-refinement", async () => {
        const { runClusterRefinement } = await import("@/lib/twin/cluster-refinement");
        return runClusterRefinement();
    });

    // 11. Retrieval Weight Self-Tuning — Adjusts per-intent retrieval weights
    registerHandler("twin-retrieval-optimization", async () => {
        const { runRetrievalTuning } = await import("@/lib/twin/retrieval-tuning");
        return runRetrievalTuning();
    });

    // 12. Reinforcement Reward Cycle — Full reward-guided self-improvement
    registerHandler("twin-reward-cycle", async () => {
        const { runReinforcementCycle } = await import("@/lib/twin/reward-model");
        return runReinforcementCycle();
    });

    // 13. Adversarial Evaluation — Offline synthetic stress testing
    registerHandler("twin-adversarial-eval", async () => {
        const { runAdversarialEval } = await import("@/lib/twin/adversarial-eval");
        return runAdversarialEval();
    });

    // 14. Autonomous Goal Formation — Self-directed improvement cycle
    registerHandler("twin-autonomous-goals", async () => {
        const { runAutonomousCycle } = await import("@/lib/twin/autonomous-goals");
        return runAutonomousCycle();
    });

    // 15. Research Hypothesis Engine — Gap detection, experimentation, validation
    registerHandler("twin-research-cycle", async () => {
        const { runResearchCycle } = await import("@/lib/twin/research-engine");
        return runResearchCycle();
    });

    // 16. Meta-Cognitive Self-Modeling — Cognitive state analysis + meta-learning
    registerHandler("twin-metacognition", async () => {
        const { runMetaLearning } = await import("@/lib/twin/metacognition");
        return runMetaLearning();
    });

    // 17. World-Model Simulation — Counterfactual prediction + action selection
    registerHandler("twin-world-model", async () => {
        const { runWorldModelCycle } = await import("@/lib/twin/world-model");
        return runWorldModelCycle(true); // long-horizon by default
    });

    console.log("[QUEUE] All 17 handlers registered");

    // 18. Multi-Twin Cognitive Swarm — Distributed cooperative intelligence
    registerHandler("twin-swarm", async () => {
        const { runSwarmCycle } = await import("@/lib/twin/swarm");
        return runSwarmCycle("Improve overall system performance, reasoning quality, and research depth");
    });

    console.log("[QUEUE] All 18 handlers registered");

    // 19. External Tool Autonomy — Safe real-world code modification
    registerHandler("twin-tool-execution", async (payload) => {
        const { executeToolIntent } = await import("@/lib/tools/executor");
        return executeToolIntent(payload);
    });

    console.log("[QUEUE] All 19 handlers registered");
}

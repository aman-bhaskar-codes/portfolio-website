import { LRUCache } from "lru-cache";
import { runAdvancedRAG } from "@/lib/rag";
import { logger } from "@/lib/logger";

// Create an elite-tier memory cache for repetitive RAG retrieval 
export const ragCache = new LRUCache({
    max: 100, // Maximum items
    ttl: 1000 * 60 * 10, // 10 minutes cache lifespan
});

export async function handleRag(query: string) {
    // 1. Check RAM Cache for instant retrieval
    if (ragCache.has(query)) {
        logger.info(`[RAG-CACHE-HIT] Instant resolution for: "${query.substring(0, 30)}..."`);
        const cachedRes = ragCache.get(query);
        // Force the cacheHit flag to true
        return { ...(cachedRes as object), cacheHit: true };
    }

    // 2. Heavy Compute (Vector Search & Alignment)
    logger.info(`[RAG-CACHE-MISS] Executing Deep Search vector execution for: "${query.substring(0, 30)}..."`);
    const ragStart = Date.now();
    const result = await runAdvancedRAG(query);

    // 3. Post-execution Observability
    logger.info(
        `[RAG-RESOLVED] Execution time: ${Date.now() - ragStart}ms | Sub-vectors retrieved: ${result.sourceCount} | Confidence Array: ${(
            result.confidence * 100
        ).toFixed(0)}%`
    );

    // Write back to the RAM cache before returning
    ragCache.set(query, result);
    return { ...result, cacheHit: false };
}

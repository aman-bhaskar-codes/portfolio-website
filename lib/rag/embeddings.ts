/**
 * Embedding Service — In-Memory Cached
 * 
 * Uses nomic-embed-text via Ollama. Caches embeddings in-memory
 * with automatic LRU eviction to stay M1-friendly.
 */

import { createEmbedding } from "../embeddings";

const MAX_CACHE_SIZE = 200;
const embedCache = new Map<string, { vector: number[]; timestamp: number }>();

/**
 * Normalizes query for cache keying (lowercase, trimmed, collapsed whitespace).
 */
function normalizeQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Evicts oldest entries when cache exceeds MAX_CACHE_SIZE.
 */
function pruneCache() {
    if (embedCache.size <= MAX_CACHE_SIZE) return;

    const entries = Array.from(embedCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    for (const [key] of toRemove) {
        embedCache.delete(key);
    }
}

/**
 * Embeds a query string, returning cached result if available.
 */
export async function embedQuery(query: string): Promise<number[]> {
    const key = normalizeQuery(query);

    const cached = embedCache.get(key);
    if (cached) {
        console.log("[EMBED] Cache HIT");
        return cached.vector;
    }

    console.log("[EMBED] Cache MISS — generating...");
    const vector = await createEmbedding(query);

    embedCache.set(key, { vector, timestamp: Date.now() });
    pruneCache();

    return vector;
}

/**
 * Returns current cache stats for analytics.
 */
export function getEmbedCacheStats() {
    return {
        size: embedCache.size,
        maxSize: MAX_CACHE_SIZE,
    };
}

/**
 * Self-Healing RAG Orchestrator — Elite Edition
 *
 * 9-Stage Pipeline:
 *   1. Intent Detection (zero LLM cost)
 *   2. Memory Shortcut (skip embedding for memory intent)
 *   3. Query Embedding (cached, LRU)
 *   4. Parallel Retrieval (intent-weighted)
 *   5. Weak Match Detection + Query Refinement Retry (max 1)
 *   6. Intelligent Fallback Routing
 *   7. Context Compression (token-budgeted)
 *   8. GitHub Live Injection (github intent)
 *   9. Return structured result with confidence
 */

import { detectIntent, getRetrievalWeights, getKnowledgeCategory, type Intent } from "./intent";
import { embedQuery } from "./embeddings";
import { retrieve, fetchDirectMemory, type RetrievalResult } from "./retrieval";
import { buildContext } from "./contextBuilder";
import { fetchRecentActivity } from "../github/live";
import { callLLMSync } from "@/services/ollama";

export interface RAGPipelineResult {
    intent: Intent;
    context: string;
    sourceCount: number;
    latencyMs: number;
    cacheHit: boolean;
    confidence: number;
    selfHealed: boolean;
    healMethod?: "retry" | "fallback-github" | "fallback-memory" | "fallback-overview";
}

// Pipeline-level cache
const pipelineCache = new Map<string, { result: RAGPipelineResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// Static fallback for when everything fails
const FALLBACK_OVERVIEW = `
Aman Bhaskar is an AI Systems Engineer specializing in cognitive architectures,
full-stack orchestration, and advanced RAG systems. His portfolio includes
production AI platforms with self-healing retrieval, real-time GitHub sync,
and autonomous knowledge management.
`.trim();

export async function runAdvancedRAG(query: string): Promise<RAGPipelineResult> {
    const startTime = Date.now();

    // 0. Pipeline cache check
    const cacheKey = query.toLowerCase().trim();
    const cached = pipelineCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        console.log(`[RAG] Pipeline cache HIT`);
        return { ...cached.result, cacheHit: true };
    }

    try {
        // 1. Intent Detection — zero latency
        const intent = detectIntent(query);
        console.log(`[RAG] Intent: ${intent} | Query: "${query.substring(0, 50)}..."`);

        // 2. Memory Shortcut — skip embedding for memory intent
        if (intent === "memory") {
            const directMemories = await fetchDirectMemory();
            if (directMemories.length > 0) {
                const context = buildContext(query, directMemories, intent);
                const result: RAGPipelineResult = {
                    intent, context, sourceCount: directMemories.length,
                    latencyMs: Date.now() - startTime,
                    cacheHit: false, confidence: 1.0,
                    selfHealed: false,
                };
                cacheResult(cacheKey, result);
                console.log(`[RAG] Memory shortcut — ${directMemories.length} direct memories in ${result.latencyMs}ms`);
                return result;
            }
        }

        // 3. Embed query (cached internally)
        const embedding = await embedQuery(query);

        // 4. Category-filtered parallel retrieval (RAG 2.0)
        const weights = getRetrievalWeights(intent);
        const category = getKnowledgeCategory(intent);
        let retrieval = await retrieve(embedding, weights, category);

        let selfHealed = false;
        let healMethod: RAGPipelineResult["healMethod"] = undefined;

        // 5. Weak Match Detection + Query Refinement Retry (max 1)
        if (retrieval.isWeak && retrieval.totalCount > 0) {
            console.log(`[RAG] Weak retrieval detected — attempting query refinement...`);

            try {
                const refinedQuery = await refineQuery(query);
                if (refinedQuery && refinedQuery !== query) {
                    const refinedEmbedding = await embedQuery(refinedQuery);
                    const retryResult = await retrieve(refinedEmbedding, weights, category);

                    if (retryResult.confidence > retrieval.confidence) {
                        retrieval = retryResult;
                        selfHealed = true;
                        healMethod = "retry";
                        console.log(`[RAG] Query refinement succeeded — confidence: ${(retryResult.confidence * 100).toFixed(0)}%`);
                    }
                }
            } catch (e) {
                console.warn("[RAG] Query refinement failed, continuing with original results");
            }
        }

        // 6. Intelligent Fallback Routing
        if (retrieval.isWeak || retrieval.totalCount === 0) {
            const fallbackContext = await getFallbackContext(intent, query);
            if (fallbackContext.context) {
                const result: RAGPipelineResult = {
                    intent,
                    context: fallbackContext.context,
                    sourceCount: fallbackContext.sourceCount,
                    latencyMs: Date.now() - startTime,
                    cacheHit: false,
                    confidence: fallbackContext.confidence,
                    selfHealed: true,
                    healMethod: fallbackContext.method,
                };
                cacheResult(cacheKey, result);
                console.log(`[RAG] Fallback: ${fallbackContext.method} in ${result.latencyMs}ms`);
                return result;
            }
        }

        // 7. Context Compression
        let context = buildContext(query, retrieval.results, intent);

        // 8. GitHub Live Injection (only for github intent)
        if (intent === "github") {
            try {
                const githubContext = await fetchRecentActivity();
                if (githubContext) {
                    context += "\n" + githubContext;
                }
            } catch {
                console.warn("[RAG] GitHub live injection failed");
            }
        }

        // 9. Build result
        const result: RAGPipelineResult = {
            intent, context,
            sourceCount: retrieval.totalCount,
            latencyMs: Date.now() - startTime,
            cacheHit: false,
            confidence: retrieval.confidence,
            selfHealed,
            healMethod,
        };

        cacheResult(cacheKey, result);

        console.log(
            `[RAG] Pipeline complete in ${result.latencyMs}ms | Sources: ${result.sourceCount} | ` +
            `Confidence: ${(result.confidence * 100).toFixed(0)}% | Healed: ${selfHealed}`
        );

        return result;

    } catch (error) {
        console.error("[RAG] Pipeline failure:", error);
        return {
            intent: "general",
            context: FALLBACK_OVERVIEW,
            sourceCount: 0,
            latencyMs: Date.now() - startTime,
            cacheHit: false,
            confidence: 0,
            selfHealed: true,
            healMethod: "fallback-overview",
        };
    }
}

/**
 * Refines a query into a more detailed technical search query.
 * Uses LLM but with a strict timeout guard.
 */
async function refineQuery(query: string): Promise<string> {
    const result = await Promise.race([
        callLLMSync([
            {
                role: "system",
                content: "Rewrite this into a detailed, specific technical search query. Return ONLY the refined query, nothing else. Keep it under 30 words.",
            },
            { role: "user", content: query },
        ]),
        new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error("Refinement timeout")), 2000)
        ),
    ]);

    return result.trim();
}

/**
 * Intelligent fallback routing based on intent.
 */
async function getFallbackContext(
    intent: Intent, query: string
): Promise<{ context: string; sourceCount: number; confidence: number; method: RAGPipelineResult["healMethod"] }> {
    // GitHub intent → live fetch
    if (intent === "github") {
        try {
            const githubContext = await fetchRecentActivity();
            if (githubContext) {
                return {
                    context: `### LIVE_GITHUB_FALLBACK:\n${githubContext}`,
                    sourceCount: 1,
                    confidence: 0.7,
                    method: "fallback-github",
                };
            }
        } catch { }
    }

    // Memory intent → direct DB fetch
    if (intent === "memory") {
        const memories = await fetchDirectMemory();
        if (memories.length > 0) {
            const ctx = memories.map(m => m.content).join("\n---\n");
            return {
                context: `### DIRECT_MEMORY_RECALL:\n${ctx}`,
                sourceCount: memories.length,
                confidence: 0.8,
                method: "fallback-memory",
            };
        }
    }

    // General fallback → static overview
    return {
        context: `### STATIC_OVERVIEW:\n${FALLBACK_OVERVIEW}`,
        sourceCount: 1,
        confidence: 0.3,
        method: "fallback-overview",
    };
}

function cacheResult(key: string, result: RAGPipelineResult) {
    pipelineCache.set(key, { result, timestamp: Date.now() });
    if (pipelineCache.size > 100) {
        const oldest = Array.from(pipelineCache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp)
            .slice(0, 50);
        for (const [k] of oldest) pipelineCache.delete(k);
    }
}

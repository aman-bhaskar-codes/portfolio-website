/**
 * RAG 2.0 — Category-Aware Weighted Retrieval Engine
 *
 * Features:
 * - Category-filtered knowledge retrieval (identity, project, system, etc.)
 * - Weighted scoring: similarity * 0.6 + importance * 0.25 + recency * 0.15
 * - Parallel 2-way retrieval: Knowledge (category-filtered) + EpisodicMemory
 * - Strong/weak match detection with confidence metrics
 * - Direct memory fetch for memory-intent queries
 */

import prisma from "@/lib/prisma";
import { RAGResult } from "./types";

const STRONG_THRESHOLD = 0.72;
const WEAK_THRESHOLD = 0.40;
const MAX_KNOWLEDGE = 5;
const MAX_MEMORY = 3;

/**
 * Category-filtered, importance+recency weighted knowledge search.
 * This is the core of RAG 2.0 — structured retrieval instead of flat similarity.
 */
async function searchKnowledge(
    vector: number[],
    limit: number,
    category: string | null
): Promise<RAGResult[]> {
    const cap = Math.min(limit, MAX_KNOWLEDGE);
    try {
        // Build category filter: specific category OR fallback to all
        const categoryFilter = category
            ? `AND (category = '${category}' OR category = 'general')`
            : "";

        const vectorStr = `[${vector.join(',')}]`;
        const results = await prisma.$queryRawUnsafe<any[]>(`
            WITH matches AS (
                SELECT
                    id, title, content, category, importance, "createdAt",
                    1 - (embedding <=> $1::vector) as similarity
                FROM "Knowledge"
                WHERE 1 - (embedding <=> $1::vector) > $2
                ${categoryFilter}
            )
            SELECT
                id, title, content, category, importance, similarity,
                (
                    similarity * 0.6
                    + COALESCE(importance, 0.5) * 0.25
                    + (1.0 / (1 + EXTRACT(EPOCH FROM AGE(now(), "createdAt")) / 86400.0)) * 0.15
                ) AS score
            FROM matches
            ORDER BY score DESC
            LIMIT $3
        `, vectorStr, WEAK_THRESHOLD, cap);

        return results.map((r: any) => ({
            id: r.id,
            title: r.title || "Knowledge",
            content: r.content,
            similarity: Number(r.score || r.similarity),
            source: "Knowledge" as const,
            category: r.category,
            importance: r.importance,
        }));
    } catch (error) {
        console.warn("[RETRIEVAL] Knowledge search failed:", error);
        return [];
    }
}

/**
 * Category-specific knowledge search — filters by exact category match.
 */
async function searchKnowledgeByCategory(
    vector: number[],
    limit: number,
    category: string
): Promise<RAGResult[]> {
    const cap = Math.min(limit, MAX_KNOWLEDGE);
    try {
        const vectorStr = `[${vector.join(',')}]`;
        const results = await prisma.$queryRawUnsafe<any[]>(`
            WITH matches AS (
                SELECT
                    id, title, content, category, importance, "createdAt",
                    1 - (embedding <=> $1::vector) as similarity
                FROM "Knowledge"
                WHERE category = $2
                  AND 1 - (embedding <=> $1::vector) > $3
            )
            SELECT
                id, title, content, category, importance, similarity,
                (
                    similarity * 0.6
                    + COALESCE(importance, 0.5) * 0.25
                    + (1.0 / (1 + EXTRACT(EPOCH FROM AGE(now(), "createdAt")) / 86400.0)) * 0.15
                ) AS score
            FROM matches
            ORDER BY score DESC
            LIMIT $4
        `, vectorStr, category, WEAK_THRESHOLD, cap);

        return results.map((r: any) => ({
            id: r.id,
            title: r.title || "Knowledge",
            content: r.content,
            similarity: Number(r.score || r.similarity),
            source: "Knowledge" as const,
            category: r.category,
            importance: r.importance,
        }));
    } catch (error) {
        console.warn(`[RETRIEVAL] Category ${category} search failed:`, error);
        return [];
    }
}

/**
 * Episodic memory search — importance-weighted.
 */
async function searchMemory(vector: number[], limit: number): Promise<RAGResult[]> {
    const cap = Math.min(limit, MAX_MEMORY);
    try {
        const vectorStr = `[${vector.join(',')}]`;
        const results = await prisma.$queryRawUnsafe<any[]>(`
            SELECT id, 'Contextual Memory' as title, content, 1 - (embedding <=> $1::vector) as similarity
            FROM "EpisodicMemory"
            WHERE 1 - (embedding <=> $1::vector) > $2
            ORDER BY importance DESC, similarity DESC
            LIMIT $3
        `, vectorStr, WEAK_THRESHOLD, cap);
        return results.map((r: any) => ({ ...r, source: "Memory" as const }));
    } catch (error) {
        console.warn("[RETRIEVAL] Memory search failed:", error);
        return [];
    }
}

/**
 * Direct memory fetch — bypasses embedding for memory-intent queries.
 */
export async function fetchDirectMemory(userId?: string): Promise<RAGResult[]> {
    try {
        const memories = await prisma.episodicMemory.findMany({
            take: 5,
            orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
            ...(userId ? { where: { userId } } : {}),
        });
        return memories.map((m: any) => ({
            id: m.id,
            title: "Direct Memory Recall",
            content: m.content,
            similarity: 1.0,
            source: "Memory" as const,
        }));
    } catch {
        return [];
    }
}

export interface RetrievalResult {
    results: RAGResult[];
    strongCount: number;
    totalCount: number;
    confidence: number;
    isWeak: boolean;
}

/**
 * RAG 2.0 — Category-aware parallel retrieval with weighted scoring.
 *
 * If a category is provided, knowledge retrieval filters by that category.
 * Otherwise, searches all knowledge entries with weighted scoring.
 */
export async function retrieve(
    embedding: number[],
    weights: { knowledge: number; memory: number },
    category?: string | null
): Promise<RetrievalResult> {
    const startTime = Date.now();

    // Parallel retrieval: Knowledge (category-filtered) + Memory
    const [knowledge, memories] = await Promise.all([
        category
            ? searchKnowledgeByCategory(embedding, weights.knowledge, category)
            : searchKnowledge(embedding, weights.knowledge, null),
        searchMemory(embedding, weights.memory),
    ]);

    const merged = [...knowledge, ...memories]
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, MAX_KNOWLEDGE + MAX_MEMORY);

    const strongCount = merged.filter(r => r.similarity >= STRONG_THRESHOLD).length;

    // Weighted confidence: average similarity of top results
    const confidence = merged.length > 0
        ? merged.reduce((sum, r) => sum + r.similarity, 0) / merged.length
        : 0;
    const isWeak = strongCount === 0 && confidence < 0.50;

    console.log(
        `[RETRIEVAL] ${merged.length} results (${strongCount} strong) in ${Date.now() - startTime}ms | ` +
        `Category: ${category || "all"} | Confidence: ${(confidence * 100).toFixed(0)}% | Weak: ${isWeak}`
    );

    return { results: merged, strongCount, totalCount: merged.length, confidence, isWeak };
}

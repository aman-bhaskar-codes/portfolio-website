/**
 * 3-Tier Memory Service — Production Memory Architecture
 *
 * Layer 1: Short-Term (session messages — last 10 per session)
 * Layer 2: Long-Term Semantic (important memories — vector searchable)
 * Layer 3: System Knowledge (projects, research via ProjectKnowledge)
 *
 * Also handles importance detection and memory promotion.
 */

import prisma from "@/lib/prisma";
import { createEmbedding } from "@/lib/embeddings";

/* ── Layer 1: Short-Term Context ── */
export async function getShortTermContext(sessionId: string): Promise<string> {
    const messages = await prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: "desc" },
        take: 4,  // Last 4 exchanges — minimized for latency
        select: { role: true, content: true },
    });

    if (messages.length === 0) return "";

    return messages
        .reverse()
        .map((m: any) => `${m.role}: ${m.content}`)
        .join("\n");
}

/* ── Layer 2: Long-Term Semantic Memory ── */
export async function searchLongTermMemory(
    embedding: number[],
    limit: number = 3
): Promise<{ content: string; importance: number; similarity: number }[]> {
    try {
        const embeddingStr = `[${embedding.join(',')}]`;
        const results = await prisma.$queryRawUnsafe<any[]>(`
            SELECT content, importance, 1 - (embedding::vector <=> $1::vector) as similarity
            FROM "LongTermMemory"
            WHERE 1 - (embedding::vector <=> $1::vector) > 0.4
            ORDER BY similarity DESC
            LIMIT $2
        `, embeddingStr, limit);
        return results;
    } catch (error) {
        console.warn("[MEMORY] Long-term search failed:", error);
        return [];
    }
}

/* ── Importance Detection ── */
const IMPORTANCE_PATTERNS: { pattern: RegExp; score: number; category: string }[] = [
    { pattern: /i (?:prefer|like|love|enjoy|want|need)/i, score: 8, category: "preference" },
    { pattern: /my (?:name|email|background|experience|role|job)/i, score: 9, category: "fact" },
    { pattern: /i (?:am|work|specialize|focus)/i, score: 7, category: "fact" },
    { pattern: /interested in/i, score: 7, category: "interest" },
    { pattern: /(?:favorite|preferred|best)/i, score: 6, category: "preference" },
    { pattern: /remember (?:that|this)/i, score: 9, category: "fact" },
];

/**
 * Detects if a user message contains important information worth
 * promoting to long-term memory. Returns score 0-10 and category.
 */
export function detectImportance(content: string): {
    score: number;
    category: string | null;
    shouldPromote: boolean;
} {
    let maxScore = 0;
    let category: string | null = null;

    for (const { pattern, score, category: cat } of IMPORTANCE_PATTERNS) {
        if (pattern.test(content) && score > maxScore) {
            maxScore = score;
            category = cat;
        }
    }

    return {
        score: maxScore,
        category,
        shouldPromote: maxScore >= 6,
    };
}

/**
 * Promotes a message to long-term memory if it meets importance threshold.
 * Embeds the content and stores it for future semantic retrieval.
 */
export async function promoteToLongTerm(
    content: string,
    sessionId?: string
): Promise<boolean> {
    const { score, category, shouldPromote } = detectImportance(content);

    if (!shouldPromote) return false;

    try {
        const embedding = await createEmbedding(content);

        const embeddingStr = `[${embedding.join(',')}]`;

        const sessionIdVal = sessionId ? `'${sessionId}'` : 'NULL';
        const categoryVal = category ? `'${category}'` : 'NULL';

        await prisma.$executeRawUnsafe(`
            INSERT INTO "LongTermMemory" ("id", "content", "embedding", "importance", "category", "sessionId", "createdAt")
            VALUES (gen_random_uuid(), $1, $2::vector, $3, ${categoryVal}, ${sessionIdVal}, NOW())
        `, content, embeddingStr, score);

        console.log(`[MEMORY] Promoted to long-term: importance=${score} category=${category}`);
        return true;
    } catch (error) {
        console.error("[MEMORY] Promotion failed:", error);
        return false;
    }
}

/**
 * Merges all memory layers into a single context string.
 * Used by the RAG pipeline for complete context building.
 */
export async function getMergedMemoryContext(
    sessionId: string,
    queryEmbedding: number[]
): Promise<{ context: string; layers: { shortTerm: number; longTerm: number } }> {
    const [shortTerm, longTerm] = await Promise.all([
        getShortTermContext(sessionId),
        searchLongTermMemory(queryEmbedding, 3),
    ]);

    const parts: string[] = [];
    if (shortTerm) {
        parts.push(`### RECENT_CONVERSATION:\n${shortTerm}`);
    }

    if (longTerm.length > 0) {
        const ltContext = longTerm
            .map((m) => `[importance:${m.importance}] ${m.content}`)
            .join("\n");
        parts.push(`### LONG_TERM_MEMORY:\n${ltContext}`);
    }

    return {
        context: parts.join("\n\n"),
        layers: {
            shortTerm: shortTerm ? shortTerm.split("\n").length : 0,
            longTerm: longTerm.length,
        },
    };
}

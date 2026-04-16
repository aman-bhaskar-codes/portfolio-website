import prisma from "@/lib/prisma";
import { embedQuery } from "./embedding.service";

interface RAGChunk {
    content: string;
    score: number;
    metadata?: any;
    sourceType: string;
}

export async function retrieveContext(query: string) {
    const embedding = await embedQuery(query);

    const embeddingStr = `[${embedding.join(',')}]`;
    // Vector Search
    // We search across all Knowledge (projects, research, etc)
    const vectorResults = await prisma.$queryRawUnsafe<any[]>(`
    SELECT content, metadata, "sourceType", 1 - (embedding::vector <=> $1::vector) AS score
    FROM "Knowledge"
    ORDER BY embedding::vector <=> $1::vector
    LIMIT 8
  `, embeddingStr);

    // Keyword Fallback
    // Simple ILIKE for now, could use full text search (tsvector) if needed
    const keywordResults = await prisma.knowledge.findMany({
        where: {
            content: {
                contains: query,
                mode: "insensitive"
            }
        },
        take: 5
    });

    // Map keyword results to consistent format with a default score multiplier
    const mappedKeywordResults = keywordResults.map(k => ({
        content: k.content,
        metadata: k.metadata,
        sourceType: k.sourceType,
        score: 0.5 // Base score for keyword matches
    }));

    return mergeAndRank(vectorResults, mappedKeywordResults);
}

function mergeAndRank(vectorResults: any[], keywordResults: any[]) {
    // Deduplicate by content
    const map = new Map<string, RAGChunk>();

    vectorResults.forEach(r => {
        map.set(r.content, {
            content: r.content,
            score: r.score,
            metadata: r.metadata,
            sourceType: r.sourceType
        });
    });

    keywordResults.forEach(r => {
        if (map.has(r.content)) {
            //Boost score if found in both
            const existing = map.get(r.content)!;
            existing.score = Math.min(existing.score + 0.2, 1.0);
        } else {
            map.set(r.content, {
                content: r.content,
                score: r.score,
                metadata: r.metadata,
                sourceType: r.sourceType
            });
        }
    });

    return Array.from(map.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 8); // Top 8 chunks
}

export async function retrieveMemory(userId?: string) {
    // If no user, return empty (e.g. public visitor)
    if (!userId) return [];

    // We don't have user_id in LongTermMemory directly in schema shown?
    // Schema shown: LongTermMemory { id, sessionId, ... }
    // Logic: Retrieve recent or important long term memories?
    // For now, let's fetch strictly high importance
    return prisma.longTermMemory.findMany({
        where: { importance: { gte: 7 } },
        take: 3,
        orderBy: { createdAt: 'desc' }
    });
}

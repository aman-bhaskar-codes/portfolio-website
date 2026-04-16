/**
 * Knowledge Store — Chunk + Embed + Persist
 *
 * Takes summary text, chunks it, generates embeddings,
 * and stores in the ProjectKnowledge table.
 */

import prisma from "@/lib/prisma";
import { createEmbedding } from "@/lib/embeddings";

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

/**
 * Splits text into overlapping chunks for better retrieval.
 */
function chunkText(text: string): string[] {
    if (text.length <= CHUNK_SIZE) return [text];

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + CHUNK_SIZE, text.length);
        chunks.push(text.slice(start, end));
        start += CHUNK_SIZE - CHUNK_OVERLAP;
    }

    return chunks;
}

/**
 * Stores summarized knowledge into the Knowledge table.
 * Deletes existing entries for the same repo before inserting (idempotent).
 */
export async function storeKnowledge(repoName: string, summary: string): Promise<number> {
    // Delete old entries for this repo (idempotent re-sync)
    await prisma.knowledge.deleteMany({
        where: { title: { startsWith: repoName } }
    });

    const chunks = chunkText(summary);

    // Process in batches
    let stored = 0;

    for (const chunk of chunks) {
        try {
            const embedding = await createEmbedding(chunk);

            const embeddingStr = `[${embedding.join(',')}]`;
            await prisma.$executeRawUnsafe(`
                INSERT INTO "Knowledge" ("id", "title", "content", "embedding", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2, $3::vector, NOW())
            `, `${repoName} — GitHub Knowledge`, chunk, embeddingStr);

            stored++;
        } catch (error) {
            console.warn(`[STORE] Failed to embed chunk for ${repoName}:`, error);
        }
    }

    console.log(`[STORE] Stored ${stored}/${chunks.length} chunks for ${repoName}`);
    return stored;
}

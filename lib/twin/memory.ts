import prisma from "@/lib/prisma";
import { embedQuery } from "@/lib/services/embedding.service";

export async function storeConversation(identifier: { userId?: string, visitorId?: string }, role: string, content: string) {
    try {
        const embedding = await embedQuery(content);

        // Handle User vs Visitor
        // If userId is present, we store userId. If visitorId, we store visitorId.

        const userIdVal = identifier.userId ? `'${identifier.userId}'` : "NULL";
        const visitorIdVal = identifier.visitorId ? `'${identifier.visitorId}'` : "NULL";

        const embeddingStr = `[${embedding.join(',')}]`;
        // Raw SQL for vector insert
        await prisma.$executeRawUnsafe(`
            INSERT INTO "TwinConversation" ("id", "userId", "visitorId", "role", "content", "embedding", "createdAt")
            VALUES (gen_random_uuid(), ${userIdVal}, ${visitorIdVal}, $1, $2, $3::vector, NOW())
        `, role, content, embeddingStr);
    } catch (e) {
        console.error("Failed to store conversation memory", e);
    }
}

export async function retrieveConversationMemory(identifier: { userId?: string, visitorId?: string }, query: string, limit = 5) {
    try {
        const embedding = await embedQuery(query);

        // Condition based on identifier
        const whereClause = identifier.userId
            ? `"userId" = '${identifier.userId}'`
            : `"visitorId" = '${identifier.visitorId}'`;

        const embeddingStr = `[${embedding.join(',')}]`;
        const results = await prisma.$queryRawUnsafe(`
            SELECT content, role, 1 - (embedding::vector <=> $1::vector) as similarity
            FROM "TwinConversation"
            WHERE ${whereClause}
            ORDER BY embedding::vector <=> $1::vector
            LIMIT $2
        `, embeddingStr, limit);

        return results as { content: string, role: string, similarity: number }[];
    } catch (e) {
        console.error("Failed to retrieve conversation memory", e);
        return [];
    }
}

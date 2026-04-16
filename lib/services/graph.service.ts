import prisma from "@/lib/prisma";
import { embedQuery } from "./embedding.service";

export async function createGraphNode(data: {
    sourceType: string;
    sourceId: string;
    content: string; // To embed
    importance?: number;
    metadata?: any;
}) {
    const embedding = await embedQuery(data.content);

    // Upsert node
    const existing = await prisma.graphNode.findFirst({
        where: { sourceId: data.sourceId, sourceType: data.sourceType }
    });

    if (existing) {
        const embeddingStr = `[${embedding.join(',')}]`;
        const mdJson = JSON.stringify(data.metadata ?? existing.metadata ?? {});

        return prisma.$executeRawUnsafe(`
            UPDATE "GraphNode"
            SET embedding = $1::vector, importance = $2, metadata = $3::jsonb
            WHERE id = $4
        `, embeddingStr, data.importance ?? existing.importance, mdJson, existing.id);
    }

    const embeddingStr = `[${embedding.join(',')}]`;
    const mdJson = data.metadata ? JSON.stringify(data.metadata) : "{}";

    return prisma.$executeRawUnsafe(`
        INSERT INTO "GraphNode" ("id", "sourceType", "sourceId", "embedding", "importance", "metadata", "createdAt")
        VALUES (gen_random_uuid(), $1, $2, $3::vector, $4, $5::jsonb, NOW())
    `, data.sourceType, data.sourceId, embeddingStr, data.importance ?? 1.0, mdJson);
}

export async function createEdge(sourceId: string, targetId: string, weight: number = 1.0, relation: string = "related") {
    // Check if edge exists
    const existing = await prisma.graphEdge.findFirst({
        where: { sourceId, targetId }
    });

    if (existing) {
        return prisma.graphEdge.update({
            where: { id: existing.id },
            data: { weight }
        });
    }

    return prisma.graphEdge.create({
        data: { sourceId, targetId, weight, relation }
    });
}

export async function findSeedNodes(query: string, limit: number = 3) {
    const embedding = await embedQuery(query);

    const embeddingStr = `[${embedding.join(',')}]`;
    return prisma.$queryRawUnsafe(`
        SELECT id, "sourceId", "sourceType", importance, 1 - (embedding::vector <=> $1::vector) AS score
        FROM "GraphNode"
        ORDER BY embedding::vector <=> $1::vector
        LIMIT $2
    `, embeddingStr, limit);
}

export async function expandGraph(nodeIds: string[]) {
    if (nodeIds.length === 0) return [];

    return prisma.graphEdge.findMany({
        where: {
            OR: [
                { sourceId: { in: nodeIds } },
                { targetId: { in: nodeIds } }
            ]
        },
        include: {
            source: { select: { id: true, sourceId: true, sourceType: true, importance: true } },
            target: { select: { id: true, sourceId: true, sourceType: true, importance: true } }
        }
    });
}

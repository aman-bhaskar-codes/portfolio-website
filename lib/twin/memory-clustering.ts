/**
 * Memory Graph Clustering Engine
 *
 * Clusters episodic memories into concept nodes that form a
 * dynamic knowledge graph. When a new memory is stored,
 * it is matched against existing clusters via cosine similarity.
 * If no match → a new cluster is created and named by LLM.
 *
 * Provides:
 * - assignToCluster()   → auto-assign memory to best cluster
 * - getTopClusters()    → strongest concept clusters
 * - reinforceCluster()  → boost cluster strength on use
 * - buildClusterContext() → inject cluster awareness into prompts
 */

import { callLLM } from "@/lib/services/llm.service";
import { createEmbedding } from "@/lib/embeddings";
import prisma from "@/lib/prisma";

const SIMILARITY_THRESHOLD = 0.70;

// ────────────────────────────────────────────
// COSINE SIMILARITY (in-process, no pgvector)
// ────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}

// ────────────────────────────────────────────
// CLUSTER ASSIGNMENT
// ────────────────────────────────────────────

/**
 * Assign a memory to the best matching cluster, or create a new one.
 */
export async function assignToCluster(
    memoryId: string,
    memoryContent: string,
    memoryEmbedding: number[],
    memoryType: "episodic" | "semantic" | "behavioral" = "episodic"
): Promise<{ clusterId: string; isNew: boolean; conceptName: string }> {

    // Skip if embedding is empty
    if (!memoryEmbedding || memoryEmbedding.length === 0) {
        try {
            memoryEmbedding = await createEmbedding(memoryContent);
        } catch {
            return { clusterId: "", isNew: false, conceptName: "unembedded" };
        }
    }

    // Find best matching cluster
    const clusters = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id, "conceptName", embedding
        FROM "MemoryCluster"
    `);

    let bestId = "";
    let bestName = "";
    let bestSim = 0;

    for (const cluster of clusters) {
        if (cluster.embedding.length === 0) continue;
        const sim = cosineSimilarity(memoryEmbedding, cluster.embedding);
        if (sim > bestSim) {
            bestSim = sim;
            bestId = cluster.id;
            bestName = cluster.conceptName;
        }
    }

    // Match found
    if (bestSim >= SIMILARITY_THRESHOLD && bestId) {
        await prisma.clusterMembership.upsert({
            where: { clusterId_memoryId: { clusterId: bestId, memoryId } },
            create: { clusterId: bestId, memoryId, memoryType, weight: bestSim },
            update: { weight: bestSim },
        });
        await prisma.memoryCluster.update({
            where: { id: bestId },
            data: { memberCount: { increment: 1 }, strength: { increment: 0.02 } },
        });
        console.log(`[Cluster] Memory attached to "${bestName}" (sim: ${bestSim.toFixed(2)})`);
        return { clusterId: bestId, isNew: false, conceptName: bestName };
    }

    // No match — create new cluster
    const concept = await generateClusterConcept(memoryContent);
    const embeddingStr = `[${memoryEmbedding.join(',')}]`;
    const newClusterIds = await prisma.$queryRawUnsafe<any[]>(`
        INSERT INTO "MemoryCluster" ("id", "conceptName", "summary", "embedding", "strength", "memberCount", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3::vector, 1.0, 1, NOW())
        RETURNING id
    `, concept.conceptName, concept.summary, embeddingStr);

    const newClusterId = newClusterIds[0].id;

    await prisma.clusterMembership.create({
        data: { clusterId: newClusterId, memoryId, memoryType, weight: 1.0 },
    });

    console.log(`[Cluster] New cluster created: "${concept.conceptName}"`);
    return { clusterId: newClusterId, isNew: true, conceptName: concept.conceptName };
}

// ────────────────────────────────────────────
// CONCEPT GENERATION
// ────────────────────────────────────────────

async function generateClusterConcept(
    content: string
): Promise<{ conceptName: string; summary: string }> {
    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b",
            system: `You are labeling a memory cluster for an Autonomous Systems Architect AI.

Summarize the core recurring theme in one concise concept name and a short architectural description.

Return JSON ONLY:
{
  "conceptName": "3-5 word concept title",
  "summary": "1-2 sentence architectural description"
}`,
            user: content.slice(0, 800),
            json: true,
        });

        return {
            conceptName: result.conceptName || "Uncategorized Concept",
            summary: result.summary || content.slice(0, 200),
        };
    } catch {
        return {
            conceptName: "Uncategorized Concept",
            summary: content.slice(0, 200),
        };
    }
}

// ────────────────────────────────────────────
// CLUSTER QUERIES
// ────────────────────────────────────────────

/**
 * Get strongest concept clusters.
 */
export async function getTopClusters(limit = 10) {
    return prisma.memoryCluster.findMany({
        where: { strength: { gt: 0.3 } },
        orderBy: { strength: "desc" },
        take: limit,
        include: { _count: { select: { members: true } } },
    });
}

/**
 * Reinforce a cluster when it's used in reasoning.
 */
export async function reinforceCluster(clusterId: string) {
    return prisma.memoryCluster.update({
        where: { id: clusterId },
        data: { strength: { increment: 0.05 } },
    });
}

/**
 * Find clusters relevant to a query via embedding similarity.
 */
export async function findRelevantClusters(query: string, limit = 3) {
    try {
        const queryEmbedding = await createEmbedding(query);
        const clusters = await prisma.$queryRawUnsafe<any[]>(`
            SELECT id, "conceptName", summary, embedding, strength 
            FROM "MemoryCluster"
            WHERE strength > 0.3
        `);

        const scored = clusters
            .map((c: { id: string; conceptName: string; summary: string; embedding: number[]; strength: number }) => ({
                ...c,
                score: cosineSimilarity(queryEmbedding, c.embedding) * 0.4 + c.strength * 0.3 + 0.3,
            }))
            .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
            .slice(0, limit);

        return scored;
    } catch {
        return prisma.memoryCluster.findMany({
            where: { strength: { gt: 0.5 } },
            orderBy: { strength: "desc" },
            take: limit,
        });
    }
}

// ────────────────────────────────────────────
// CLUSTER CONTEXT INJECTION
// ────────────────────────────────────────────

/**
 * Build cluster-aware context for prompt injection.
 */
export async function buildClusterContext(query?: string): Promise<string> {
    const clusters = query
        ? await findRelevantClusters(query, 5)
        : await getTopClusters(5);

    if (clusters.length === 0) return "";

    const lines = clusters.map(
        (c: { conceptName: string; summary: string; strength: number }) =>
            `• [${c.strength.toFixed(1)}] ${c.conceptName}: ${c.summary.slice(0, 150)}`
    );

    return `DOMINANT CONCEPT CLUSTERS:\n${lines.join("\n")}`;
}

// ────────────────────────────────────────────
// CLUSTER STATS
// ────────────────────────────────────────────

export async function getClusterStats() {
    const total = await prisma.memoryCluster.count();
    const strong = await prisma.memoryCluster.count({ where: { strength: { gte: 0.7 } } });
    const memberships = await prisma.clusterMembership.count();

    const topClusters = await prisma.memoryCluster.findMany({
        orderBy: { strength: "desc" },
        take: 5,
        select: { conceptName: true, strength: true, memberCount: true },
    });

    return { total, strong, memberships, topClusters };
}

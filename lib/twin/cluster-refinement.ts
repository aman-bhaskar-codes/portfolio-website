/**
 * Cluster Refinement Engine — Nightly Maintenance
 *
 * 1. Merge similar clusters (similarity > 0.85)
 * 2. Decay unused clusters (strength × 0.97)
 * 3. Prune dead clusters (strength < 0.2, 0 members)
 * 4. Recompute cluster embeddings from member centroids
 */

import prisma from "@/lib/prisma";

export interface RefinementResult {
    merged: number;
    decayed: number;
    pruned: number;
    recomputed: number;
}

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

export async function runClusterRefinement(): Promise<RefinementResult> {
    console.log("[Refinement] 🔧 Starting cluster refinement...");

    let merged = 0;
    let decayed = 0;
    let pruned = 0;
    let recomputed = 0;

    // ── Step 1: Merge similar clusters ──
    const clusters = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id, "conceptName", embedding, strength, "memberCount"
        FROM "MemoryCluster"
    `);

    const mergedIds = new Set<string>();
    for (let i = 0; i < clusters.length; i++) {
        if (mergedIds.has(clusters[i].id)) continue;
        for (let j = i + 1; j < clusters.length; j++) {
            if (mergedIds.has(clusters[j].id)) continue;
            if (clusters[i].embedding.length === 0 || clusters[j].embedding.length === 0) continue;

            const sim = cosineSimilarity(clusters[i].embedding, clusters[j].embedding);
            if (sim > 0.85) {
                // Merge j into i (keep the stronger one)
                const [keep, absorb] = clusters[i].strength >= clusters[j].strength
                    ? [clusters[i], clusters[j]]
                    : [clusters[j], clusters[i]];

                // Move memberships from absorb to keep
                await prisma.clusterMembership.updateMany({
                    where: { clusterId: absorb.id },
                    data: { clusterId: keep.id },
                });

                // Update strength and member count
                await prisma.memoryCluster.update({
                    where: { id: keep.id },
                    data: {
                        strength: Math.min(2.0, keep.strength + absorb.strength * 0.5),
                        memberCount: keep.memberCount + absorb.memberCount,
                    },
                });

                // Delete absorbed cluster
                await prisma.memoryCluster.delete({ where: { id: absorb.id } });
                mergedIds.add(absorb.id);
                merged++;

                console.log(`[Refinement] Merged "${absorb.conceptName}" → "${keep.conceptName}" (sim: ${sim.toFixed(2)})`);
            }
        }
    }

    // ── Step 2: Decay unused clusters ──
    const decayCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const decayResult = await prisma.memoryCluster.updateMany({
        where: { updatedAt: { lt: decayCutoff } },
        data: { strength: { multiply: 0.97 } },
    });
    decayed = decayResult.count;

    // ── Step 3: Prune dead clusters ──
    const pruneResult = await prisma.memoryCluster.deleteMany({
        where: { strength: { lt: 0.2 }, memberCount: { lte: 0 } },
    });
    pruned = pruneResult.count;

    // ── Step 4: Recompute embeddings for clusters with members ──
    const activeClusters = await prisma.memoryCluster.findMany({
        where: { memberCount: { gt: 0 } },
        include: { members: { select: { memoryId: true, memoryType: true } } },
    });

    for (const cluster of activeClusters) {
        const episodicIds = cluster.members
            .filter((m: { memoryType: string }) => m.memoryType === "episodic")
            .map((m: { memoryId: string }) => m.memoryId);

        if (episodicIds.length === 0) continue;

        // Use raw query because embedding is Unsupported("vector(768)")
        const episodes: any[] = await prisma.$queryRawUnsafe(`
            SELECT embedding::text FROM "EpisodicMemory" WHERE id = ANY($1::text[])
        `, episodicIds);

        const validEmbeddings = episodes
            .map((e: any) => {
                try {
                    const nums = e.embedding?.replace(/[\[\]]/g, '').split(',').map(Number);
                    return nums && nums.length > 0 ? nums : null;
                } catch { return null; }
            })
            .filter(Boolean) as number[][];

        if (validEmbeddings.length === 0) continue;

        // Compute centroid
        const dim = validEmbeddings[0].length;
        const centroid = new Array(dim).fill(0);
        for (const ep of validEmbeddings) {
            for (let i = 0; i < dim; i++) {
                centroid[i] += ep[i];
            }
        }
        for (let i = 0; i < dim; i++) {
            centroid[i] /= validEmbeddings.length;
        }

        const centroidStr = `[${centroid.join(',')}]`;
        await prisma.$executeRawUnsafe(`
            UPDATE "MemoryCluster" SET embedding = $1::vector WHERE id = $2
        `, centroidStr, cluster.id);
        recomputed++;
    }

    console.log(
        `[Refinement] ✅ Done — ${merged} merged, ${decayed} decayed, ${pruned} pruned, ${recomputed} recomputed`
    );

    return { merged, decayed, pruned, recomputed };
}

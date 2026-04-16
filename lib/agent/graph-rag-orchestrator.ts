import { callLLM } from "@/lib/services/llm.service";
import { findSeedNodes, expandGraph } from "@/lib/services/graph.service";
import prisma from "@/lib/prisma";

export async function graphAwareRAG(query: string, userId?: string) {
    // 1. Seed Node Retrieval
    const seeds = (await findSeedNodes(query, 3)) as any[];

    // 2. Graph Expansion (1-hop)
    const seedIds = seeds.map((s: any) => s.id);
    const edges = await expandGraph(seedIds);

    // 3. Node Scoring & Ranking
    const relevantNodes = new Map<string, any>(); // Simple PageRank-lite: Score = Seed Importance + Edge Weights
    const scores = new Map<string, number>();

    // Add seeds
    seeds.forEach((s: any) => {
        scores.set(s.id, (scores.get(s.id) || 0) + (s.importance || 1.0));
        relevantNodes.set(s.id, { ...s, score: (s.score || 0) * 1.0, type: 'seed' });
    });

    // Add neighbors with decay
    edges.forEach((edge: any) => {
        const neighbor = seedIds.includes(edge.sourceId) ? edge.target : edge.source;
        const existing = relevantNodes.get(neighbor.id);

        // Simple scoring: Weight * Importance * Decay
        const edgeScore = (edge.weight * 0.5) * (neighbor.importance || 1.0);

        if (!existing || existing.score < edgeScore) {
            relevantNodes.set(neighbor.id, { ...neighbor, score: edgeScore, type: 'neighbor', relation: edge.relation });
        }
    });

    const topNodes = Array.from(relevantNodes.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);

    // 4. Context Assembly
    const contentMap = await fetchNodeContent(topNodes);

    // Build Prompt Context
    let contextStr = "";
    topNodes.forEach(node => {
        const content = contentMap.get(node.sourceId);
        if (content) {
            contextStr += `[${node.sourceType.toUpperCase()}: ${node.sourceId}] (Relevance: ${node.score.toFixed(2)})\n${content}\n\n`;
        }
    });

    // 5. Reasoning
    const systemPrompt = `
You remain a helpful AI assistant, but now with GRAPH CONTEXT.
The provided context is a network of connected knowledge nodes.

Structure your answer:
1. Direct Answer
2. Connected Concepts (if any graph edges explain "Why")
3. Deep Insight

GRAPH CONTEXT:
${contextStr}
`;

    const answer = await callLLM({
        model: "qwen2.5:3b",
        system: systemPrompt,
        user: query
    });

    return {
        answer,
        nodes: topNodes.map(n => n.sourceId)
    };
}

async function fetchNodeContent(nodes: any[]) {
    const ids = nodes.map(n => n.sourceId).filter(Boolean);
    const contentMap = new Map<string, string>();

    // Fetch Projects
    // We assume sourceId is slug for projects
    try {
        const projects = await prisma.project.findMany({
            where: { slug: { in: ids } },
            select: { slug: true, description: true, content: true }
        });

        projects.forEach((p: any) => {
            contentMap.set(p.slug!, `Title: ${p.slug}\nSummary: ${p.description}\n${p.content?.slice(0, 500)}...`);
        });
    } catch (error) {
        console.error("Error fetching projects:", error);
    }


    // Fetch Knowledge (if we had specific knowledge nodes separate from projects)
    // For now, we assume graph nodes point to Projects primarily as per user instruction.

    return contentMap;
}

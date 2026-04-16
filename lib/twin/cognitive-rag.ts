
import { classifyIntent } from "./intent";
import { compressContext } from "./compression";
import { findSeedNodes, expandGraph } from "@/lib/services/graph.service";
import prisma from "@/lib/prisma";
import { embedQuery } from "@/lib/services/embedding.service";
import { callLLM } from "@/lib/services/llm.service";

export async function advancedHierarchicalGraphRetrieve(query: string, intent: string) {
    // 1. Keyword/Vector Search (Seed Retrieval) with Section Filtering
    const embedding = await embedQuery(query);

    let whereClause = "";
    // Note: In a real production DB, we'd query JSONB metadata. 
    // Prisma queryRawUnsafe allows us to add arbitrary WHERE clauses if needed.
    // For now, we stick to vector similarity as the primary filter.

    const embeddingStr = `[${embedding.join(',')}]`;
    const knowledge = await prisma.$queryRawUnsafe(`
        SELECT content, metadata, 1 - (embedding::vector <=> $1::vector) as similarity
        FROM "Knowledge"
        ORDER BY similarity DESC
        LIMIT 10
    `, embeddingStr);

    // 2. Graph Expansion
    let graphContext: string[] = [];
    const seedNodes = (await findSeedNodes(query, 3)) as any[];

    // De-duplicate node IDs
    const uniqueNodeIds = Array.from(new Set(
        seedNodes.filter(n => n.id).map(n => n.id)
    )) as string[];

    if (uniqueNodeIds.length > 0) {
        // expandGraph takes string[] and returns edges
        const edges = await expandGraph(uniqueNodeIds);

        // Extract content from connected nodes
        for (const edge of edges) {
            // Add connected node content
            if (uniqueNodeIds.includes(edge.sourceId) && edge.target.sourceType) {
                graphContext.push(JSON.stringify(edge.target));
            } else if (uniqueNodeIds.includes(edge.targetId) && edge.source.sourceType) {
                graphContext.push(JSON.stringify(edge.source));
            }
        }
    }

    // 3. Synthesis & Reranking
    const rawChunks = [
        ...(knowledge as any[]).map(k => k.content),
        ...graphContext
    ];
    const distinctChunks = Array.from(new Set(rawChunks));

    console.log(`[RAG] Intent: ${intent}, Initial Chunks: ${distinctChunks.length}`);

    if (distinctChunks.length === 0) return "";

    // LLM Reranking (Phase 4)
    // We ask the small model to pick the top 5 most relevant chunks
    try {
        const numberedChunks = distinctChunks.map((c, i) => `${i}: ${c.substring(0, 150)}...`).join("\n");
        const rankingResponse = await callLLM({
            model: "qwen2.5:1.5b", // Fast model for reranking
            system: "You are a relevance ranking engine.",
            user: `Query: ${query}\nIntent: ${intent}\n\nChunks:\n${numberedChunks}\n\nReturn ONLY the indices of the top 5 most relevant chunks to the query, as a comma-separated list (e.g. 0, 2, 4).`
        });

        const indices = rankingResponse.replace(/[^\d,]/g, "").split(",").map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));

        let rankedChunks = indices.map((i: number) => distinctChunks[i]).filter((c: string) => c !== undefined);

        // Fallback if re-ranking failed (returned no valid indices)
        if (rankedChunks.length === 0) rankedChunks = distinctChunks.slice(0, 5);

        console.log(`[RAG] Reranked to ${rankedChunks.length} chunks`);

        // 4. Compress (Phase 5)
        const compressed = await compressContext(rankedChunks, intent);
        return compressed;

    } catch (e) {
        console.warn("[RAG] Reranking failed, using default order", e);
        return await compressContext(distinctChunks.slice(0, 5), intent);
    }
}

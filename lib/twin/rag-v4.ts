
import { callLLM } from "@/lib/services/llm.service";
import { embedQuery } from "@/lib/services/embedding.service";
import { findSeedNodes, expandGraph } from "@/lib/services/graph.service";
import prisma from "@/lib/prisma";
import { compressContext } from "./compression";

// Elite RAG v4: The complete pipeline
export async function eliteRagPipeline(query: string, intent: string) {
    console.log(`[RAG v4] Starting pipeline for: "${query}" with intent: ${intent}`);

    // 1. Query Rewriting (Pre-processing)
    const rewrittenQuery = await rewriteQuery(query);
    console.log(`[RAG v4] Rewritten: "${rewrittenQuery}"`);

    // 2. Hybrid Retrieval (Vector + Keyword)
    const chunks = await hybridRetrieve(rewrittenQuery, intent);
    console.log(`[RAG v4] Retrieved ${chunks.length} chunks`);

    // 3. Graph Expansion
    // Extract IDs from chunks metadata if possible, or use query seeds
    const graphChunks = await performGraphExpansion(rewrittenQuery, chunks);
    console.log(`[RAG v4] Expanded graph with ${graphChunks.length} nodes`);

    // 4. Merge & Deduplicate
    const allChunks = Array.from(new Set([...chunks.map(c => c.content), ...graphChunks]));

    // 5. LLM Reranking
    const reranked = await llmRerank(allChunks, rewrittenQuery);
    console.log(`[RAG v4] Reranked top ${reranked.length}`);

    // 6. Context Compression
    const compressed = await compressContext(reranked, intent);

    return {
        context: compressed,
        rewrittenQuery
    };
}

// Step 1: Query Rewriter
async function rewriteQuery(query: string) {
    return callLLM({
        model: "qwen2.5:1.5b",
        system: "You are a query optimization engine. Rewrite the user's query to be precise, technical, and optimal for vector retrieval. Remove conversational filler. Return ONLY the rewritten query.",
        user: query
    });
}

import { KnowledgeOrchestrator } from "@/lib/services/knowledge-orchestrator";

// Step 2: Hybrid Retrieval
async function hybridRetrieve(query: string, intent: string) {
    const orchestrator = KnowledgeOrchestrator.getInstance();

    // Orchestrator handles the hybrid logic internally now
    // We pass intent to help filter if needed
    const chunks = await orchestrator.retrieve(query, { intent });

    // Keyword Search (Exact Match) - Simple implementation
    // In critical systems, use distinct search then merge using Reciprocal Rank Fusion (RRF)
    // For now, we append high-match keyword results if they differ.
    // Using prisma contains for basic keyword match
    const keywordResults = await prisma.knowledge.findMany({
        where: {
            content: { contains: query.split(" ").filter(w => w.length > 5)[0] || query } // Match longest word if query complex
        },
        take: 4
    });

    return [
        ...(chunks as any[]),
        ...keywordResults
    ];
}

// Step 3: Graph Expansion
async function performGraphExpansion(query: string, seedChunks: any[]) {
    // Basic idea: Get seed nodes from query OR from retrieved chunks metadata
    // For now, use query seeds
    const seedNodes = (await findSeedNodes(query, 2)) as any[];
    const ids = seedNodes.map(n => n.id).filter(id => id) as string[];

    if (ids.length === 0) return [];

    const edges = await expandGraph(ids);
    const context: string[] = [];

    for (const edge of edges) {
        if (edge.target?.sourceType) context.push(`[Graph Linked]: ${(edge.target as any).sourceId || edge.target.sourceType}`);
    }

    return context.slice(0, 5); // Limit expansion
}

// Step 5: LLM Rerank
async function llmRerank(chunks: string[], query: string) {
    if (chunks.length <= 5) return chunks;

    try {
        const numbered = chunks.map((c, i) => `[${i}] ${c.substring(0, 150)}...`).join("\n");
        const response = await callLLM({
            model: "qwen2.5:1.5b",
            system: "You are a relevance ranking system.",
            user: `Query: ${query}\n\nCandidate Chunks:\n${numbered}\n\nIdentify the top 5 most relevant chunks. Return their indices as a comma-separated list (e.g. 0, 2, 4).`
        });

        const indices = response.replace(/[^\d,]/g, "").split(",").map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));

        const ranked = indices.map((i: number) => chunks[i]).filter((c: any) => c);
        return ranked.length > 0 ? ranked : chunks.slice(0, 5);
    } catch (e) {
        console.warn("Rerank failed", e);
        return chunks.slice(0, 5);
    }
}

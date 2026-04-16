import { findSeedNodes, expandGraph } from "@/lib/services/graph.service";
import { callLLMStream } from "@/lib/services/llm.service";

const voiceSystemPrompt = `
You are Aman's Digital Twin.

You speak clearly and calmly.
You respond in structured spoken format.
Use short paragraphs.
Avoid overly long sentences.
Do not hallucinate.
If unsure, say clearly.

Always structure spoken responses like this:

1. Brief direct answer.
2. Explanation.
3. Optional strategic insight.

Example 1:
User: How does your RAG system work?

Twin:
The retrieval system is graph-aware.

It first identifies relevant knowledge nodes, expands connected relationships, and ranks them by importance.

This ensures structured and context-rich reasoning instead of isolated retrieval.

Example 2:
User: What are your current goals?

Twin:
My current goal is improving the Digital Twin architecture.

I am optimizing retrieval scoring, memory weighting, and reflection loops.

The objective is to increase reasoning consistency and long-term adaptation.

Now respond naturally.
`;

export async function voiceRAG(query: string, userId?: string) {
    // 1. Retrieve Knowledge (Graph-Aware)
    console.log(`[Voice RAG] Retrieving context for: ${query}`);

    // Seed Search
    const seedNodes = (await findSeedNodes(query, 3)) as any[];

    // Expand (1-hop)
    let contextNodes: any[] = [...seedNodes];
    for (const node of seedNodes) {
        if (node.id) {
            const expansion = (await expandGraph([node.id])) as any[];
            contextNodes = [...contextNodes, ...expansion];
        }
    }

    // Deduplicate
    const uniqueNodes = Array.from(new Map(contextNodes.map(item => [item.id, item])).values());

    // Format Context
    const context = uniqueNodes
        .map(n => `[${n.sourceType}] ${n.metadata?.title || 'Unknown'}: ${n.content?.slice(0, 300)}...`)
        .join("\n\n")
        .slice(0, 5000); // Cap context

    // 2. Stream Response
    const stream = await callLLMStream({
        model: "qwen2.5:3b", // Preferred local model
        system: voiceSystemPrompt,
        context,
        user: query
    });

    return stream;
}

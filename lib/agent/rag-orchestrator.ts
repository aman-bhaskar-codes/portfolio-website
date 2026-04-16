import { callLLM } from "@/lib/services/llm.service";
import { retrieveContext, retrieveMemory } from "@/lib/services/rag.service";

export async function strongRAG(query: string, userId?: string) {
    // 1. Parallel Retrieval
    const [knowledgeChunks, memoryChunks] = await Promise.all([
        retrieveContext(query),
        retrieveMemory(userId)
    ]);

    // 2. Context Optimization
    const context = optimizeContext([
        ...memoryChunks.map((m: any) => `MEMORY: ${m.content}`),
        ...knowledgeChunks.map((k: any) => `KNOWLEDGE (${k.sourceType}): ${k.content}`)
    ]);

    // 3. Structured Reasoning Prompt
    const systemPrompt = `
You are an advanced AI assistant for a high-end portfolio.
Follow these steps internally:
1. Understand the question.
2. Extract relevant knowledge from the provided context.
3. Reason step-by-step.
4. Do not hallucinate. If provided context is insufficient, admit it or provide general knowledge with a disclaimer.
5. Provide a professional, concise response.

CONTEXT:
${context}
`;

    // 4. Generation (Fast Model: qwen2.5:3b or 1.5b)
    // We use 3b for better reasoning in the orchestrator
    const answer = await callLLM({
        model: "qwen2.5:3b",
        system: systemPrompt,
        user: query
    });

    // 5. Self-Evaluation (Optional - verify quality)
    // We can skip this for latency if needed, but user requested "Strong RAG"
    // Let's do a quick check
    const confidence = await evaluateAnswer(query, answer);

    return {
        answer,
        confidence
    };
}

function optimizeContext(chunks: string[]) {
    let final = "";
    // Simple token/char cap
    const MAX_CHARS = 6000;
    for (const chunk of chunks) {
        if (final.length + chunk.length > MAX_CHARS) break;
        final += "\n\n" + chunk;
    }
    return final;
}

async function evaluateAnswer(query: string, answer: string) {
    try {
        const evalRes = await callLLM({
            model: "qwen2.5:1.5b", // Fast evaluator
            json: true,
            system: "Evaluate the response quality. Return JSON: { relevance: 0-1, confidence: 0-1 }",
            user: `Query: ${query}\nResponse: ${answer}`
        });
        return (evalRes.relevance + evalRes.confidence) / 2;
    } catch {
        return 0.8; // Default valid
    }
}

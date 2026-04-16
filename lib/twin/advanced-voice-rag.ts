import { detectEmotion } from "./emotion";
import { buildVoicePrompt } from "./tone";
import { findSeedNodes, expandGraph } from "@/lib/services/graph.service";
import { retrieveConversationMemory, storeConversation } from "./memory";
import { callLLMStream } from "@/lib/services/llm.service";

export const advancedVoiceTwin = async (query: string, identifier: { userId?: string, visitorId?: string }) => {
    // 1. Parallel: Emotion Detection & Context Retrieval
    const [emotion, memory] = await Promise.all([
        detectEmotion(query),
        retrieveConversationMemory(identifier, query, 3)
    ]);

    // 2. Graph Retrieval
    const seedNodes = (await findSeedNodes(query, 3)) as any[];
    let contextNodes: any[] = [...seedNodes];
    for (const node of seedNodes) {
        if (node.id) {
            const expansion = (await expandGraph([node.id])) as any[];
            contextNodes = [...contextNodes, ...expansion];
        }
    }
    const uniqueNodes = Array.from(new Map(contextNodes.map(item => [item.id, item])).values());

    // 3. Construct Context
    const conversationContext = memory.map((m: any) => `[Past ${m.role}]: ${m.content}`).join("\n");
    const knowledgeContext = uniqueNodes.map(n => `[Knowledge]: ${n.content?.slice(0, 300)}`).join("\n");

    // Customize Identity based on User vs Visitor?
    // If visitor, maybe be more "Public Representative".
    const identityContext = identifier.userId
        ? "You are speaking to your Creator (Aman). Be helpful, obedient, and strategic."
        : "You are speaking to a Visitor. Be welcoming, informative, and represent Aman professionally.";

    const context = `
CONTEXT:
${identityContext}

RELEVANT PAST CONVERSATIONS:
${conversationContext}

KNOWLEDGE GRAPH DATA:
${knowledgeContext}
`.slice(0, 6000);

    // 4. Construct Prompt
    const basePrompt = `
You are Aman's Digital Twin.
You are a highly advanced autonomous intelligence.

Core Instructions:
- Speak clearly and concisely.
- Use short paragraphs suitable for speech synthesis.
- Do not read code blocks out loud (summarize them).
- Be helpful and precise.
- If asked about yourself, explain you are an AI Twin running on Aman's portfolio.
`;

    const finalPrompt = buildVoicePrompt(basePrompt, emotion.tone);

    // 5. Stream Response
    const stream = await callLLMStream({
        model: "qwen2.5:3b",
        system: finalPrompt,
        context,
        user: query
    });

    // 6. Async: Store User Query
    storeConversation(identifier, "user", query);

    const [stream1, stream2] = stream.tee();

    // Background saver
    (async () => {
        const reader = stream2.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            fullResponse += decoder.decode(value, { stream: true });
        }
        if (fullResponse.trim()) {
            await storeConversation(identifier, "assistant", fullResponse);
        }
    })();

    return { stream: stream1, emotion };
};

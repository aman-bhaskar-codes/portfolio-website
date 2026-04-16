
import { classifyIntent } from "./intent";
import { buildElitePrompt } from "./system-prompt";
import { getIdentity, buildIdentityContext } from "./identity";
import { eliteRagPipeline } from "./rag-v4";
import { retrieveConversationMemory, storeConversation } from "./memory";
import { retrieveStrategicMemory } from "./memory-intelligence";
import { detectEmotion } from "./emotion";
import { buildVoicePrompt } from "./tone";
import { callLLMStream } from "@/lib/services/llm.service";
import { selfEvaluate, calibrateBehavior } from "./behavior";

export async function refinedVoiceTwin(query: string, identifier: { userId?: string, visitorId?: string }) {
    // 1. Parallel Intelligence Gathering
    const [intent, identity, emotion, memory, strategicMemory] = await Promise.all([
        classifyIntent(query),
        getIdentity(),
        detectEmotion(query),
        retrieveConversationMemory(identifier, query, 3),
        retrieveStrategicMemory()
    ]);

    // 2. Cognitive Retrieval (RAG v4)
    // Use intent to guide retrieval
    const { context: rawKnowledge, rewrittenQuery } = await eliteRagPipeline(query, intent);

    // 3. Context Synthesis
    const identityContext = buildIdentityContext(identity);

    const context = `
IDENTITY & PRINCIPLES:
${identityContext}

STRATEGIC GOALS:
${strategicMemory}

RELEVANT MEMORY:
${memory.map(m => `[${m.role}]: ${m.content}`).join("\n")}

KNOWLEDGE BASE (Compressed, Rewritten: "${rewrittenQuery}"):
${rawKnowledge}
`.slice(0, 8000); // Expanded context window

    // 4. Prompt Engineering (Elite System Layer)
    const finalPrompt = buildElitePrompt(intent, emotion.tone);

    // 5. Stream Generation
    const stream = await callLLMStream({
        model: "qwen2.5:3b",
        system: finalPrompt,
        context,
        user: query
    });

    // 6. Async Background Processing (Self-Correction & Storage)
    const [stream1, stream2] = stream.tee();

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
            // A. Store Memory
            await storeConversation(identifier, "assistant", fullResponse);

            // B. Self-Reflection (Async)
            // We don't block the voice stream, but we learn from it.
            const evaluation = await selfEvaluate(fullResponse, context);
            if (evaluation.identity_consistency < 0.7) {
                console.warn("[Twin] Identity Drift Detected. Calibrating...");
                await calibrateBehavior("identity_drift", "Reinforce core principles in next turn.");
            }
        }
    })();

    // INJECT HEADERS
    // We need to return a stream that starts with the JSON header
    // The frontend expects __END_HEADER__\n separator.

    // We can't just return { stream, emotion } because Next.js route needs to return Response.
    // The route handler (api/twin/voice/route.ts) handles the wrapping?
    // Let's check api/twin/voice/route.ts.

    // If api/twin/voice/route.ts just returns `new Response(stream)`, we lose the headers.
    // We should modify refinedVoiceTwin to return the stream, and let the route handler prepend headers?
    // OR we modify the stream here to inject headers.

    // Let's return the metadata separately, and fix the route handler to inject them.
    return { stream: stream1, emotion, intent };
}

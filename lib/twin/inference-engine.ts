
import { classifyIntent } from "./intent";
import { getIdentity, buildIdentityContext, IdentityProfile } from "./identity";
import { InferenceRouter } from "@/lib/services/inference-router"; // New Router
import { retrieveConversationMemory, storeConversation } from "./memory";
import { retrieveStrategicMemory, storeStrategicGoal } from "./memory-intelligence";
import { detectEmotion } from "./emotion";
import { buildVoicePrompt } from "./tone";
import { callLLMStream } from "@/lib/services/llm.service";
import { selfEvaluate, calibrateBehavior } from "./behavior";
import { buildElitePrompt } from "./system-prompt";

// Replaces refinedVoiceTwin with the Intelligent Routed Version
export async function refinedVoiceTwin(query: string, identifier: { userId?: string, visitorId?: string }) {
    // 1. Parallel Intelligence Gathering
    const [intent, identity, emotion, memory, strategicMemory] = await Promise.all([
        classifyIntent(query), // We still classify for metadata
        getIdentity(),
        detectEmotion(query),
        retrieveConversationMemory(identifier, query, 3),
        retrieveStrategicMemory()
    ]);

    // 2. Intelligent Routing (The Decision Engine)
    const router = InferenceRouter.getInstance();
    const routeDecision = await router.route(query);
    console.log(`[Twin] Routing Decision: ${routeDecision.source} (${routeDecision.reasoning})`);

    // 3. Execution (Get Context based on Route)
    const executionResult = await router.execute(query, routeDecision);
    const knowledgeContext = executionResult?.context || "";

    // 4. Context Synthesis
    const identityContext = buildIdentityContext(identity);

    // Build Context strictly based on Route
    let context = "";
    if (routeDecision.source === "BASE") {
        context = `
IDENTITY & PRINCIPLES:
${identityContext}

STRATEGIC GOALS:
${strategicMemory}

RELEVANT MEMORY:
${memory.map(m => `[${m.role}]: ${m.content}`).join("\n")}
        `;
    } else {
        context = `
IDENTITY & PRINCIPLES:
${identityContext}

STRATEGIC GOALS:
${strategicMemory}

RELEVANT MEMORY:
${memory.map(m => `[${m.role}]: ${m.content}`).join("\n")}

KNOWLEDGE BASE (${routeDecision.source} Mode):
${knowledgeContext}
        `.slice(0, 8000);
    }

    // 5. Prompt Engineering (Elite System Layer)
    // We append the routing reasoning to the system prompt so the model knows WHY it's answering this way.
    const baseElite = buildElitePrompt(intent, emotion.tone);
    const finalPrompt = `
${baseElite}

INTERNAL REASONING TRACE:
- Intent: ${routeDecision.intent}
- Source Selected: ${routeDecision.source}
- Reasoning: ${routeDecision.reasoning}
- Confidence: ${routeDecision.confidence}%
`;

    // 6. Stream Generation
    const stream = await callLLMStream({
        model: "qwen2.5:3b",
        system: finalPrompt,
        context,
        user: query
    });

    // 7. Async Background Processing (Self-Correction & Storage)
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
            await storeConversation(identifier, "assistant", fullResponse);

            // Self-Correction
            if (routeDecision.source === "RAG") {
                const evaluation = await selfEvaluate(fullResponse, context);
                if (evaluation.identity_consistency < 0.7) {
                    await calibrateBehavior("identity_drift", "Reinforce core principles.");
                }
            }
        }
    })();

    // INJECT HEADERS
    // We pass the new routing metadata to the frontend
    return {
        stream: stream1,
        emotion,
        intent,
        router: routeDecision // Pass router decision to UI!
    };
}

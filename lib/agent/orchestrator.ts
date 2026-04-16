/**
 * Orchestrator — Multi-Model AI Pipeline Coordinator
 *
 * Unified entry point for all AI interactions:
 *   1. Selects model via router
 *   2. Calls LLM with appropriate config
 *   3. Optionally runs self-evaluation (fire-and-forget)
 *   4. Returns result with full metadata
 *
 * Used by the chat route for both streaming and non-streaming paths.
 */

import { selectModel, type ModelSelection } from "./router";
import { getModelConfig, type ModelTier } from "./models";
import { callLLMSync } from "@/services/ollama";
import prisma from "@/lib/prisma";

export interface OrchestrationResult {
    modelSelection: ModelSelection;
    evalScore?: number;
    evalFlag?: "strong" | "acceptable" | "weak";
}

/**
 * Analyzes query and returns model selection + config.
 * The caller (chat route) handles the actual Ollama call for streaming control.
 */
export function analyzeAndRoute(query: string): ModelSelection {
    const selection = selectModel(query);
    console.log(
        `[ORCHESTRATOR] ${selection.tier} → ${selection.model} | ${selection.reasoning}`
    );
    return selection;
}

/**
 * Fire-and-forget self-evaluation.
 * Uses the EVAL model to score response quality.
 * Stores result in analytics — never blocks the response.
 */
export function runSelfEvaluation(
    query: string,
    response: string,
    analyticsId?: string
): void {
    // Don't evaluate very short responses or errors
    if (response.length < 20) return;

    const evalConfig = getModelConfig("EVAL");

    const evalPromise = callLLMSync(
        [
            {
                role: "system",
                content: `You are a response quality evaluator. Score the AI response on a 0.0-1.0 scale.
Return ONLY valid JSON: {"score": 0.X, "flag": "strong|acceptable|weak"}
Scoring:
- 0.8-1.0 (strong): Accurate, complete, well-structured
- 0.5-0.79 (acceptable): Mostly correct, some gaps
- 0.0-0.49 (weak): Inaccurate, incomplete, or off-topic`,
            },
            {
                role: "user",
                content: `Query: "${query.substring(0, 200)}"\nResponse: "${response.substring(0, 500)}"`,
            },
        ],
        evalConfig.name
    );

    evalPromise
        .then((evalText) => {
            try {
                // Extract JSON from response (handle markdown wrapping)
                const jsonMatch = evalText.match(/\{[^}]+\}/);
                if (!jsonMatch) return;

                const parsed = JSON.parse(jsonMatch[0]);
                const score = Math.min(1, Math.max(0, Number(parsed.score) || 0));
                const flag = ["strong", "acceptable", "weak"].includes(parsed.flag)
                    ? parsed.flag
                    : score >= 0.8 ? "strong" : score >= 0.5 ? "acceptable" : "weak";

                console.log(`[EVAL] Score: ${score.toFixed(2)} | Flag: ${flag}`);

                // Update analytics record if we have an ID
                if (analyticsId) {
                    prisma.analyticsLog
                        .update({
                            where: { id: analyticsId },
                            data: { evalScore: score },
                        })
                        .catch(() => { }); // Silent fail OK
                }
            } catch {
                console.warn("[EVAL] Failed to parse evaluation response");
            }
        })
        .catch(() => {
            console.warn("[EVAL] Self-evaluation call failed (non-blocking)");
        });
}

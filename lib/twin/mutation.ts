/**
 * Twin Policy Mutation Engine
 *
 * Generates and validates policy mutations based on performance data.
 * Mutations are CONTROLLED — only applied if they pass identity validation.
 */

import { callLLM } from "@/lib/services/llm.service";
import { PolicyData, getCurrentPolicy } from "./policy";
import { evaluateResponse, PerformanceMetrics } from "./evaluation";

interface MutationResult {
    proposed: PolicyData;
    reasoning: string;
    valid: boolean;
}

/**
 * Generate a policy mutation based on performance deficiencies.
 */
export async function generatePolicyMutation(
    currentPolicy: PolicyData,
    performanceLogs: any[],
    averages: PerformanceMetrics
): Promise<PolicyData | null> {
    try {
        // Build deficiency report
        const deficiencies: string[] = [];
        if (averages.identity_consistency < 0.8) deficiencies.push(`identity_consistency is low (${averages.identity_consistency.toFixed(2)})`);
        if (averages.architectural_depth < 0.7) deficiencies.push(`architectural_depth is low (${averages.architectural_depth.toFixed(2)})`);
        if (averages.clarity < 0.75) deficiencies.push(`clarity is low (${averages.clarity.toFixed(2)})`);
        if (averages.relevance < 0.75) deficiencies.push(`relevance is low (${averages.relevance.toFixed(2)})`);

        const result = await callLLM({
            model: "qwen2.5:3b",
            system: `You are optimizing an Autonomous Systems Architect AI twin.

Given performance metrics and deficiencies, propose refined behavioral rules.

Return JSON ONLY:
{
  "reasoningRules": "Updated reasoning rules (multiline string)",
  "retrievalStrategy": "Updated retrieval strategy",
  "communicationStyle": "Updated communication style",
  "evaluationRules": "Updated evaluation rules"
}

CRITICAL CONSTRAINTS:
- Do NOT weaken identity. The AI must remain an Autonomous Systems Architect.
- Improve the specific weak metrics identified.
- Keep all existing strong rules. Only ADD or REFINE.
- Be concrete: "Add rule: Always include one tradeoff" not "improve depth".

Few-shot examples:
- If architectural_depth < 0.7: Add rule "Always include at least one tradeoff discussion."
- If clarity < 0.7: Add rule "Limit sentence length to under 20 words."
- If identity_consistency < 0.8: Add rule "Begin responses by framing the architectural context."`,

            user: `Current Policy:
${JSON.stringify(currentPolicy, null, 2)}

Deficiencies Detected:
${deficiencies.join("\n")}

Recent Performance (last ${performanceLogs.length} interactions):
Average relevance: ${averages.relevance.toFixed(2)}
Average clarity: ${averages.clarity.toFixed(2)}
Average identity_consistency: ${averages.identity_consistency.toFixed(2)}
Average architectural_depth: ${averages.architectural_depth.toFixed(2)}`,
            json: true,
        });

        if (!result.reasoningRules) return null;

        return {
            reasoningRules: result.reasoningRules,
            retrievalStrategy: result.retrievalStrategy || currentPolicy.retrievalStrategy,
            communicationStyle: result.communicationStyle || currentPolicy.communicationStyle,
            evaluationRules: result.evaluationRules || currentPolicy.evaluationRules,
            retrievalWeights: currentPolicy.retrievalWeights,
        };
    } catch (e) {
        console.error("[Mutation] Generation error:", e);
        return null;
    }
}

/**
 * Validate a proposed mutation by testing it against a known-good query.
 * Returns true only if the mutated policy produces a response that passes identity checks.
 */
export async function validateMutation(proposed: PolicyData): Promise<MutationResult> {
    const testQueries = [
        "Explain your graph-aware RAG architecture.",
        "What makes your system scalable?",
    ];

    const testQuery = testQueries[Math.floor(Math.random() * testQueries.length)];

    try {
        // Generate response using proposed policy
        const testResponse = await callLLM({
            model: "qwen2.5:3b",
            system: `You are an Autonomous Systems Architect AI. Follow these rules:\n\n${proposed.reasoningRules}\n\n${proposed.communicationStyle}`,
            user: testQuery,
        });

        // Evaluate the test response
        const metrics = await evaluateResponse(testQuery, testResponse);

        const valid =
            metrics.identity_consistency > 0.75 &&
            metrics.clarity > 0.7 &&
            metrics.architectural_depth > 0.65;

        console.log(
            `[Mutation Validator] Query: "${testQuery}" | Identity: ${metrics.identity_consistency.toFixed(2)} | Clarity: ${metrics.clarity.toFixed(2)} | Depth: ${metrics.architectural_depth.toFixed(2)} | Valid: ${valid}`
        );

        return {
            proposed,
            reasoning: valid
                ? "Mutation passed identity + clarity + depth validation."
                : `Mutation REJECTED. Identity: ${metrics.identity_consistency.toFixed(2)}, Clarity: ${metrics.clarity.toFixed(2)}, Depth: ${metrics.architectural_depth.toFixed(2)}`,
            valid,
        };
    } catch (e) {
        console.error("[Mutation Validator] Error:", e);
        return { proposed, reasoning: "Validation error — mutation discarded.", valid: false };
    }
}

/**
 * Check if mutation is needed based on performance thresholds.
 */
export function shouldMutate(averages: PerformanceMetrics): boolean {
    return (
        averages.identity_consistency < 0.8 ||
        averages.architectural_depth < 0.7 ||
        averages.clarity < 0.75 ||
        averages.relevance < 0.75
    );
}

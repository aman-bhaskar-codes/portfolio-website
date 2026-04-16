/**
 * Twin Evolution Orchestrator — The Main Loop
 *
 * Coordinates the full self-evolving policy mutation cycle:
 * 1. Gather recent performance logs
 * 2. Calculate averages
 * 3. Check mutation threshold
 * 4. Generate mutation proposal
 * 5. Validate mutation
 * 6. Apply if valid
 * 7. Store architectural decision in memory
 */

import { getCurrentPolicy, updatePolicy } from "./policy";
import { getRecentPerformanceLogs, getPerformanceAverages } from "./evaluation";
import { generatePolicyMutation, validateMutation, shouldMutate } from "./mutation";
import prisma from "@/lib/prisma";

export interface EvolutionResult {
    evolved: boolean;
    previousVersion: number;
    newVersion?: number;
    reasoning: string;
    averages: {
        relevance: number;
        clarity: number;
        identity_consistency: number;
        architectural_depth: number;
    };
}

/**
 * Run the full evolution cycle. Designed for background job execution.
 */
export async function runEvolutionCycle(): Promise<EvolutionResult> {
    console.log("[Evolution] 🧬 Starting evolution cycle...");

    // Step 1: Gather data
    const logs = await getRecentPerformanceLogs(20);
    const averages = await getPerformanceAverages(20);
    const currentPolicy = await getCurrentPolicy();

    console.log(`[Evolution] Performance averages — Rel: ${averages.relevance.toFixed(2)} | Clarity: ${averages.clarity.toFixed(2)} | Identity: ${averages.identity_consistency.toFixed(2)} | Depth: ${averages.architectural_depth.toFixed(2)}`);

    // Step 2: Check if mutation is needed
    if (!shouldMutate(averages)) {
        console.log("[Evolution] ✅ Performance within acceptable range. No mutation needed.");
        return {
            evolved: false,
            previousVersion: currentPolicy.version,
            reasoning: "All metrics above threshold. System stable.",
            averages,
        };
    }

    console.log("[Evolution] ⚠️ Performance below threshold. Initiating mutation...");

    // Step 3: Generate mutation
    const proposed = await generatePolicyMutation(currentPolicy, logs, averages);
    if (!proposed) {
        return {
            evolved: false,
            previousVersion: currentPolicy.version,
            reasoning: "Mutation generation failed. Maintaining current policy.",
            averages,
        };
    }

    // Step 4: Validate mutation
    const { valid, reasoning } = await validateMutation(proposed);
    if (!valid) {
        console.log(`[Evolution] ❌ Mutation rejected: ${reasoning}`);
        return {
            evolved: false,
            previousVersion: currentPolicy.version,
            reasoning: `Mutation rejected: ${reasoning}`,
            averages,
        };
    }

    // Step 5: Apply mutation
    const newVersion = await updatePolicy(proposed);
    console.log(`[Evolution] 🧬 Policy evolved: v${currentPolicy.version} → v${newVersion}`);

    // Step 6: Store architectural decision in memory
    try {
        await prisma.twinMemory.create({
            data: {
                type: "architectural_decision",
                content: `Policy evolved from v${currentPolicy.version} to v${newVersion}. Reasoning: ${reasoning}. Averages — Identity: ${averages.identity_consistency.toFixed(2)}, Depth: ${averages.architectural_depth.toFixed(2)}, Clarity: ${averages.clarity.toFixed(2)}.`,
                importance: 0.9,
            },
        });
    } catch (e) {
        console.error("[Evolution] Memory storage error:", e);
    }

    return {
        evolved: true,
        previousVersion: currentPolicy.version,
        newVersion,
        reasoning,
        averages,
    };
}

/**
 * Get evolution status summary for the Control Room UI.
 */
export async function getEvolutionStatus() {
    const policy = await getCurrentPolicy();
    const averages = await getPerformanceAverages(20);
    const needsMutation = shouldMutate(averages);

    return {
        currentVersion: policy.version,
        averages,
        needsMutation,
        status: needsMutation ? "MUTATION_PENDING" : "STABLE",
    };
}

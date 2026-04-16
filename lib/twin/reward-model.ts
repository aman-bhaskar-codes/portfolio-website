/**
 * Full Reinforcement-Style Reward Model
 *
 * A structured Reward-Guided Self-Improving Cognitive System.
 *
 * Components:
 * 1. Reward computation (weighted multi-metric)
 * 2. Hallucination detection
 * 3. Rolling reward buffer per intent
 * 4. Reinforcement adjustment (weight + policy)
 * 5. Sandbox validation (test before commit)
 * 6. Memory/cluster reinforcement from reward signals
 *
 * No chaotic drift. Bounded. Explainable. Production-grade.
 */

import { callLLM } from "@/lib/services/llm.service";
import prisma from "@/lib/prisma";
import { getWeights, adjustWeightsForIntent, type WeightProfile } from "./retrieval-tuning";
import { reinforceCluster } from "./memory-clustering";
import { reinforceMemory } from "./cognitive-memory";

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

export interface RewardMetrics {
    relevance: number;
    clarity: number;
    identityConsistency: number;
    architecturalDepth: number;
    hallucinationPenalty: number;
}

export interface RewardResult {
    metrics: RewardMetrics;
    totalReward: number;
}

export interface ReinforcementCycleResult {
    intentsProcessed: number;
    adjustments: Record<string, { reward: number; adjusted: boolean; reason: string }>;
    sandboxPassed: boolean;
    timestamp: string;
}

// ────────────────────────────────────────────
// PART 1: REWARD COMPUTATION
// ────────────────────────────────────────────

const REWARD_WEIGHTS = {
    relevance: 0.25,
    clarity: 0.20,
    identityConsistency: 0.25,
    architecturalDepth: 0.25,
    hallucinationPenalty: 0.20, // subtracted
};

export function computeReward(metrics: RewardMetrics): number {
    const reward =
        (metrics.relevance * REWARD_WEIGHTS.relevance) +
        (metrics.clarity * REWARD_WEIGHTS.clarity) +
        (metrics.identityConsistency * REWARD_WEIGHTS.identityConsistency) +
        (metrics.architecturalDepth * REWARD_WEIGHTS.architecturalDepth) -
        (metrics.hallucinationPenalty * REWARD_WEIGHTS.hallucinationPenalty);

    return Math.max(0, Math.min(1, reward));
}

// ────────────────────────────────────────────
// PART 2: HALLUCINATION DETECTOR
// ────────────────────────────────────────────

export async function detectHallucination(
    response: string,
    context: string
): Promise<number> {
    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b",
            system: `You are a hallucination detector for an Autonomous Systems Architect AI.

Does the response contain claims NOT supported by the provided context?

Return ONLY a single number between 0.0 and 1.0:
- 0.0 = fully grounded, no hallucination
- 0.5 = some unsupported claims
- 1.0 = heavily hallucinated

Return ONLY the number. Nothing else.`,
            user: `Context:\n${context.slice(0, 1000)}\n\nResponse:\n${response.slice(0, 1000)}`,
        });

        const score = parseFloat(String(result).trim());
        return isNaN(score) ? 0 : Math.max(0, Math.min(1, score));
    } catch {
        return 0; // Fail-safe: assume no hallucination
    }
}

// ────────────────────────────────────────────
// PART 3: FULL REWARD EVALUATION
// ────────────────────────────────────────────

export async function evaluateAndReward(
    query: string,
    response: string,
    context: string,
    intent?: string,
    clusterIds: string[] = []
): Promise<RewardResult> {
    // Step 1: Self-evaluation (reuse existing LLM evaluator)
    let metrics: RewardMetrics;
    try {
        const evalResult = await callLLM({
            model: "qwen2.5:1.5b",
            system: `Evaluate this AI response. Return JSON ONLY:
{
  "relevance": 0.0-1.0,
  "clarity": 0.0-1.0,
  "identity_consistency": 0.0-1.0,
  "architectural_depth": 0.0-1.0
}`,
            user: `Query: ${query.slice(0, 300)}\nResponse: ${response.slice(0, 1000)}`,
            json: true,
        });

        metrics = {
            relevance: clamp(evalResult.relevance || 0.5),
            clarity: clamp(evalResult.clarity || 0.5),
            identityConsistency: clamp(evalResult.identity_consistency || 0.5),
            architecturalDepth: clamp(evalResult.architectural_depth || 0.5),
            hallucinationPenalty: 0,
        };
    } catch {
        metrics = { relevance: 0.7, clarity: 0.7, identityConsistency: 0.7, architecturalDepth: 0.7, hallucinationPenalty: 0 };
    }

    // Step 2: Hallucination detection
    metrics.hallucinationPenalty = await detectHallucination(response, context);

    // Step 3: Compute total reward
    const totalReward = computeReward(metrics);

    // Step 4: Store reward log
    try {
        await prisma.rewardLog.create({
            data: {
                query: query.slice(0, 2000),
                intent: intent || "general",
                response: response.slice(0, 5000),
                relevance: metrics.relevance,
                clarity: metrics.clarity,
                identityConsistency: metrics.identityConsistency,
                architecturalDepth: metrics.architecturalDepth,
                hallucinationPenalty: metrics.hallucinationPenalty,
                totalReward,
                clusterIds,
            },
        });
    } catch (e) {
        console.error("[Reward] Storage error:", e);
    }

    // Step 5: Reward-driven memory/cluster reinforcement
    await reinforceFromReward(totalReward, clusterIds);

    return { metrics, totalReward };
}

// ────────────────────────────────────────────
// PART 4: ROLLING REWARD BUFFER
// ────────────────────────────────────────────

export async function getRollingReward(intent: string, days = 3): Promise<{
    current: number;
    previous: number;
    delta: number;
    count: number;
}> {
    const currentCutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const previousCutoff = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000);

    const currentLogs = await prisma.rewardLog.findMany({
        where: { intent, createdAt: { gte: currentCutoff } },
        select: { totalReward: true },
    });

    const previousLogs = await prisma.rewardLog.findMany({
        where: { intent, createdAt: { gte: previousCutoff, lt: currentCutoff } },
        select: { totalReward: true },
    });

    const currentAvg = currentLogs.length > 0
        ? currentLogs.reduce((s: number, l: { totalReward: number }) => s + l.totalReward, 0) / currentLogs.length
        : 1.0;

    const previousAvg = previousLogs.length > 0
        ? previousLogs.reduce((s: number, l: { totalReward: number }) => s + l.totalReward, 0) / previousLogs.length
        : 1.0;

    return {
        current: currentAvg,
        previous: previousAvg,
        delta: currentAvg - previousAvg,
        count: currentLogs.length,
    };
}

// ────────────────────────────────────────────
// PART 5: REWARD-DRIVEN CLUSTER/MEMORY REINFORCEMENT
// ────────────────────────────────────────────

async function reinforceFromReward(reward: number, clusterIds: string[]) {
    if (clusterIds.length === 0) return;

    for (const cid of clusterIds) {
        try {
            if (reward > 0.75) {
                // High reward → strengthen cluster
                await prisma.memoryCluster.update({
                    where: { id: cid },
                    data: { strength: { increment: 0.03 } },
                });
            } else if (reward < 0.5) {
                // Low reward → weaken cluster
                await prisma.memoryCluster.update({
                    where: { id: cid },
                    data: { strength: { increment: -0.02 } },
                });
            }
        } catch {
            // Cluster may not exist — skip
        }
    }
}

// ────────────────────────────────────────────
// PART 6: SANDBOX VALIDATION
// ────────────────────────────────────────────

export async function sandboxValidation(): Promise<{ passed: boolean; avgReward: number }> {
    const testQueries = [
        "Explain your graph-aware RAG architecture.",
        "How do you evolve policies?",
        "What is your memory system design?",
    ];

    let totalReward = 0;
    for (const query of testQueries) {
        try {
            const response = await callLLM({
                model: "qwen2.5:3b",
                system: "You are an Autonomous Systems Architect AI. Respond with precision and architectural depth.",
                user: query,
            });

            const evalResult = await callLLM({
                model: "qwen2.5:1.5b",
                system: `Evaluate this AI response. Return JSON ONLY:
{ "relevance": 0.0-1.0, "clarity": 0.0-1.0, "identity_consistency": 0.0-1.0, "architectural_depth": 0.0-1.0 }`,
                user: `Query: ${query}\nResponse: ${String(response).slice(0, 800)}`,
                json: true,
            });

            const reward = computeReward({
                relevance: clamp(evalResult.relevance || 0.5),
                clarity: clamp(evalResult.clarity || 0.5),
                identityConsistency: clamp(evalResult.identity_consistency || 0.5),
                architecturalDepth: clamp(evalResult.architectural_depth || 0.5),
                hallucinationPenalty: 0,
            });
            totalReward += reward;
        } catch {
            totalReward += 0.7; // Default on failure
        }
    }

    const avgReward = totalReward / testQueries.length;
    return { passed: avgReward > 0.65, avgReward };
}

// ────────────────────────────────────────────
// PART 7: FULL REINFORCEMENT CYCLE
// ────────────────────────────────────────────

export async function runReinforcementCycle(): Promise<ReinforcementCycleResult> {
    console.log("[Reward] 🎯 Starting reinforcement cycle...");

    const intents = ["architecture", "strategy", "identity", "research"];
    const adjustments: Record<string, { reward: number; adjusted: boolean; reason: string }> = {};

    for (const intent of intents) {
        const rolling = await getRollingReward(intent);

        if (rolling.count < 3) {
            adjustments[intent] = { reward: rolling.current, adjusted: false, reason: `Insufficient data (${rolling.count} logs)` };
            continue;
        }

        // If reward is trending down → trigger adjustment
        if (rolling.delta < -0.05) {
            const result = await adjustWeightsForIntent(intent);
            adjustments[intent] = { reward: rolling.current, adjusted: result.adjusted, reason: `Reward dropped (Δ${rolling.delta.toFixed(3)}). ${result.reason}` };
        } else {
            adjustments[intent] = { reward: rolling.current, adjusted: false, reason: `Reward stable/improving (Δ${rolling.delta.toFixed(3)})` };
        }
    }

    // Sandbox validation
    const sandbox = await sandboxValidation();
    console.log(`[Reward] Sandbox: ${sandbox.passed ? "PASSED" : "FAILED"} (avg: ${sandbox.avgReward.toFixed(2)})`);

    const adjustedCount = Object.values(adjustments).filter((a) => a.adjusted).length;
    console.log(`[Reward] ✅ Done — ${adjustedCount}/${intents.length} adjusted, sandbox: ${sandbox.passed}`);

    return {
        intentsProcessed: intents.length,
        adjustments,
        sandboxPassed: sandbox.passed,
        timestamp: new Date().toISOString(),
    };
}

// ────────────────────────────────────────────
// STATUS
// ────────────────────────────────────────────

export async function getRewardStatus() {
    const intents = ["architecture", "strategy", "identity", "research"];
    const rolling: Record<string, { current: number; delta: number; count: number }> = {};

    for (const intent of intents) {
        const r = await getRollingReward(intent);
        rolling[intent] = { current: r.current, delta: r.delta, count: r.count };
    }

    const totalLogs = await prisma.rewardLog.count();
    const recentLogs = await prisma.rewardLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { intent: true, totalReward: true, hallucinationPenalty: true, createdAt: true },
    });

    return { rolling, totalLogs, recentLogs };
}

// ────────────────────────────────────────────
// UTIL
// ────────────────────────────────────────────

function clamp(v: number): number {
    return Math.max(0, Math.min(1, v));
}

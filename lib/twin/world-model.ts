/**
 * World-Model + Simulation-Based Planning Engine
 *
 * Counterfactual simulation for predictive autonomy.
 * The Twin models system dynamics, simulates alternative futures,
 * and selects actions with highest expected long-term reward.
 *
 * Components:
 * 1. State Vector Builder     — Captures 7-dimensional cognitive state
 * 2. Action Space             — 7 bounded autonomous actions
 * 3. World Model Predictor    — LLM-based counterfactual reasoning
 * 4. Multi-Action Simulation  — Simulates all actions in parallel
 * 5. Expected Utility         — Reward × 0.6 + Depth × 0.2 - Halluc × 0.2
 * 6. Long-Horizon Simulation  — 5-step trajectory planning
 * 7. Model Learning Loop      — Prediction error tracking + refinement
 * 8. Integration              — Feeds into Planning Engine + Autonomous Goals
 *
 * Safety: Cannot modify identity, change reward formula, or exceed weight bounds.
 */

import { callLLM } from "@/lib/services/llm.service";
import prisma from "@/lib/prisma";
import { getRollingReward } from "./reward-model";

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

export interface StateVector {
    avgReward: number;
    architecturalDepth: number;
    identityAlignment: number;
    hallucinationRate: number;
    clusterEntropy: number;
    debateDiversity: number;
    retrievalBias: number;
}

export interface Prediction {
    predictedReward: number;
    hallucinationRate: number;
    architecturalDepth: number;
}

export interface SimulationResult {
    action: string;
    prediction: Prediction;
    expectedUtility: number;
}

export interface WorldModelCycleResult {
    currentState: StateVector;
    simulations: SimulationResult[];
    selectedAction: string | null;
    expectedUtility: number;
    horizonDepth: number;
    timestamp: string;
}

// ────────────────────────────────────────────
// ACTION SPACE (BOUNDED)
// ────────────────────────────────────────────

const ACTIONS = [
    "increase_cluster_weight",
    "increase_vector_weight",
    "reduce_episodic_weight",
    "strengthen_skeptic_agent",
    "inject_identity_rule",
    "increase_context_compression",
    "expand_cluster_diversity",
] as const;

type Action = typeof ACTIONS[number];

// ────────────────────────────────────────────
// STEP 1: BUILD STATE VECTOR
// ────────────────────────────────────────────

export async function buildStateVector(): Promise<StateVector> {
    // Reward
    const intents = ["architecture", "strategy", "identity", "research"];
    let totalReward = 0;
    for (const intent of intents) {
        const r = await getRollingReward(intent);
        totalReward += r.current;
    }
    const avgReward = totalReward / intents.length;

    // Cognitive state
    const cogState = await prisma.cognitiveState.findFirst({
        orderBy: { createdAt: "desc" },
        select: {
            reasoningDepth: true, identityAlignment: true,
            hallucinationRisk: true, debateDiversity: true, retrievalBias: true,
        },
    });

    // Cluster entropy
    let clusterEntropy = 0.5;
    try {
        const clusters = await prisma.memoryCluster.findMany({
            select: { strength: true, memberCount: true },
        });
        if (clusters.length > 0) {
            const totalMembers = clusters.reduce((s: number, c: { memberCount: number }) => s + c.memberCount, 0);
            if (totalMembers > 0) {
                clusterEntropy = clusters.reduce((ent: number, c: { memberCount: number }) => {
                    const p = c.memberCount / totalMembers;
                    return p > 0 ? ent - p * Math.log2(p) : ent;
                }, 0) / Math.log2(Math.max(2, clusters.length));
            }
        }
    } catch { /* skip */ }

    const state: StateVector = {
        avgReward,
        architecturalDepth: cogState?.reasoningDepth ?? 0.7,
        identityAlignment: cogState?.identityAlignment ?? 0.85,
        hallucinationRate: cogState?.hallucinationRisk ?? 0.1,
        clusterEntropy,
        debateDiversity: cogState?.debateDiversity ?? 0.5,
        retrievalBias: cogState?.retrievalBias ?? 0.3,
    };

    // Store state snapshot
    await prisma.worldModelState.create({ data: state });

    return state;
}

// ────────────────────────────────────────────
// STEP 2: WORLD MODEL PREDICTOR
// ────────────────────────────────────────────

async function predictNextState(state: StateVector, action: Action): Promise<Prediction> {
    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b",
            system: `You are a World Model Predictor for an AI cognitive system.

Given the current cognitive state and a proposed action, predict the new state.

Return JSON ONLY:
{ "predicted_reward": 0.0-1.0, "hallucination_rate": 0.0-1.0, "architectural_depth": 0.0-1.0 }

Actions and their typical effects:
- increase_cluster_weight: +cluster usage, may reduce diversity
- increase_vector_weight: +raw retrieval, may increase bias
- reduce_episodic_weight: -context, +speed, may lose nuance
- strengthen_skeptic_agent: +debate diversity, +depth, -speed
- inject_identity_rule: +identity alignment, slight rigidity
- increase_context_compression: +efficiency, slight info loss
- expand_cluster_diversity: -bias, +exploration, adjusting period`,
            user: `Current State:
- reward: ${state.avgReward.toFixed(3)}
- architectural_depth: ${state.architecturalDepth.toFixed(3)}
- identity: ${state.identityAlignment.toFixed(3)}
- hallucination: ${state.hallucinationRate.toFixed(3)}
- cluster_entropy: ${state.clusterEntropy.toFixed(3)}
- debate_diversity: ${state.debateDiversity.toFixed(3)}
- retrieval_bias: ${state.retrievalBias.toFixed(3)}

Proposed Action: ${action}`,
            json: true,
        });

        return {
            predictedReward: clamp(result.predicted_reward ?? result.predictedReward ?? state.avgReward),
            hallucinationRate: clamp(result.hallucination_rate ?? result.hallucinationRate ?? state.hallucinationRate),
            architecturalDepth: clamp(result.architectural_depth ?? result.architecturalDepth ?? state.architecturalDepth),
        };
    } catch {
        // Heuristic fallback if LLM fails
        return heuristicPredict(state, action);
    }
}

function heuristicPredict(state: StateVector, action: Action): Prediction {
    let r = state.avgReward;
    let h = state.hallucinationRate;
    let d = state.architecturalDepth;

    switch (action) {
        case "increase_cluster_weight": r += 0.02; h -= 0.01; break;
        case "increase_vector_weight": r += 0.01; h += 0.02; break;
        case "reduce_episodic_weight": r -= 0.01; h += 0.01; break;
        case "strengthen_skeptic_agent": d += 0.03; h -= 0.02; break;
        case "inject_identity_rule": r += 0.01; break;
        case "increase_context_compression": r += 0.01; d -= 0.01; break;
        case "expand_cluster_diversity": r += 0.02; h -= 0.01; break;
    }

    return { predictedReward: clamp(r), hallucinationRate: clamp(h), architecturalDepth: clamp(d) };
}

// ────────────────────────────────────────────
// STEP 3: EXPECTED UTILITY
// ────────────────────────────────────────────

function computeExpectedUtility(pred: Prediction): number {
    return (pred.predictedReward * 0.6) + (pred.architecturalDepth * 0.2) - (pred.hallucinationRate * 0.2);
}

// ────────────────────────────────────────────
// STEP 4: MULTI-ACTION SIMULATION
// ────────────────────────────────────────────

async function simulateAllActions(state: StateVector): Promise<SimulationResult[]> {
    const results: SimulationResult[] = [];

    // Simulate all actions (sequentially to avoid LLM overload)
    for (const action of ACTIONS) {
        const prediction = await predictNextState(state, action);
        const expectedUtility = computeExpectedUtility(prediction);

        results.push({ action, prediction, expectedUtility });

        // Store simulation
        await prisma.simulationRun.create({
            data: {
                action,
                predictedReward: prediction.predictedReward,
                predictedHalluc: prediction.hallucinationRate,
                predictedDepth: prediction.architecturalDepth,
                expectedUtility,
                horizonSteps: 1,
            },
        });
    }

    return results.sort((a, b) => b.expectedUtility - a.expectedUtility);
}

// ────────────────────────────────────────────
// STEP 5: LONG-HORIZON SIMULATION (5-step)
// ────────────────────────────────────────────

async function simulateLongHorizon(state: StateVector, action: Action, steps: number = 5): Promise<{
    trajectory: { step: number; reward: number; halluc: number; depth: number }[];
    cumulativeUtility: number;
}> {
    const trajectory: { step: number; reward: number; halluc: number; depth: number }[] = [];
    let currentState = { ...state };
    let cumulativeUtility = 0;
    const discount = 0.95;

    for (let i = 0; i < steps; i++) {
        const pred = await predictNextState(currentState, action);
        const utility = computeExpectedUtility(pred);
        cumulativeUtility += utility * Math.pow(discount, i);

        trajectory.push({
            step: i + 1,
            reward: pred.predictedReward,
            halluc: pred.hallucinationRate,
            depth: pred.architecturalDepth,
        });

        // Update state for next step
        currentState = {
            avgReward: pred.predictedReward,
            architecturalDepth: pred.architecturalDepth,
            identityAlignment: currentState.identityAlignment,
            hallucinationRate: pred.hallucinationRate,
            clusterEntropy: currentState.clusterEntropy,
            debateDiversity: currentState.debateDiversity,
            retrievalBias: currentState.retrievalBias,
        };
    }

    return { trajectory, cumulativeUtility };
}

// ────────────────────────────────────────────
// STEP 6: MODEL LEARNING (ERROR TRACKING)
// ────────────────────────────────────────────

export async function recordActualOutcome(
    simulationId: string,
    actualReward: number,
    actualHalluc: number,
    actualDepth: number
): Promise<number> {
    const sim = await prisma.simulationRun.findUnique({ where: { id: simulationId } });
    if (!sim) return 0;

    const predictionError = Math.sqrt(
        Math.pow(sim.predictedReward - actualReward, 2) +
        Math.pow(sim.predictedHalluc - actualHalluc, 2) +
        Math.pow(sim.predictedDepth - actualDepth, 2)
    ) / Math.sqrt(3); // normalize to 0-1 range

    await prisma.simulationRun.update({
        where: { id: simulationId },
        data: { actualReward, actualHalluc, actualDepth, predictionError, executed: true },
    });

    return predictionError;
}

// ────────────────────────────────────────────
// STEP 7: FULL WORLD MODEL CYCLE
// ────────────────────────────────────────────

export async function runWorldModelCycle(longHorizon: boolean = false): Promise<WorldModelCycleResult> {
    console.log("[WorldModel] 🌍 Starting world-model simulation cycle...");

    // Step 1: Build current state
    const currentState = await buildStateVector();
    console.log(`[WorldModel] 📊 State captured — reward: ${currentState.avgReward.toFixed(3)}, depth: ${currentState.architecturalDepth.toFixed(3)}`);

    // Step 2: Simulate all actions
    const simulations = await simulateAllActions(currentState);
    console.log(`[WorldModel] 🔮 ${simulations.length} actions simulated`);

    // Step 3: Long-horizon for top 3 actions (if enabled)
    let horizonDepth = 1;
    if (longHorizon && simulations.length >= 3) {
        horizonDepth = 5;
        const top3 = simulations.slice(0, 3);

        for (const sim of top3) {
            const horizon = await simulateLongHorizon(currentState, sim.action as Action, 5);

            // Update with long-horizon utility
            sim.expectedUtility = horizon.cumulativeUtility;

            // Store trajectory
            await prisma.simulationRun.updateMany({
                where: { action: sim.action, horizonSteps: 1, selected: false },
                data: { horizonSteps: 5, trajectory: horizon.trajectory as any },
            });
        }

        // Re-sort by long-horizon utility
        simulations.sort((a, b) => b.expectedUtility - a.expectedUtility);
        console.log(`[WorldModel] 🔭 5-step horizon computed for top 3 actions`);
    }

    // Step 4: Select best action
    const best = simulations[0];
    if (best) {
        await prisma.simulationRun.updateMany({
            where: { action: best.action, selected: false },
            data: { selected: true },
        });
        console.log(`[WorldModel] ✅ Best action: "${best.action}" (utility: ${best.expectedUtility.toFixed(3)})`);
    }

    // Step 5: Log all results
    for (const sim of simulations) {
        console.log(`  [${sim.action === best?.action ? "★" : " "}] ${sim.action}: utility=${sim.expectedUtility.toFixed(3)} → reward=${sim.prediction.predictedReward.toFixed(3)}, halluc=${sim.prediction.hallucinationRate.toFixed(3)}`);
    }

    return {
        currentState,
        simulations,
        selectedAction: best?.action ?? null,
        expectedUtility: best?.expectedUtility ?? 0,
        horizonDepth,
        timestamp: new Date().toISOString(),
    };
}

// ────────────────────────────────────────────
// MODEL ACCURACY
// ────────────────────────────────────────────

export async function getWorldModelAccuracy(): Promise<{
    avgPredictionError: number;
    totalSimulations: number;
    executedSimulations: number;
    modelConfidence: number;
}> {
    const executed = await prisma.simulationRun.findMany({
        where: { executed: true, predictionError: { not: null } },
        select: { predictionError: true },
    });

    const totalSimulations = await prisma.simulationRun.count();

    const errors = executed.map((e: { predictionError: number | null }) => e.predictionError ?? 0);
    const avgError = errors.length > 0 ? errors.reduce((a: number, b: number) => a + b, 0) / errors.length : 0;

    return {
        avgPredictionError: avgError,
        totalSimulations,
        executedSimulations: executed.length,
        modelConfidence: clamp(1 - avgError),
    };
}

// ────────────────────────────────────────────
// STATUS
// ────────────────────────────────────────────

export async function getWorldModelStatus() {
    const accuracy = await getWorldModelAccuracy();

    const recentStates = await prisma.worldModelState.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
    });

    const recentSims = await prisma.simulationRun.findMany({
        where: { selected: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
            action: true, expectedUtility: true,
            predictedReward: true, actualReward: true,
            predictionError: true, horizonSteps: true, createdAt: true,
        },
    });

    return { accuracy, recentStates, recentSimulations: recentSims };
}

// ────────────────────────────────────────────
// UTIL
// ────────────────────────────────────────────

function clamp(v: number): number {
    return Math.max(0, Math.min(1, v));
}

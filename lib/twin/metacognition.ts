/**
 * Meta-Cognitive Self-Modeling Engine
 *
 * Structured self-representation of internal cognition.
 * The Twin monitors its own reasoning, detects biases,
 * calibrates confidence, and predicts its own performance.
 *
 * Components:
 * 1.  Cognitive State Analyzer — Evaluates 6 cognitive dimensions
 * 2.  Confidence Calibrator     — Detects overconfidence
 * 3.  Debate Dominance Monitor  — Prevents internal echo chamber
 * 4.  Retrieval Bias Detector   — Flags cluster dominance
 * 5.  Self-Prediction Layer     — Predicts reward before response
 * 6.  Cognitive Drift Detector  — Tracks identity alignment over time
 * 7.  Meta-Learning Loop        — Weekly cognitive self-analysis
 * 8.  Control Signal Emitter    — Recommends adaptive adjustments
 *
 * Safety: Cannot rewrite identity, disable agents, or modify rewards directly.
 */

import { callLLM } from "@/lib/services/llm.service";
import prisma from "@/lib/prisma";
import { storeSemanticMemory } from "./cognitive-memory";

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

export interface CognitiveMetrics {
    reasoningDepth: number;
    confidenceLevel: number;
    identityAlignment: number;
    retrievalBias: number;
    debateDiversity: number;
    hallucinationRisk: number;
}

export interface ControlSignals {
    reduceConfidenceTone: boolean;
    strengthenSkeptic: boolean;
    triggerExploration: boolean;
    reinforceIdentity: boolean;
    reasons: string[];
}

export interface MetaCognitiveResult {
    state: CognitiveMetrics;
    controlSignals: ControlSignals;
    predictedReward: number;
    calibrationError: number | null;
    driftScore: number | null;
}

// ────────────────────────────────────────────
// PART 1: COGNITIVE STATE ANALYZER
// ────────────────────────────────────────────

export async function analyzeCognitiveState(
    draft: string,
    finalResponse: string,
    retrieverFeedback: string | null,
    skepticFeedback: string | null,
    identityFeedback: string | null,
    context: string
): Promise<CognitiveMetrics> {
    try {
        const debateContext = [
            retrieverFeedback ? `Retriever: ${retrieverFeedback.slice(0, 300)}` : null,
            skepticFeedback ? `Skeptic: ${skepticFeedback.slice(0, 300)}` : null,
            identityFeedback ? `Identity: ${identityFeedback.slice(0, 300)}` : null,
        ].filter(Boolean).join("\n");

        const result = await callLLM({
            model: "qwen2.5:1.5b",
            system: `You are Meta-Cognitive Analyzer for an Autonomous Systems Architect AI.

Evaluate the cognitive process that produced this response:

1. reasoning_depth (0-1): Was reasoning multi-step and structural?
2. confidence_level (0-1): How confident is the response? (1.0 = very confident)
3. identity_alignment (0-1): Does it maintain architect persona?
4. retrieval_bias (0-1): Is the response over-reliant on specific context? (high = biased)
5. debate_diversity (0-1): Did internal critics meaningfully change the output? (high = diverse)
6. hallucination_risk (0-1): Risk of unsupported claims? (high = risky)

Return JSON ONLY with these 6 fields.`,
            user: `Draft:\n${draft.slice(0, 500)}\n\nFinal:\n${finalResponse.slice(0, 500)}\n\nCritiques:\n${debateContext}\n\nContext used:\n${context.slice(0, 300)}`,
            json: true,
        });

        return {
            reasoningDepth: clamp(result.reasoning_depth ?? result.reasoningDepth ?? 0.7),
            confidenceLevel: clamp(result.confidence_level ?? result.confidenceLevel ?? 0.7),
            identityAlignment: clamp(result.identity_alignment ?? result.identityAlignment ?? 0.8),
            retrievalBias: clamp(result.retrieval_bias ?? result.retrievalBias ?? 0.3),
            debateDiversity: clamp(result.debate_diversity ?? result.debateDiversity ?? 0.5),
            hallucinationRisk: clamp(result.hallucination_risk ?? result.hallucinationRisk ?? 0.1),
        };
    } catch {
        return { reasoningDepth: 0.7, confidenceLevel: 0.7, identityAlignment: 0.8, retrievalBias: 0.3, debateDiversity: 0.5, hallucinationRisk: 0.1 };
    }
}

// ────────────────────────────────────────────
// PART 2: CONFIDENCE CALIBRATION
// ────────────────────────────────────────────

function calibrateConfidence(metrics: CognitiveMetrics): { adjustedConfidence: number; overconfident: boolean } {
    const overconfident = metrics.confidenceLevel > 0.85 && metrics.hallucinationRisk > 0.15;
    const underconfident = metrics.confidenceLevel < 0.4 && metrics.reasoningDepth > 0.7;

    let adjusted = metrics.confidenceLevel;
    if (overconfident) adjusted -= 0.15;
    if (underconfident) adjusted += 0.10;

    return { adjustedConfidence: clamp(adjusted), overconfident };
}

// ────────────────────────────────────────────
// PART 3: CONTROL SIGNAL EMITTER
// ────────────────────────────────────────────

function emitControlSignals(metrics: CognitiveMetrics): ControlSignals {
    const signals: ControlSignals = {
        reduceConfidenceTone: false,
        strengthenSkeptic: false,
        triggerExploration: false,
        reinforceIdentity: false,
        reasons: [],
    };

    // Overconfidence detection
    if (metrics.confidenceLevel > 0.85 && metrics.hallucinationRisk > 0.15) {
        signals.reduceConfidenceTone = true;
        signals.reasons.push(`Overconfidence detected (conf: ${metrics.confidenceLevel.toFixed(2)}, halluc: ${metrics.hallucinationRisk.toFixed(2)})`);
    }

    // Debate echo chamber
    if (metrics.debateDiversity < 0.4) {
        signals.strengthenSkeptic = true;
        signals.reasons.push(`Low debate diversity (${metrics.debateDiversity.toFixed(2)}) — skeptic underutilized`);
    }

    // Retrieval bias
    if (metrics.retrievalBias > 0.7) {
        signals.triggerExploration = true;
        signals.reasons.push(`High retrieval bias (${metrics.retrievalBias.toFixed(2)}) — cluster dominance risk`);
    }

    // Identity drift
    if (metrics.identityAlignment < 0.75) {
        signals.reinforceIdentity = true;
        signals.reasons.push(`Identity alignment low (${metrics.identityAlignment.toFixed(2)}) — reinforcement needed`);
    }

    return signals;
}

// ────────────────────────────────────────────
// PART 4: SELF-PREDICTION
// ────────────────────────────────────────────

export function predictReward(metrics: CognitiveMetrics): number {
    // Predict reward from cognitive metrics
    return clamp(
        (metrics.reasoningDepth * 0.25) +
        (calibrateConfidence(metrics).adjustedConfidence * 0.15) +
        (metrics.identityAlignment * 0.25) +
        ((1 - metrics.hallucinationRisk) * 0.20) +
        (metrics.debateDiversity * 0.15)
    );
}

// ────────────────────────────────────────────
// PART 5: DRIFT DETECTION
// ────────────────────────────────────────────

async function computeDrift(): Promise<number | null> {
    const recent = await prisma.cognitiveState.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { identityAlignment: true },
    });

    if (recent.length < 5) return null;

    const recentAvg = recent.slice(0, 5).reduce((s: number, r: { identityAlignment: number }) => s + r.identityAlignment, 0) / 5;
    const olderAvg = recent.slice(5).reduce((s: number, r: { identityAlignment: number }) => s + r.identityAlignment, 0) / Math.max(1, recent.slice(5).length);

    return recentAvg - olderAvg; // negative = drifting away from identity
}

// ────────────────────────────────────────────
// PART 6: FULL META-COGNITIVE ANALYSIS
// ────────────────────────────────────────────

export async function runMetaCognition(
    draft: string,
    finalResponse: string,
    retrieverFeedback: string | null,
    skepticFeedback: string | null,
    identityFeedback: string | null,
    context: string,
    actualReward?: number
): Promise<MetaCognitiveResult> {
    // Step 1: Analyze cognitive state
    const state = await analyzeCognitiveState(
        draft, finalResponse, retrieverFeedback, skepticFeedback, identityFeedback, context
    );

    // Step 2: Generate control signals
    const controlSignals = emitControlSignals(state);

    // Step 3: Self-prediction
    const predicted = predictReward(state);

    // Step 4: Calibration error
    const calibrationError = actualReward !== undefined ? Math.abs(predicted - actualReward) : null;

    // Step 5: Drift detection
    const driftScore = await computeDrift();

    // Step 6: Store cognitive state
    try {
        await prisma.cognitiveState.create({
            data: {
                reasoningDepth: state.reasoningDepth,
                confidenceLevel: state.confidenceLevel,
                identityAlignment: state.identityAlignment,
                retrievalBias: state.retrievalBias,
                debateDiversity: state.debateDiversity,
                hallucinationRisk: state.hallucinationRisk,
                predictedReward: predicted,
                actualReward: actualReward ?? null,
                calibrationError,
                driftScore,
                controlSignals: controlSignals as any,
            },
        });
    } catch (e) {
        console.error("[MetaCog] Storage error:", e);
    }

    if (controlSignals.reasons.length > 0) {
        console.log(`[MetaCog] ⚠ Signals: ${controlSignals.reasons.join("; ")}`);
    }

    return { state, controlSignals, predictedReward: predicted, calibrationError, driftScore };
}

// ────────────────────────────────────────────
// PART 7: META-LEARNING LOOP (WEEKLY)
// ────────────────────────────────────────────

export async function runMetaLearning(): Promise<{
    analysisComplete: boolean;
    weaknesses: string[];
    recommendations: string[];
}> {
    console.log("[MetaCog] 🧠 Running meta-learning analysis...");

    const states = await prisma.cognitiveState.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    if (states.length < 5) {
        return { analysisComplete: false, weaknesses: [], recommendations: ["Not enough data for meta-learning"] };
    }

    // Compute averages
    const avg = (key: keyof CognitiveMetrics) =>
        states.reduce((s: number, st: Record<string, unknown>) => s + (Number(st[key]) || 0), 0) / states.length;

    const avgState = {
        reasoningDepth: avg("reasoningDepth"),
        confidenceLevel: avg("confidenceLevel"),
        identityAlignment: avg("identityAlignment"),
        retrievalBias: avg("retrievalBias"),
        debateDiversity: avg("debateDiversity"),
        hallucinationRisk: avg("hallucinationRisk"),
    };

    // Average calibration error
    const calibrationStates = states.filter((s: { calibrationError: number | null }) => s.calibrationError !== null);
    const avgCalibration = calibrationStates.length > 0
        ? calibrationStates.reduce((s: number, st: { calibrationError: number | null }) => s + (st.calibrationError || 0), 0) / calibrationStates.length
        : null;

    // Detect weaknesses
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (avgState.reasoningDepth < 0.65) {
        weaknesses.push(`Low reasoning depth (avg: ${avgState.reasoningDepth.toFixed(2)})`);
        recommendations.push("Increase architectural depth in system prompts");
    }
    if (avgState.confidenceLevel > 0.85) {
        weaknesses.push(`Chronic overconfidence (avg: ${avgState.confidenceLevel.toFixed(2)})`);
        recommendations.push("Add uncertainty acknowledgment to response style");
    }
    if (avgState.retrievalBias > 0.6) {
        weaknesses.push(`High retrieval bias (avg: ${avgState.retrievalBias.toFixed(2)})`);
        recommendations.push("Trigger cluster exploration goal to diversify retrieval");
    }
    if (avgState.debateDiversity < 0.45) {
        weaknesses.push(`Low debate diversity (avg: ${avgState.debateDiversity.toFixed(2)})`);
        recommendations.push("Strengthen skeptic agent weighting in debate engine");
    }
    if (avgState.hallucinationRisk > 0.2) {
        weaknesses.push(`Elevated hallucination risk (avg: ${avgState.hallucinationRisk.toFixed(2)})`);
        recommendations.push("Increase retriever agent strictness");
    }
    if (avgCalibration !== null && avgCalibration > 0.15) {
        weaknesses.push(`Poor self-prediction (avg error: ${avgCalibration.toFixed(2)})`);
        recommendations.push("Recalibrate confidence estimation weights");
    }

    // Store as cognitive self-knowledge
    if (weaknesses.length > 0) {
        try {
            await storeSemanticMemory(
                "Cognitive Self-Analysis",
                `Meta-learning detected: ${weaknesses.join("; ")}. Recommendations: ${recommendations.join("; ")}.`
            );
        } catch { /* non-critical */ }
    }

    console.log(`[MetaCog] ✅ Meta-learning complete — ${weaknesses.length} weaknesses, ${recommendations.length} recommendations`);

    return { analysisComplete: true, weaknesses, recommendations };
}

// ────────────────────────────────────────────
// STATUS
// ────────────────────────────────────────────

export async function getMetaCogStatus() {
    const total = await prisma.cognitiveState.count();

    const recent = await prisma.cognitiveState.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
            reasoningDepth: true, confidenceLevel: true,
            identityAlignment: true, retrievalBias: true,
            debateDiversity: true, hallucinationRisk: true,
            calibrationError: true, driftScore: true,
            controlSignals: true, createdAt: true,
        },
    });

    // Compute current averages from last 20
    const all = await prisma.cognitiveState.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
            reasoningDepth: true, confidenceLevel: true,
            identityAlignment: true, retrievalBias: true,
            debateDiversity: true, hallucinationRisk: true,
        },
    });

    const averages = all.length > 0 ? {
        reasoningDepth: all.reduce((s: number, r: { reasoningDepth: number }) => s + r.reasoningDepth, 0) / all.length,
        confidenceLevel: all.reduce((s: number, r: { confidenceLevel: number }) => s + r.confidenceLevel, 0) / all.length,
        identityAlignment: all.reduce((s: number, r: { identityAlignment: number }) => s + r.identityAlignment, 0) / all.length,
        retrievalBias: all.reduce((s: number, r: { retrievalBias: number }) => s + r.retrievalBias, 0) / all.length,
        debateDiversity: all.reduce((s: number, r: { debateDiversity: number }) => s + r.debateDiversity, 0) / all.length,
        hallucinationRisk: all.reduce((s: number, r: { hallucinationRisk: number }) => s + r.hallucinationRisk, 0) / all.length,
    } : null;

    return { totalStates: total, recentStates: recent, averages };
}

// ────────────────────────────────────────────
// UTIL
// ────────────────────────────────────────────

function clamp(v: number): number {
    return Math.max(0, Math.min(1, v));
}

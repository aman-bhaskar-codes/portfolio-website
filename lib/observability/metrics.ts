/**
 * Metrics Aggregation Engine
 *
 * Aggregates observability data into structured metrics
 * for the monitoring dashboard.
 */

import prisma from "@/lib/prisma";

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

export interface SystemMetrics {
    reward: { avg: number; trend: number[]; count: number };
    latency: { avg: number; p95: number; trend: number[] };
    hallucination: { avg: number; rate: number };
    identity: { avg: number; driftTrend: number[] };
    debate: { totalDebates: number; avgDiversity: number; avgRewardDelta: number };
    clusters: { total: number; strong: number; avgStrength: number };
    planning: { active: number; completed: number; failed: number };
    autonomy: { goalsGenerated: number; goalsCompleted: number; cooldownActive: boolean };
    research: { hypotheses: number; validated: number; rejected: number };
    cognition: { avgDepth: number; avgConfidence: number; avgBias: number };
    tokens: { total: number; avgPerRequest: number };
    alerts: Alert[];
}

interface Alert {
    type: "critical" | "warning" | "info";
    message: string;
    timestamp: string;
}

// ────────────────────────────────────────────
// AGGREGATE METRICS
// ────────────────────────────────────────────

export async function aggregateMetrics(): Promise<SystemMetrics> {
    const [reward, latency, hallucination, identity, debate, clusters, planning,
        autonomy, research, cognition, tokens, alerts] = await Promise.all([
            computeRewardMetrics(),
            computeLatencyMetrics(),
            computeHallucinationMetrics(),
            computeIdentityMetrics(),
            computeDebateMetrics(),
            computeClusterMetrics(),
            computePlanningMetrics(),
            computeAutonomyMetrics(),
            computeResearchMetrics(),
            computeCognitionMetrics(),
            computeTokenMetrics(),
            detectAlerts(),
        ]);

    return { reward, latency, hallucination, identity, debate, clusters, planning, autonomy, research, cognition, tokens, alerts };
}

// ────────────────────────────────────────────
// REWARD
// ────────────────────────────────────────────

async function computeRewardMetrics() {
    const logs = await prisma.rewardLog.findMany({
        orderBy: { createdAt: "desc" }, take: 50,
        select: { totalReward: true },
    });
    const rewards = logs.map((l: { totalReward: number }) => l.totalReward);
    return {
        avg: rewards.length > 0 ? rewards.reduce((a: number, b: number) => a + b, 0) / rewards.length : 1.0,
        trend: rewards.slice(0, 20).reverse(),
        count: rewards.length,
    };
}

// ────────────────────────────────────────────
// LATENCY
// ────────────────────────────────────────────

async function computeLatencyMetrics() {
    const logs = await prisma.observabilityLog.findMany({
        where: { latencyMs: { not: null } },
        orderBy: { createdAt: "desc" }, take: 100,
        select: { latencyMs: true },
    });
    const latencies = logs.map((l: { latencyMs: number | null }) => l.latencyMs || 0).filter((l: number) => l > 0);
    const sorted = [...latencies].sort((a, b) => a - b);
    return {
        avg: latencies.length > 0 ? latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length : 0,
        p95: sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0,
        trend: latencies.slice(0, 20).reverse(),
    };
}

// ────────────────────────────────────────────
// HALLUCINATION
// ────────────────────────────────────────────

async function computeHallucinationMetrics() {
    const logs = await prisma.rewardLog.findMany({
        orderBy: { createdAt: "desc" }, take: 50,
        select: { hallucinationPenalty: true },
    });
    const penalties = logs.map((l: { hallucinationPenalty: number }) => l.hallucinationPenalty);
    const avg = penalties.length > 0 ? penalties.reduce((a: number, b: number) => a + b, 0) / penalties.length : 0;
    return { avg, rate: penalties.filter((p: number) => p > 0.2).length / Math.max(1, penalties.length) };
}

// ────────────────────────────────────────────
// IDENTITY
// ────────────────────────────────────────────

async function computeIdentityMetrics() {
    const states = await prisma.cognitiveState.findMany({
        orderBy: { createdAt: "desc" }, take: 20,
        select: { identityAlignment: true, driftScore: true },
    });
    const alignments = states.map((s: { identityAlignment: number }) => s.identityAlignment);
    const drifts = states.map((s: { driftScore: number | null }) => s.driftScore ?? 0);
    return {
        avg: alignments.length > 0 ? alignments.reduce((a: number, b: number) => a + b, 0) / alignments.length : 1.0,
        driftTrend: drifts.slice(0, 10).reverse(),
    };
}

// ────────────────────────────────────────────
// DEBATE
// ────────────────────────────────────────────

async function computeDebateMetrics() {
    const debates = await prisma.debateLog.findMany({
        orderBy: { createdAt: "desc" }, take: 20,
        select: { rewardDelta: true },
    });
    const total = await prisma.debateLog.count();
    const cogStates = await prisma.cognitiveState.findMany({
        orderBy: { createdAt: "desc" }, take: 20,
        select: { debateDiversity: true },
    });
    return {
        totalDebates: total,
        avgDiversity: cogStates.length > 0 ? cogStates.reduce((s: number, c: { debateDiversity: number }) => s + c.debateDiversity, 0) / cogStates.length : 0,
        avgRewardDelta: debates.length > 0 ? debates.reduce((s: number, d: { rewardDelta: number | null }) => s + (d.rewardDelta || 0), 0) / debates.length : 0,
    };
}

// ────────────────────────────────────────────
// CLUSTERS
// ────────────────────────────────────────────

async function computeClusterMetrics() {
    const clusters = await prisma.memoryCluster.findMany({ select: { strength: true } });
    const strengths = clusters.map((c: { strength: number }) => c.strength);
    return {
        total: clusters.length,
        strong: strengths.filter((s: number) => s > 0.7).length,
        avgStrength: strengths.length > 0 ? strengths.reduce((a: number, b: number) => a + b, 0) / strengths.length : 0,
    };
}

// ────────────────────────────────────────────
// PLANNING
// ────────────────────────────────────────────

async function computePlanningMetrics() {
    const [active, completed, failed] = await Promise.all([
        prisma.plan.count({ where: { status: "active" } }),
        prisma.plan.count({ where: { status: "completed" } }),
        prisma.plan.count({ where: { status: "failed" } }),
    ]);
    return { active, completed, failed };
}

// ────────────────────────────────────────────
// AUTONOMY
// ────────────────────────────────────────────

async function computeAutonomyMetrics() {
    const generated = await prisma.autonomousGoal.count();
    const completed = await prisma.autonomousGoal.count({ where: { status: "completed" } });
    const lastGoal = await prisma.autonomousGoal.findFirst({
        where: { status: { in: ["executing", "completed"] } },
        orderBy: { createdAt: "desc" },
        select: { completedAt: true, createdAt: true },
    });
    const cooldownActive = lastGoal
        ? (Date.now() - (lastGoal.completedAt || lastGoal.createdAt).getTime()) / 3600000 < 24
        : false;
    return { goalsGenerated: generated, goalsCompleted: completed, cooldownActive };
}

// ────────────────────────────────────────────
// RESEARCH
// ────────────────────────────────────────────

async function computeResearchMetrics() {
    const [hypotheses, validated, rejected] = await Promise.all([
        prisma.researchHypothesis.count(),
        prisma.researchHypothesis.count({ where: { status: "validated" } }),
        prisma.researchHypothesis.count({ where: { status: "rejected" } }),
    ]);
    return { hypotheses, validated, rejected };
}

// ────────────────────────────────────────────
// COGNITION
// ────────────────────────────────────────────

async function computeCognitionMetrics() {
    const states = await prisma.cognitiveState.findMany({
        orderBy: { createdAt: "desc" }, take: 20,
        select: { reasoningDepth: true, confidenceLevel: true, retrievalBias: true },
    });
    if (states.length === 0) return { avgDepth: 0, avgConfidence: 0, avgBias: 0 };
    return {
        avgDepth: states.reduce((s: number, st: { reasoningDepth: number }) => s + st.reasoningDepth, 0) / states.length,
        avgConfidence: states.reduce((s: number, st: { confidenceLevel: number }) => s + st.confidenceLevel, 0) / states.length,
        avgBias: states.reduce((s: number, st: { retrievalBias: number }) => s + st.retrievalBias, 0) / states.length,
    };
}

// ────────────────────────────────────────────
// TOKENS
// ────────────────────────────────────────────

async function computeTokenMetrics() {
    const logs = await prisma.observabilityLog.findMany({
        where: { tokenCount: { not: null } },
        orderBy: { createdAt: "desc" }, take: 100,
        select: { tokenCount: true },
    });
    const tokens = logs.map((l: { tokenCount: number | null }) => l.tokenCount || 0);
    return {
        total: tokens.reduce((a: number, b: number) => a + b, 0),
        avgPerRequest: tokens.length > 0 ? tokens.reduce((a: number, b: number) => a + b, 0) / tokens.length : 0,
    };
}

// ────────────────────────────────────────────
// ALERTS
// ────────────────────────────────────────────

async function detectAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const now = new Date().toISOString();

    // Hallucination alert
    const halluc = await computeHallucinationMetrics();
    if (halluc.avg > 0.2) {
        alerts.push({ type: "critical", message: `Hallucination rate high: ${(halluc.avg * 100).toFixed(1)}%`, timestamp: now });
    }

    // Reward alert
    const reward = await computeRewardMetrics();
    if (reward.avg < 0.7 && reward.count > 3) {
        alerts.push({ type: "critical", message: `Average reward low: ${reward.avg.toFixed(2)}`, timestamp: now });
    }

    // Latency alert
    const latency = await computeLatencyMetrics();
    if (latency.p95 > 5000) {
        alerts.push({ type: "warning", message: `P95 latency high: ${(latency.p95 / 1000).toFixed(1)}s`, timestamp: now });
    }

    // Identity drift
    const identity = await computeIdentityMetrics();
    if (identity.avg < 0.75) {
        alerts.push({ type: "warning", message: `Identity alignment low: ${identity.avg.toFixed(2)}`, timestamp: now });
    }

    return alerts;
}

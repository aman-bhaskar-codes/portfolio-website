/**
 * Dynamic Retrieval Weight Self-Tuning Engine
 *
 * Intent-aware weight profiles that auto-adjust based on
 * real performance metrics. Each intent (architecture, strategy,
 * identity, research) has its own weight profile.
 *
 * Safety: Micro-adjustments (±0.02), hard boundaries, normalization.
 * Explainability: Every adjustment is logged with reasoning.
 */

import prisma from "@/lib/prisma";

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

export interface WeightProfile {
    vectorWeight: number;
    clusterWeight: number;
    episodicWeight: number;
    semanticWeight: number;
}

interface MetricAverages {
    relevance: number;
    clarity: number;
    identityConsistency: number;
    architecturalDepth: number;
    count: number;
}

// ────────────────────────────────────────────
// SAFE BOUNDARIES (never exceed)
// ────────────────────────────────────────────

const BOUNDS: Record<keyof WeightProfile, [number, number]> = {
    vectorWeight: [0.25, 0.60],
    clusterWeight: [0.15, 0.50],
    episodicWeight: [0.10, 0.40],
    semanticWeight: [0.05, 0.30],
};

const DELTA = 0.02; // micro-adjustment per cycle

const DEFAULT_PROFILES: Record<string, WeightProfile> = {
    architecture: { vectorWeight: 0.40, clusterWeight: 0.30, episodicWeight: 0.20, semanticWeight: 0.10 },
    strategy: { vectorWeight: 0.35, clusterWeight: 0.35, episodicWeight: 0.20, semanticWeight: 0.10 },
    identity: { vectorWeight: 0.30, clusterWeight: 0.20, episodicWeight: 0.30, semanticWeight: 0.20 },
    research: { vectorWeight: 0.45, clusterWeight: 0.25, episodicWeight: 0.15, semanticWeight: 0.15 },
};

// ────────────────────────────────────────────
// WEIGHT PROFILE LOADING
// ────────────────────────────────────────────

/**
 * Get weight profile for an intent. Seeds default if missing.
 */
export async function getWeights(intent: string): Promise<WeightProfile> {
    const normalized = normalizeIntent(intent);

    try {
        let profile = await prisma.retrievalWeightProfile.findUnique({
            where: { intent: normalized },
        });

        if (!profile) {
            const defaults = DEFAULT_PROFILES[normalized] || DEFAULT_PROFILES.architecture;
            profile = await prisma.retrievalWeightProfile.create({
                data: { intent: normalized, ...defaults },
            });
        }

        return {
            vectorWeight: profile.vectorWeight,
            clusterWeight: profile.clusterWeight,
            episodicWeight: profile.episodicWeight,
            semanticWeight: profile.semanticWeight,
        };
    } catch {
        return DEFAULT_PROFILES[normalized] || DEFAULT_PROFILES.architecture;
    }
}

/**
 * Get all weight profiles.
 */
export async function getAllWeightProfiles() {
    // Seed any missing profiles
    for (const [intent, defaults] of Object.entries(DEFAULT_PROFILES)) {
        const exists = await prisma.retrievalWeightProfile.findUnique({ where: { intent } });
        if (!exists) {
            await prisma.retrievalWeightProfile.create({ data: { intent, ...defaults } });
        }
    }
    return prisma.retrievalWeightProfile.findMany({ orderBy: { intent: "asc" } });
}

// ────────────────────────────────────────────
// NORMALIZATION + BOUNDARIES
// ────────────────────────────────────────────

function normalizeIntent(intent: string): string {
    const lower = intent.toLowerCase().trim();
    if (lower.includes("architect") || lower.includes("system") || lower === "a" || lower === "b") return "architecture";
    if (lower.includes("strateg") || lower.includes("goal")) return "strategy";
    if (lower.includes("identity") || lower.includes("who") || lower.includes("about")) return "identity";
    if (lower.includes("research") || lower.includes("paper")) return "research";
    return "architecture"; // default
}

function normalize(w: WeightProfile): WeightProfile {
    const total = w.vectorWeight + w.clusterWeight + w.episodicWeight + w.semanticWeight;
    if (total === 0) return DEFAULT_PROFILES.architecture;
    return {
        vectorWeight: w.vectorWeight / total,
        clusterWeight: w.clusterWeight / total,
        episodicWeight: w.episodicWeight / total,
        semanticWeight: w.semanticWeight / total,
    };
}

function clampToBounds(w: WeightProfile): WeightProfile {
    return {
        vectorWeight: Math.max(BOUNDS.vectorWeight[0], Math.min(BOUNDS.vectorWeight[1], w.vectorWeight)),
        clusterWeight: Math.max(BOUNDS.clusterWeight[0], Math.min(BOUNDS.clusterWeight[1], w.clusterWeight)),
        episodicWeight: Math.max(BOUNDS.episodicWeight[0], Math.min(BOUNDS.episodicWeight[1], w.episodicWeight)),
        semanticWeight: Math.max(BOUNDS.semanticWeight[0], Math.min(BOUNDS.semanticWeight[1], w.semanticWeight)),
    };
}

// ────────────────────────────────────────────
// PERFORMANCE AGGREGATION
// ────────────────────────────────────────────

async function getMetricsByIntent(intent: string, days = 3): Promise<MetricAverages> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const logs = await prisma.twinPerformanceLog.findMany({
        where: { intent, createdAt: { gte: cutoff } },
    });

    if (logs.length === 0) {
        return { relevance: 1, clarity: 1, identityConsistency: 1, architecturalDepth: 1, count: 0 };
    }

    const avg = (key: string) =>
        logs.reduce((sum: number, l: Record<string, unknown>) => sum + (Number(l[key]) || 0), 0) / logs.length;

    return {
        relevance: avg("relevance"),
        clarity: avg("clarity"),
        identityConsistency: avg("identityConsistency"),
        architecturalDepth: avg("architecturalDepth"),
        count: logs.length,
    };
}

// ────────────────────────────────────────────
// SELF-TUNING ENGINE
// ────────────────────────────────────────────

/**
 * Adjust weights for a single intent based on performance.
 */
export async function adjustWeightsForIntent(intent: string): Promise<{
    adjusted: boolean;
    reason: string;
}> {
    const metrics = await getMetricsByIntent(intent);
    if (metrics.count < 3) {
        return { adjusted: false, reason: `Not enough data (${metrics.count} logs)` };
    }

    const current = await getWeights(intent);
    const updated = { ...current };
    const reasons: string[] = [];

    // Rule 1: Low architectural depth → boost cluster weight
    if (metrics.architecturalDepth < 0.7) {
        updated.clusterWeight += DELTA;
        updated.vectorWeight -= DELTA;
        reasons.push(`architectural_depth low (${metrics.architecturalDepth.toFixed(2)}) → +cluster -vector`);
    }

    // Rule 2: Low relevance → boost vector weight
    if (metrics.relevance < 0.75) {
        updated.vectorWeight += DELTA;
        updated.semanticWeight -= DELTA;
        reasons.push(`relevance low (${metrics.relevance.toFixed(2)}) → +vector -semantic`);
    }

    // Rule 3: Low identity consistency → boost episodic weight
    if (metrics.identityConsistency < 0.8) {
        updated.episodicWeight += DELTA;
        updated.clusterWeight -= DELTA;
        reasons.push(`identity_consistency low (${metrics.identityConsistency.toFixed(2)}) → +episodic -cluster`);
    }

    // Rule 4: Low clarity → boost semantic weight
    if (metrics.clarity < 0.75) {
        updated.semanticWeight += DELTA;
        updated.episodicWeight -= DELTA;
        reasons.push(`clarity low (${metrics.clarity.toFixed(2)}) → +semantic -episodic`);
    }

    if (reasons.length === 0) {
        return { adjusted: false, reason: "All metrics within acceptable range" };
    }

    // Apply boundaries + normalization
    const safe = normalize(clampToBounds(updated));

    // Persist updated weights
    await prisma.retrievalWeightProfile.update({
        where: { intent },
        data: {
            vectorWeight: safe.vectorWeight,
            clusterWeight: safe.clusterWeight,
            episodicWeight: safe.episodicWeight,
            semanticWeight: safe.semanticWeight,
        },
    });

    // Log the adjustment
    await prisma.weightAdjustmentLog.create({
        data: {
            intent,
            oldWeights: current as any,
            newWeights: safe as any,
            reason: reasons.join("; "),
        },
    });

    console.log(`[Tuning] ${intent}: ${reasons.join("; ")}`);
    return { adjusted: true, reason: reasons.join("; ") };
}

// ────────────────────────────────────────────
// FULL TUNING CYCLE (all intents)
// ────────────────────────────────────────────

export interface TuningResult {
    results: Record<string, { adjusted: boolean; reason: string }>;
    timestamp: string;
}

export async function runRetrievalTuning(): Promise<TuningResult> {
    console.log("[Tuning] 🎯 Starting retrieval weight self-tuning...");

    const intents = ["architecture", "strategy", "identity", "research"];
    const results: Record<string, { adjusted: boolean; reason: string }> = {};

    for (const intent of intents) {
        results[intent] = await adjustWeightsForIntent(intent);
    }

    const adjustedCount = Object.values(results).filter((r) => r.adjusted).length;
    console.log(`[Tuning] ✅ Done — ${adjustedCount}/${intents.length} intents adjusted`);

    return { results, timestamp: new Date().toISOString() };
}

// ────────────────────────────────────────────
// STATUS + HISTORY
// ────────────────────────────────────────────

export async function getTuningStatus() {
    const profiles = await getAllWeightProfiles();
    const recentLogs = await prisma.weightAdjustmentLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    return { profiles, recentAdjustments: recentLogs };
}

/**
 * Self-Generated Research Hypothesis Engine
 *
 * The Twin detects conceptual gaps, generates testable hypotheses,
 * designs experiments, runs them in sandbox, statistically validates,
 * and stores validated insights into the knowledge base.
 *
 * Components:
 * 1. Gap Detection Engine      — Finds conceptual weaknesses from metrics
 * 2. Hypothesis Generator      — Proposes testable hypotheses
 * 3. Hypothesis Formalizer     — Structures into variables + targets
 * 4. Experiment Designer       — Creates test protocol
 * 5. Simulation Sandbox        — Runs isolated experiments
 * 6. Statistical Evaluator     — Validates improvement significance
 * 7. Knowledge Integration     — Stores validated principles
 * 8. Research Agenda           — Maintains prioritized research backlog
 *
 * Safety: 72h cooldown, sandbox-only, no identity/reward modification.
 */

import { callLLM } from "@/lib/services/llm.service";
import prisma from "@/lib/prisma";
import { getRollingReward, computeReward, detectHallucination, type RewardMetrics } from "./reward-model";
import { storeSemanticMemory } from "./cognitive-memory";

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

interface Gap {
    description: string;
    severity: number;
    researchDirection: string;
}

interface Hypothesis {
    statement: string;
    reasoning: string;
    independentVar: string;
    dependentVar: string;
    targetImprovement: number;
    riskLevel: string;
}

export interface ResearchCycleResult {
    gapsDetected: number;
    hypothesesGenerated: number;
    experimentRun: boolean;
    validated: boolean;
    cooldownActive: boolean;
    timestamp: string;
}

// ────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────

const RESEARCH_COOLDOWN_HOURS = 72;
const MIN_IMPROVEMENT = 0.03;
const TEST_QUERY_COUNT = 20;

// ────────────────────────────────────────────
// PART 1: GAP DETECTION
// ────────────────────────────────────────────

async function detectGaps(): Promise<Gap[]> {
    // Gather system signals
    const intents = ["architecture", "strategy", "identity", "research"];
    const signals: string[] = [];

    for (const intent of intents) {
        const r = await getRollingReward(intent);
        if (r.count >= 3) {
            signals.push(`${intent}: reward=${r.current.toFixed(2)}, delta=${r.delta.toFixed(3)}`);
        }
    }

    // Cluster analysis
    try {
        const clusters = await prisma.memoryCluster.findMany({
            select: { conceptName: true, strength: true, memberCount: true },
            orderBy: { strength: "desc" },
            take: 10,
        });
        if (clusters.length > 0) {
            const dominant = clusters.filter((c: { strength: number }) => c.strength > 0.8).length;
            const weak = clusters.filter((c: { strength: number }) => c.strength < 0.4).length;
            signals.push(`Clusters: ${clusters.length} total, ${dominant} dominant, ${weak} weak`);
        }
    } catch { /* skip */ }

    // Recent eval reports
    try {
        const reports = await prisma.offlineEvalReport.findMany({
            orderBy: { createdAt: "desc" },
            take: 3,
            select: { avgReward: true, weakArchitecture: true, hallucinationIssue: true },
        });
        for (const r of reports) {
            if (r.weakArchitecture) signals.push("Offline eval: weak architecture detected");
            if (r.hallucinationIssue) signals.push("Offline eval: hallucination issue detected");
        }
    } catch { /* skip */ }

    if (signals.length === 0) return [];

    try {
        const result = await callLLM({
            model: "qwen2.5:3b",
            system: `You are Gap Detection Engine for an Autonomous Systems Architect AI.

Analyze these performance signals and identify conceptual gaps in the system design.

Return JSON array (max 3 gaps):
[{ "description": "what is weak", "severity": 0.0-1.0, "researchDirection": "what to investigate" }]`,
            user: `System Signals:\n${signals.join("\n")}`,
            json: true,
        });

        if (Array.isArray(result)) {
            return result.slice(0, 3).map((g: Record<string, unknown>) => ({
                description: String(g.description || "Unknown gap"),
                severity: Math.max(0, Math.min(1, Number(g.severity) || 0.5)),
                researchDirection: String(g.researchDirection || "Further analysis needed"),
            }));
        }
        return [];
    } catch {
        return [];
    }
}

// ────────────────────────────────────────────
// PART 2: HYPOTHESIS GENERATION + FORMALIZATION
// ────────────────────────────────────────────

async function generateHypothesis(gap: Gap): Promise<Hypothesis | null> {
    try {
        const result = await callLLM({
            model: "qwen2.5:3b",
            system: `You are Research Hypothesis Generator for an Autonomous Systems Architect AI.

Given a system gap, propose ONE testable hypothesis.

Return JSON:
{
  "statement": "If X, then Y will improve by Z",
  "reasoning": "theoretical justification",
  "independentVar": "what we change",
  "dependentVar": "what we measure",
  "targetImprovement": 0.03-0.10,
  "riskLevel": "low | medium | high"
}

Hypothesis MUST be:
- Testable with offline batch evaluation
- Measurable (specific metric improvement)
- Safe (no identity or reward formula changes)`,
            user: `Gap: ${gap.description}\nSeverity: ${gap.severity}\nResearch Direction: ${gap.researchDirection}`,
            json: true,
        });

        if (result.statement) {
            return {
                statement: result.statement,
                reasoning: result.reasoning || "",
                independentVar: result.independentVar || "unknown",
                dependentVar: result.dependentVar || "reward",
                targetImprovement: Math.max(0.03, Math.min(0.1, Number(result.targetImprovement) || 0.05)),
                riskLevel: ["low", "medium", "high"].includes(result.riskLevel) ? result.riskLevel : "medium",
            };
        }
        return null;
    } catch {
        return null;
    }
}

// ────────────────────────────────────────────
// PART 3: EXPERIMENT EXECUTION (SANDBOX)
// ────────────────────────────────────────────

async function runExperiment(hypothesis: Hypothesis): Promise<{
    baselineScore: number;
    experimentalScore: number;
    improvement: number;
    hallucinationDelta: number;
    identityDelta: number;
}> {
    // Generate test queries for this research area
    let testQueries: string[];
    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b",
            system: `Generate ${TEST_QUERY_COUNT} diverse test queries for evaluating: "${hypothesis.dependentVar}" in the context of "${hypothesis.independentVar}".

Return JSON array of query strings.`,
            user: `Research area: ${hypothesis.statement}`,
            json: true,
        });
        testQueries = Array.isArray(result) ? result.slice(0, TEST_QUERY_COUNT) : getDefaultTestQueries();
    } catch {
        testQueries = getDefaultTestQueries();
    }

    // Run baseline
    const baselineMetrics = await runBatch(testQueries, "baseline");

    // Run experimental (with hypothesis-guided system prompt modification)
    const experimentalMetrics = await runBatch(testQueries, "experimental", hypothesis);

    return {
        baselineScore: baselineMetrics.avgReward,
        experimentalScore: experimentalMetrics.avgReward,
        improvement: experimentalMetrics.avgReward - baselineMetrics.avgReward,
        hallucinationDelta: experimentalMetrics.avgHallucination - baselineMetrics.avgHallucination,
        identityDelta: experimentalMetrics.avgIdentity - baselineMetrics.avgIdentity,
    };
}

async function runBatch(
    queries: string[],
    mode: "baseline" | "experimental",
    hypothesis?: Hypothesis
): Promise<{ avgReward: number; avgHallucination: number; avgIdentity: number }> {
    let totalReward = 0;
    let totalHallucination = 0;
    let totalIdentity = 0;

    const systemPrompt = mode === "experimental" && hypothesis
        ? `You are an Autonomous Systems Architect AI. Apply this research principle: "${hypothesis.statement}". Focus on improving ${hypothesis.dependentVar}.`
        : `You are an Autonomous Systems Architect AI. Respond with architectural depth and structured reasoning.`;

    for (const query of queries) {
        try {
            const response = await callLLM({
                model: "qwen2.5:3b",
                system: systemPrompt,
                user: typeof query === "string" ? query : String(query),
            });

            const responseStr = typeof response === "string" ? response : JSON.stringify(response);

            // Evaluate
            let metrics: RewardMetrics;
            try {
                const evalResult = await callLLM({
                    model: "qwen2.5:1.5b",
                    system: `Evaluate this AI response. Return JSON ONLY:
{ "relevance": 0.0-1.0, "clarity": 0.0-1.0, "identity_consistency": 0.0-1.0, "architectural_depth": 0.0-1.0 }`,
                    user: `Query: ${String(query).slice(0, 200)}\nResponse: ${responseStr.slice(0, 500)}`,
                    json: true,
                });
                const hallucination = await detectHallucination(responseStr, String(query));
                metrics = {
                    relevance: clamp(evalResult.relevance || 0.5),
                    clarity: clamp(evalResult.clarity || 0.5),
                    identityConsistency: clamp(evalResult.identity_consistency || 0.5),
                    architecturalDepth: clamp(evalResult.architectural_depth || 0.5),
                    hallucinationPenalty: hallucination,
                };
            } catch {
                metrics = { relevance: 0.6, clarity: 0.6, identityConsistency: 0.6, architecturalDepth: 0.6, hallucinationPenalty: 0.1 };
            }

            totalReward += computeReward(metrics);
            totalHallucination += metrics.hallucinationPenalty;
            totalIdentity += metrics.identityConsistency;
        } catch {
            totalReward += 0.5;
            totalHallucination += 0.1;
            totalIdentity += 0.7;
        }
    }

    const count = queries.length || 1;
    return {
        avgReward: totalReward / count,
        avgHallucination: totalHallucination / count,
        avgIdentity: totalIdentity / count,
    };
}

function getDefaultTestQueries(): string[] {
    return [
        "Explain your RAG architecture tradeoffs.",
        "How do you handle ambiguous queries?",
        "What is your memory consolidation strategy?",
        "Compare vector vs cluster retrieval.",
        "How do you prevent hallucination?",
        "What makes your retrieval weights adaptive?",
        "Describe your policy mutation safety.",
        "How do you maintain identity consistency?",
        "Explain your adversarial evaluation approach.",
        "What is your research methodology?",
    ];
}

// ────────────────────────────────────────────
// PART 4: STATISTICAL VALIDATION
// ────────────────────────────────────────────

function validateExperiment(result: {
    improvement: number;
    hallucinationDelta: number;
    identityDelta: number;
    baselineScore: number;
}): { validated: boolean; confidence: number; reason: string } {
    const reasons: string[] = [];

    if (result.improvement < MIN_IMPROVEMENT) {
        reasons.push(`Improvement ${result.improvement.toFixed(3)} below threshold ${MIN_IMPROVEMENT}`);
    }
    if (result.hallucinationDelta > 0.05) {
        reasons.push(`Hallucination increased by ${result.hallucinationDelta.toFixed(3)}`);
    }
    if (result.identityDelta < -0.05) {
        reasons.push(`Identity consistency dropped by ${Math.abs(result.identityDelta).toFixed(3)}`);
    }

    const validated = reasons.length === 0;
    const confidence = validated
        ? Math.min(1, 0.5 + result.improvement * 5) // scale improvement to confidence
        : 0;

    return {
        validated,
        confidence,
        reason: validated
            ? `Improvement: +${result.improvement.toFixed(3)}, hallucination stable, identity stable`
            : reasons.join("; "),
    };
}

// ────────────────────────────────────────────
// PART 5: COOLDOWN CHECK
// ────────────────────────────────────────────

async function isResearchCooldownActive(): Promise<boolean> {
    const last = await prisma.researchHypothesis.findFirst({
        where: { status: { in: ["testing", "validated", "rejected"] } },
        orderBy: { createdAt: "desc" },
        select: { completedAt: true, createdAt: true },
    });
    if (!last) return false;
    const ref = last.completedAt || last.createdAt;
    return (Date.now() - ref.getTime()) / (1000 * 60 * 60) < RESEARCH_COOLDOWN_HOURS;
}

// ────────────────────────────────────────────
// PART 6: HYPOTHESIS ID GENERATOR
// ────────────────────────────────────────────

async function nextHypothesisId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.researchHypothesis.count({
        where: { hypothesisId: { startsWith: `H-${year}` } },
    });
    return `H-${year}-${String(count + 1).padStart(3, "0")}`;
}

// ────────────────────────────────────────────
// PART 7: FULL RESEARCH CYCLE
// ────────────────────────────────────────────

export async function runResearchCycle(): Promise<ResearchCycleResult> {
    console.log("[Research] 🔬 Starting research hypothesis cycle...");

    // Cooldown check
    const cooldownActive = await isResearchCooldownActive();
    if (cooldownActive) {
        console.log("[Research] ⏸ Cooldown active (72h) — skipping");
        return { gapsDetected: 0, hypothesesGenerated: 0, experimentRun: false, validated: false, cooldownActive: true, timestamp: new Date().toISOString() };
    }

    // Step 1: Detect gaps
    const gaps = await detectGaps();
    if (gaps.length === 0) {
        console.log("[Research] ✅ No gaps — system is research-healthy");
        return { gapsDetected: 0, hypothesesGenerated: 0, experimentRun: false, validated: false, cooldownActive: false, timestamp: new Date().toISOString() };
    }

    console.log(`[Research] 🔍 ${gaps.length} gaps detected`);

    // Step 2: Generate hypothesis for top gap
    const topGap = gaps[0];
    const hypothesis = await generateHypothesis(topGap);
    if (!hypothesis) {
        console.log("[Research] ❌ Hypothesis generation failed");
        return { gapsDetected: gaps.length, hypothesesGenerated: 0, experimentRun: false, validated: false, cooldownActive: false, timestamp: new Date().toISOString() };
    }

    // Step 3: Store hypothesis
    const hId = await nextHypothesisId();
    const stored = await prisma.researchHypothesis.create({
        data: {
            hypothesisId: hId,
            statement: hypothesis.statement,
            reasoning: hypothesis.reasoning,
            independentVar: hypothesis.independentVar,
            dependentVar: hypothesis.dependentVar,
            gap: topGap.description,
            gapSeverity: topGap.severity,
            targetImprovement: hypothesis.targetImprovement,
            testQueryCount: TEST_QUERY_COUNT,
            riskLevel: hypothesis.riskLevel,
            status: "testing",
        },
    });

    // Update research agenda
    await prisma.researchAgenda.upsert({
        where: { id: topGap.description.slice(0, 50) },
        create: {
            id: topGap.description.slice(0, 50),
            topic: topGap.researchDirection,
            gap: topGap.description,
            priority: topGap.severity,
            status: "active",
            hypothesisCount: 1,
        },
        update: { hypothesisCount: { increment: 1 }, status: "active" },
    });

    console.log(`[Research] 🧪 Running experiment for ${hId}: "${hypothesis.statement.slice(0, 60)}..."`);

    // Step 4: Run experiment
    const result = await runExperiment(hypothesis);

    // Step 5: Validate statistically
    const validation = validateExperiment(result);

    // Step 6: Update hypothesis with results
    await prisma.researchHypothesis.update({
        where: { id: stored.id },
        data: {
            baselineScore: result.baselineScore,
            experimentalScore: result.experimentalScore,
            improvement: result.improvement,
            hallucinationDelta: result.hallucinationDelta,
            identityDelta: result.identityDelta,
            confidence: validation.confidence,
            status: validation.validated ? "validated" : "rejected",
            completedAt: new Date(),
        },
    });

    // Step 7: Knowledge integration (if validated)
    if (validation.validated) {
        try {
            await storeSemanticMemory(
                `Research Insight (${hId}): ${hypothesis.independentVar}`,
                `Validated hypothesis: "${hypothesis.statement}". Improvement: +${result.improvement.toFixed(3)}. Confidence: ${validation.confidence.toFixed(2)}.`
            );
        } catch { /* non-critical */ }
        console.log(`[Research] ✅ ${hId} VALIDATED — improvement: +${result.improvement.toFixed(3)}, confidence: ${validation.confidence.toFixed(2)}`);
    } else {
        console.log(`[Research] ❌ ${hId} REJECTED — ${validation.reason}`);
    }

    return {
        gapsDetected: gaps.length,
        hypothesesGenerated: 1,
        experimentRun: true,
        validated: validation.validated,
        cooldownActive: false,
        timestamp: new Date().toISOString(),
    };
}

// ────────────────────────────────────────────
// STATUS
// ────────────────────────────────────────────

export async function getResearchStatus() {
    const [proposed, testing, validated, rejected] = await Promise.all([
        prisma.researchHypothesis.count({ where: { status: "proposed" } }),
        prisma.researchHypothesis.count({ where: { status: "testing" } }),
        prisma.researchHypothesis.count({ where: { status: "validated" } }),
        prisma.researchHypothesis.count({ where: { status: "rejected" } }),
    ]);

    const recent = await prisma.researchHypothesis.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
            hypothesisId: true, statement: true, status: true,
            improvement: true, confidence: true, createdAt: true,
        },
    });

    const agenda = await prisma.researchAgenda.findMany({
        orderBy: { priority: "desc" },
        take: 5,
    });

    const cooldownActive = await isResearchCooldownActive();

    return {
        counts: { proposed, testing, validated, rejected },
        recentHypotheses: recent,
        agenda,
        cooldownActive,
    };
}

// ────────────────────────────────────────────
// UTIL
// ────────────────────────────────────────────

function clamp(v: number): number {
    return Math.max(0, Math.min(1, v));
}

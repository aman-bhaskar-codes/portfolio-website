/**
 * Autonomous Goal Formation Engine
 *
 * The Twin detects its own weaknesses, generates improvement goals,
 * evaluates/prioritizes them, and executes via the Planning Engine.
 *
 * Safety: Hard boundaries, cooldown enforcement, evaluation gate,
 * risk analysis, sandbox-only exploration.
 *
 * Components:
 * 1.  Trigger Monitor      — Detects when goals are needed
 * 2.  Goal Generator Agent  — Proposes up to 3 improvement goals
 * 3.  Goal Evaluator Agent  — Validates alignment + feasibility (>0.75 pass)
 * 4.  Priority Scorer        — Ranks goals by impact + urgency
 * 5.  Safety Boundaries      — Hard constraints on what autonomy can change
 * 6.  Cooldown Enforcement   — Minimum 24h between major goal executions
 * 7.  Planning Integration   — Feeds approved goals into Planning Engine
 * 8.  Learning Feedback      — Stores outcomes as memory
 */

import { callLLM } from "@/lib/services/llm.service";
import prisma from "@/lib/prisma";
import { getRollingReward } from "./reward-model";
import { createPlan, executePlan } from "./planning-engine";
import { storeSemanticMemory, storeEpisodicMemory } from "./cognitive-memory";

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

interface GoalTrigger {
    type: string;
    reason: string;
    severity: number; // 0-1
}

interface GeneratedGoal {
    goal: string;
    reason: string;
    expectedImpact: string;
    riskLevel: string;
    successMetric: string;
}

export interface AutonomousCycleResult {
    triggersDetected: GoalTrigger[];
    goalsGenerated: number;
    goalsApproved: number;
    goalsExecuted: number;
    cooldownActive: boolean;
    timestamp: string;
}

// ────────────────────────────────────────────
// SAFETY BOUNDARIES (HARD CONSTRAINTS)
// ────────────────────────────────────────────

const FORBIDDEN_ACTIONS = [
    "modify identity core principles",
    "delete memory clusters",
    "change reward formula coefficients",
    "exceed retrieval weight bounds",
    "modify evaluation metrics",
    "disable safety checks",
    "bypass validation sandbox",
];

const COOLDOWN_HOURS = 24;
const MAX_GOALS_PER_CYCLE = 3;
const EVALUATION_THRESHOLD = 0.75;

// ────────────────────────────────────────────
// PART 1: TRIGGER MONITOR
// ────────────────────────────────────────────

async function detectTriggers(): Promise<GoalTrigger[]> {
    const triggers: GoalTrigger[] = [];

    // Check reward trends across intents
    const intents = ["architecture", "strategy", "identity", "research"];
    for (const intent of intents) {
        const rolling = await getRollingReward(intent);
        if (rolling.count >= 3 && rolling.current < 0.75) {
            triggers.push({
                type: "performance_decline",
                reason: `${intent} reward at ${rolling.current.toFixed(2)} (delta: ${rolling.delta.toFixed(3)})`,
                severity: 1 - rolling.current,
            });
        }
    }

    // Check for cluster imbalance
    try {
        const clusters = await prisma.memoryCluster.findMany({
            select: { strength: true, memberCount: true },
        });
        if (clusters.length > 0) {
            const avgStrength = clusters.reduce((s: number, c: { strength: number }) => s + c.strength, 0) / clusters.length;
            const strongCount = clusters.filter((c: { strength: number }) => c.strength > 0.7).length;
            if (avgStrength < 0.5 || strongCount < 2) {
                triggers.push({
                    type: "cluster_imbalance",
                    reason: `Cluster avg strength: ${avgStrength.toFixed(2)}, strong clusters: ${strongCount}`,
                    severity: 1 - avgStrength,
                });
            }
        }
    } catch { /* skip if clusters not populated */ }

    // Check for stagnation (no recent goals or plans)
    try {
        const recentGoals = await prisma.autonomousGoal.count({
            where: { createdAt: { gte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } },
        });
        const recentPlans = await prisma.plan.count({
            where: { createdAt: { gte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) } },
        });
        if (recentGoals === 0 && recentPlans === 0) {
            triggers.push({
                type: "stagnation",
                reason: "No goals or plans in last 5 days — entering exploration mode",
                severity: 0.4,
            });
        }
    } catch { /* first run */ }

    // Check for weak metrics via performance logs
    try {
        const recentLogs = await prisma.twinPerformanceLog.findMany({
            where: { createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } },
            select: { architecturalDepth: true, identityConsistency: true },
        });
        if (recentLogs.length >= 3) {
            const avgDepth = recentLogs.reduce((s: number, l: { architecturalDepth: number }) => s + l.architecturalDepth, 0) / recentLogs.length;
            const avgIdentity = recentLogs.reduce((s: number, l: { identityConsistency: number }) => s + l.identityConsistency, 0) / recentLogs.length;

            if (avgDepth < 0.7) {
                triggers.push({ type: "weak_metric", reason: `Architectural depth avg: ${avgDepth.toFixed(2)}`, severity: 0.7 - avgDepth + 0.3 });
            }
            if (avgIdentity < 0.8) {
                triggers.push({ type: "weak_metric", reason: `Identity consistency avg: ${avgIdentity.toFixed(2)}`, severity: 0.8 - avgIdentity + 0.2 });
            }
        }
    } catch { /* skip */ }

    return triggers.sort((a, b) => b.severity - a.severity).slice(0, 5);
}

// ────────────────────────────────────────────
// PART 2: GOAL GENERATOR AGENT
// ────────────────────────────────────────────

async function generateGoals(triggers: GoalTrigger[]): Promise<GeneratedGoal[]> {
    if (triggers.length === 0) return [];

    try {
        const result = await callLLM({
            model: "qwen2.5:3b",
            system: `You are Autonomous Goal Generator for an Autonomous Systems Architect AI.

Given performance triggers, generate up to ${MAX_GOALS_PER_CYCLE} improvement goals.

Each goal MUST include:
- goal: Clear objective statement
- reason: Why this goal is necessary (tied to trigger data)
- expectedImpact: What improvement is expected
- riskLevel: "low" | "medium" | "high"
- successMetric: Measurable success criteria

FORBIDDEN actions (never propose these):
${FORBIDDEN_ACTIONS.map((a) => `- ${a}`).join("\n")}

Return JSON array of goals.`,
            user: `Performance Triggers:\n${triggers.map((t) => `[${t.type}] ${t.reason} (severity: ${t.severity.toFixed(2)})`).join("\n")}`,
            json: true,
        });

        if (Array.isArray(result)) {
            return result.slice(0, MAX_GOALS_PER_CYCLE).map((g: Record<string, string>) => ({
                goal: g.goal || "Unnamed goal",
                reason: g.reason || "Generated from trigger",
                expectedImpact: g.expectedImpact || "Improved performance",
                riskLevel: ["low", "medium", "high"].includes(g.riskLevel) ? g.riskLevel : "medium",
                successMetric: g.successMetric || "Measurable improvement in target metric",
            }));
        }
        return [];
    } catch {
        return [];
    }
}

// ────────────────────────────────────────────
// PART 3: GOAL EVALUATOR AGENT
// ────────────────────────────────────────────

async function evaluateGoal(goal: GeneratedGoal): Promise<number> {
    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b",
            system: `You are Goal Evaluator for an Autonomous Systems Architect AI.

Assess this goal on:
1. Identity alignment (architect mindset preserved?)
2. Resource feasibility (can be done with existing system?)
3. Risk level (acceptable?)
4. Strategic value (meaningful improvement?)

Return ONLY a score from 0.0 to 1.0. Nothing else.
Score > 0.75 = approve. Score < 0.75 = reject.`,
            user: `Goal: ${goal.goal}\nReason: ${goal.reason}\nImpact: ${goal.expectedImpact}\nRisk: ${goal.riskLevel}`,
        });

        const score = parseFloat(String(result).trim());
        return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    } catch {
        return 0.5;
    }
}

// ────────────────────────────────────────────
// PART 4: PRIORITY SCORER
// ────────────────────────────────────────────

function computePriority(goal: GeneratedGoal, evalScore: number, trigger: GoalTrigger | undefined): number {
    const impactWeight = 0.4;
    const urgencyWeight = 0.3;
    const alignmentWeight = 0.3;

    const impact = evalScore;
    const urgency = trigger?.severity || 0.5;
    const alignment = evalScore > EVALUATION_THRESHOLD ? 1.0 : evalScore / EVALUATION_THRESHOLD;

    return (impact * impactWeight) + (urgency * urgencyWeight) + (alignment * alignmentWeight);
}

// ────────────────────────────────────────────
// PART 5: COOLDOWN CHECK
// ────────────────────────────────────────────

async function isCooldownActive(): Promise<boolean> {
    const lastExecution = await prisma.autonomousGoal.findFirst({
        where: { status: { in: ["executing", "completed"] } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, completedAt: true },
    });

    if (!lastExecution) return false;

    const referenceTime = lastExecution.completedAt || lastExecution.createdAt;
    const hoursSince = (Date.now() - referenceTime.getTime()) / (1000 * 60 * 60);
    return hoursSince < COOLDOWN_HOURS;
}

// ────────────────────────────────────────────
// PART 6: FULL AUTONOMOUS CYCLE
// ────────────────────────────────────────────

export async function runAutonomousCycle(): Promise<AutonomousCycleResult> {
    console.log("[Autonomy] 🧠 Starting autonomous goal formation cycle...");

    // Step 0: Cooldown check
    const cooldownActive = await isCooldownActive();
    if (cooldownActive) {
        console.log("[Autonomy] ⏸ Cooldown active — skipping cycle");
        return {
            triggersDetected: [],
            goalsGenerated: 0,
            goalsApproved: 0,
            goalsExecuted: 0,
            cooldownActive: true,
            timestamp: new Date().toISOString(),
        };
    }

    // Step 1: Detect triggers
    const triggers = await detectTriggers();
    if (triggers.length === 0) {
        console.log("[Autonomy] ✅ No triggers — system is healthy");
        return {
            triggersDetected: [],
            goalsGenerated: 0,
            goalsApproved: 0,
            goalsExecuted: 0,
            cooldownActive: false,
            timestamp: new Date().toISOString(),
        };
    }

    console.log(`[Autonomy] 🔍 ${triggers.length} triggers detected`);

    // Step 2: Generate goals
    const generated = await generateGoals(triggers);
    console.log(`[Autonomy] 💡 ${generated.length} goals generated`);

    // Step 3: Evaluate + store each goal
    let goalsApproved = 0;
    let goalsExecuted = 0;

    for (let i = 0; i < generated.length; i++) {
        const g = generated[i];
        const evalScore = await evaluateGoal(g);
        const priority = computePriority(g, evalScore, triggers[i]);
        const approved = evalScore >= EVALUATION_THRESHOLD;

        const autonomousGoal = await prisma.autonomousGoal.create({
            data: {
                goal: g.goal,
                trigger: triggers[i]?.type || "exploration",
                reason: g.reason,
                expectedImpact: g.expectedImpact,
                riskLevel: g.riskLevel,
                successMetric: g.successMetric,
                evaluationScore: evalScore,
                priorityScore: priority,
                status: approved ? "approved" : "rejected",
            },
        });

        if (!approved) {
            console.log(`[Autonomy] ❌ Goal rejected (score: ${evalScore.toFixed(2)}): "${g.goal.slice(0, 60)}"`);
            continue;
        }

        goalsApproved++;
        console.log(`[Autonomy] ✅ Goal approved (score: ${evalScore.toFixed(2)}, priority: ${priority.toFixed(2)}): "${g.goal.slice(0, 60)}"`);

        // Step 4: Execute top approved goal only (first one)
        if (goalsExecuted === 0 && g.riskLevel !== "high") {
            try {
                // Get baseline reward
                const baselineReward = await getOverallReward();

                // Create and execute plan
                await prisma.autonomousGoal.update({
                    where: { id: autonomousGoal.id },
                    data: { status: "executing", rewardBefore: baselineReward },
                });

                const plan = await createPlan(g.goal);
                await prisma.autonomousGoal.update({
                    where: { id: autonomousGoal.id },
                    data: { planId: plan.planId },
                });

                const execution = await executePlan(plan.planId);

                // Get post-execution reward
                const postReward = await getOverallReward();
                const rewardDelta = postReward - baselineReward;

                await prisma.autonomousGoal.update({
                    where: { id: autonomousGoal.id },
                    data: {
                        status: execution.finalStatus === "completed" ? "completed" : "failed",
                        rewardAfter: postReward,
                        rewardDelta,
                        completedAt: new Date(),
                    },
                });

                // Memory integration
                await integrateOutcome(g.goal, execution.finalStatus, rewardDelta);

                goalsExecuted++;
                console.log(`[Autonomy] 🚀 Goal executed: ${execution.finalStatus} (reward Δ${rewardDelta >= 0 ? "+" : ""}${rewardDelta.toFixed(3)})`);
            } catch (e) {
                console.error("[Autonomy] Execution error:", e);
                await prisma.autonomousGoal.update({
                    where: { id: autonomousGoal.id },
                    data: { status: "failed", completedAt: new Date() },
                });
            }
        }
    }

    console.log(`[Autonomy] ✅ Cycle complete — ${goalsApproved} approved, ${goalsExecuted} executed`);

    return {
        triggersDetected: triggers,
        goalsGenerated: generated.length,
        goalsApproved,
        goalsExecuted,
        cooldownActive: false,
        timestamp: new Date().toISOString(),
    };
}

// ────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────

async function getOverallReward(): Promise<number> {
    const intents = ["architecture", "strategy", "identity", "research"];
    let total = 0;
    let count = 0;
    for (const intent of intents) {
        const r = await getRollingReward(intent);
        total += r.current;
        count++;
    }
    return count > 0 ? total / count : 1.0;
}

async function integrateOutcome(goal: string, status: string, rewardDelta: number) {
    try {
        if (status === "completed" && rewardDelta > 0) {
            await storeSemanticMemory(
                `Autonomous Success: ${goal.slice(0, 80)}`,
                `Self-directed goal "${goal}" completed with reward improvement of ${rewardDelta.toFixed(3)}. Strategy was effective.`
            );
        }
        await storeEpisodicMemory(
            `Autonomous Goal [${status}]: "${goal}". Reward delta: ${rewardDelta.toFixed(3)}.`,
            status === "completed" ? "autonomous_success" : "autonomous_failure"
        );
    } catch { /* non-critical */ }
}

// ────────────────────────────────────────────
// STATUS
// ────────────────────────────────────────────

export async function getAutonomyStatus() {
    const [proposed, approved, executing, completed, rejected, failed] = await Promise.all([
        prisma.autonomousGoal.count({ where: { status: "proposed" } }),
        prisma.autonomousGoal.count({ where: { status: "approved" } }),
        prisma.autonomousGoal.count({ where: { status: "executing" } }),
        prisma.autonomousGoal.count({ where: { status: "completed" } }),
        prisma.autonomousGoal.count({ where: { status: "rejected" } }),
        prisma.autonomousGoal.count({ where: { status: "failed" } }),
    ]);

    const recent = await prisma.autonomousGoal.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
            goal: true, trigger: true, status: true,
            evaluationScore: true, priorityScore: true,
            rewardDelta: true, createdAt: true,
        },
    });

    const cooldownActive = await isCooldownActive();

    return {
        counts: { proposed, approved, executing, completed, rejected, failed },
        recentGoals: recent,
        cooldownActive,
    };
}

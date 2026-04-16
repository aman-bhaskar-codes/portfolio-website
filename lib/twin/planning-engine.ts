/**
 * Long-Horizon Multi-Step Planning Engine
 *
 * Transforms the Twin from a reactive responder into an
 * autonomous strategic planner.
 *
 * Components:
 * 1. Goal Interpreter      — Structures user goals
 * 2. Planner Agent         — Generates multi-step roadmap
 * 3. Risk Analyzer         — Predicts failure modes before execution
 * 4. Execution Loop        — Steps through plan with reward monitoring
 * 5. Adaptive Replanner    — Modifies plan if reward drops
 * 6. Memory Integration    — Stores successes/failures as learning
 * 7. Cross-session persistence — Plans survive restarts
 */

import { callLLM } from "@/lib/services/llm.service";
import prisma from "@/lib/prisma";
import { storeEpisodicMemory, storeSemanticMemory } from "./cognitive-memory";

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

interface StructuredGoal {
    goalType: string;
    domain: string;
    constraints: string[];
    successCriteria: string;
    complexity: "simple" | "standard" | "complex";
}

interface PlannedStep {
    title: string;
    description: string;
    dependsOn: number[];
}

export interface PlanCreationResult {
    planId: string;
    goal: string;
    steps: number;
    complexity: string;
    riskAssessment: string;
}

export interface StepExecutionResult {
    stepIndex: number;
    title: string;
    status: string;
    output: string;
    rewardDelta: number | null;
}

export interface PlanExecutionResult {
    planId: string;
    stepsExecuted: number;
    stepsCompleted: number;
    stepsFailed: number;
    replanned: boolean;
    finalStatus: string;
}

// ────────────────────────────────────────────
// PART 1: GOAL INTERPRETER
// ────────────────────────────────────────────

async function interpretGoal(userGoal: string): Promise<StructuredGoal> {
    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b",
            system: `Extract a structured goal from the user's request for an Autonomous Systems Architect AI.

Return JSON ONLY:
{
  "goalType": "architecture_optimization | research | strategy | improvement | analysis",
  "domain": "specific area (e.g., RAG, memory, retrieval, identity)",
  "constraints": ["list of constraints"],
  "successCriteria": "what defines success",
  "complexity": "simple | standard | complex"
}`,
            user: userGoal,
            json: true,
        });

        return {
            goalType: result.goalType || "improvement",
            domain: result.domain || "general",
            constraints: Array.isArray(result.constraints) ? result.constraints : [],
            successCriteria: result.successCriteria || "measurable improvement",
            complexity: ["simple", "standard", "complex"].includes(result.complexity) ? result.complexity : "standard",
        };
    } catch {
        return { goalType: "improvement", domain: "general", constraints: [], successCriteria: "measurable improvement", complexity: "standard" };
    }
}

// ────────────────────────────────────────────
// PART 2: PLANNER AGENT
// ────────────────────────────────────────────

async function generatePlan(goal: string, structured: StructuredGoal): Promise<PlannedStep[]> {
    try {
        const result = await callLLM({
            model: "qwen2.5:3b",
            system: `You are Planning Agent for an Autonomous Systems Architect AI.

Break the goal into ordered, executable steps. Rules:
- Each step must be concrete and actionable
- Include a validation step
- Include a rollback/safety step
- Include a memory update step at the end
- Maximum 8 steps
- Steps can declare dependencies (indices of prerequisite steps)

Return JSON array:
[{ "title": "Step title", "description": "What to do", "dependsOn": [] }]`,
            user: `Goal: ${goal}\nType: ${structured.goalType}\nDomain: ${structured.domain}\nComplexity: ${structured.complexity}\nConstraints: ${structured.constraints.join(", ")}\nSuccess: ${structured.successCriteria}`,
            json: true,
        });

        if (Array.isArray(result) && result.length > 0) {
            return result.slice(0, 8).map((s: { title?: string; description?: string; dependsOn?: number[] }) => ({
                title: s.title || "Unnamed Step",
                description: s.description || "",
                dependsOn: Array.isArray(s.dependsOn) ? s.dependsOn : [],
            }));
        }
        return getDefaultPlan(goal);
    } catch {
        return getDefaultPlan(goal);
    }
}

function getDefaultPlan(goal: string): PlannedStep[] {
    return [
        { title: "Analyze Current State", description: `Evaluate current system state relevant to: ${goal}`, dependsOn: [] },
        { title: "Identify Weaknesses", description: "Analyze performance metrics and identify gaps", dependsOn: [0] },
        { title: "Propose Improvements", description: "Generate concrete improvement proposals", dependsOn: [1] },
        { title: "Simulate Changes", description: "Run offline evaluation of proposed changes", dependsOn: [2] },
        { title: "Validate Results", description: "Compare simulated results against baseline", dependsOn: [3] },
        { title: "Apply or Rollback", description: "Commit improvements if validated, rollback if degraded", dependsOn: [4] },
        { title: "Store Learning", description: "Record outcomes and principles in memory system", dependsOn: [5] },
    ];
}

// ────────────────────────────────────────────
// PART 3: RISK ANALYZER
// ────────────────────────────────────────────

async function analyzeRisks(goal: string, steps: PlannedStep[]): Promise<string> {
    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b",
            system: `Analyze potential risks in executing this plan for an Autonomous Systems Architect AI.

Identify:
1. Performance regression risk
2. Memory corruption risk
3. Identity drift risk
4. Execution failure scenarios

Be concise. Max 4 bullet points.`,
            user: `Goal: ${goal}\nSteps:\n${steps.map((s, i) => `${i + 1}. ${s.title}: ${s.description}`).join("\n")}`,
        });
        return typeof result === "string" ? result : JSON.stringify(result);
    } catch {
        return "Risk analysis unavailable. Proceed with standard safety checks.";
    }
}

// ────────────────────────────────────────────
// CREATE PLAN
// ────────────────────────────────────────────

export async function createPlan(userGoal: string, parentPlanId?: string): Promise<PlanCreationResult> {
    console.log(`[Planning] 📋 Creating plan for: "${userGoal.slice(0, 80)}..."`);

    // Step 1: Interpret goal
    const structured = await interpretGoal(userGoal);

    // Step 2: Generate steps
    const steps = await generatePlan(userGoal, structured);

    // Step 3: Analyze risks
    const riskAssessment = await analyzeRisks(userGoal, steps);

    // Step 4: Persist plan
    const plan = await prisma.plan.create({
        data: {
            goal: userGoal,
            goalType: structured.goalType,
            domain: structured.domain,
            priority: structured.complexity === "complex" ? 0.9 : structured.complexity === "standard" ? 0.7 : 0.5,
            complexity: structured.complexity,
            status: "active",
            riskAssessment,
            totalSteps: steps.length,
            parentPlanId,
            steps: {
                create: steps.map((s, i) => ({
                    stepIndex: i,
                    title: s.title,
                    description: s.description,
                    dependsOn: s.dependsOn,
                    status: "pending",
                })),
            },
        },
    });

    console.log(`[Planning] ✅ Plan created: ${plan.id} (${steps.length} steps, ${structured.complexity})`);

    return {
        planId: plan.id,
        goal: userGoal,
        steps: steps.length,
        complexity: structured.complexity,
        riskAssessment,
    };
}

// ────────────────────────────────────────────
// PART 4: EXECUTION LOOP
// ────────────────────────────────────────────

export async function executeNextStep(planId: string): Promise<StepExecutionResult | null> {
    const plan = await prisma.plan.findUnique({
        where: { id: planId },
        include: { steps: { orderBy: { stepIndex: "asc" } } },
    });

    if (!plan || plan.status === "completed" || plan.status === "failed") {
        return null;
    }

    // Find next pending step whose dependencies are met
    const nextStep = plan.steps.find((s: { status: string; dependsOn: number[] }) => {
        if (s.status !== "pending") return false;
        return s.dependsOn.every((dep: number) => {
            const depStep = plan.steps.find((d: { stepIndex: number }) => d.stepIndex === dep);
            return depStep && depStep.status === "completed";
        });
    });

    if (!nextStep) {
        // All steps done or blocked
        const allDone = plan.steps.every((s: { status: string }) => s.status === "completed" || s.status === "skipped");
        if (allDone) {
            await prisma.plan.update({ where: { id: planId }, data: { status: "completed", progress: 1.0 } });
            await onPlanComplete(plan.goal, "completed");
        }
        return null;
    }

    // Mark step as running
    await prisma.planStep.update({
        where: { id: nextStep.id },
        data: { status: "running" },
    });

    // Execute step via LLM
    let output: string;
    try {
        const result = await callLLM({
            model: "qwen2.5:3b",
            system: `You are executing a step in a long-horizon plan as an Autonomous Systems Architect AI.

Step: ${nextStep.title}
Description: ${nextStep.description}
Overall Goal: ${plan.goal}

Execute this step. Provide concrete output, analysis, or recommendations.
Be structured and specific.`,
            user: `Execute step ${nextStep.stepIndex + 1}: ${nextStep.title}`,
        });
        output = typeof result === "string" ? result : JSON.stringify(result);
    } catch {
        output = "Step execution failed due to LLM error.";
    }

    // Evaluate step reward
    let rewardDelta: number | null = null;
    try {
        const evalResult = await callLLM({
            model: "qwen2.5:1.5b",
            system: `Rate the quality of this step execution 0.0-1.0. Return ONLY a number.`,
            user: `Step: ${nextStep.title}\nOutput: ${output.slice(0, 500)}`,
        });
        const reward = parseFloat(String(evalResult).trim());
        rewardDelta = isNaN(reward) ? null : reward;
    } catch {
        // Non-critical
    }

    // Check if step failed (reward < 0.3)
    const stepFailed = rewardDelta !== null && rewardDelta < 0.3;

    // Update step
    await prisma.planStep.update({
        where: { id: nextStep.id },
        data: {
            status: stepFailed ? "failed" : "completed",
            output: output.slice(0, 5000),
            rewardAfter: rewardDelta,
            rewardDelta,
            completedAt: new Date(),
        },
    });

    // Update plan progress
    const completedCount = plan.steps.filter((s: { status: string }) => s.status === "completed").length + (stepFailed ? 0 : 1);
    const progress = completedCount / plan.totalSteps;

    await prisma.plan.update({
        where: { id: planId },
        data: {
            currentStepIdx: nextStep.stepIndex + 1,
            progress,
            status: stepFailed ? "replanning" : "active",
        },
    });

    // If step failed → trigger replanning
    if (stepFailed) {
        await triggerReplan(planId, nextStep.stepIndex, output);
    }

    return {
        stepIndex: nextStep.stepIndex,
        title: nextStep.title,
        status: stepFailed ? "failed" : "completed",
        output,
        rewardDelta,
    };
}

// ────────────────────────────────────────────
// PART 5: ADAPTIVE REPLANNING
// ────────────────────────────────────────────

async function triggerReplan(planId: string, failedStepIdx: number, failureOutput: string) {
    console.log(`[Planning] 🔄 Replanning after step ${failedStepIdx} failure`);

    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b",
            system: `A plan step has failed. Suggest a safer alternative approach.

Return JSON:
{ "title": "alternative step title", "description": "what to do instead" }`,
            user: `Failed step index: ${failedStepIdx}\nFailure output: ${failureOutput.slice(0, 500)}`,
            json: true,
        });

        if (result.title && result.description) {
            // Add alternative step after failed step
            const maxStep = await prisma.planStep.findFirst({
                where: { planId },
                orderBy: { stepIndex: "desc" },
                select: { stepIndex: true },
            });

            await prisma.planStep.create({
                data: {
                    planId,
                    stepIndex: (maxStep?.stepIndex || 0) + 1,
                    title: `[REPLAN] ${result.title}`,
                    description: result.description,
                    dependsOn: [],
                    status: "pending",
                },
            });

            await prisma.plan.update({
                where: { id: planId },
                data: { status: "active", totalSteps: { increment: 1 } },
            });
        }
    } catch {
        // If replanning fails, mark plan as failed
        await prisma.plan.update({ where: { id: planId }, data: { status: "failed" } });
    }
}

// ────────────────────────────────────────────
// PART 6: EXECUTE FULL PLAN
// ────────────────────────────────────────────

export async function executePlan(planId: string): Promise<PlanExecutionResult> {
    console.log(`[Planning] 🚀 Executing plan: ${planId}`);

    let stepsExecuted = 0;
    let stepsCompleted = 0;
    let stepsFailed = 0;
    let replanned = false;

    // Execute steps until done (max 15 iterations for safety)
    for (let i = 0; i < 15; i++) {
        const result = await executeNextStep(planId);
        if (!result) break;

        stepsExecuted++;
        if (result.status === "completed") stepsCompleted++;
        if (result.status === "failed") { stepsFailed++; replanned = true; }
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId }, select: { status: true } });

    console.log(`[Planning] ✅ Plan execution done — ${stepsCompleted}/${stepsExecuted} completed`);

    return {
        planId,
        stepsExecuted,
        stepsCompleted,
        stepsFailed,
        replanned,
        finalStatus: plan?.status || "unknown",
    };
}

// ────────────────────────────────────────────
// PART 7: MEMORY INTEGRATION
// ────────────────────────────────────────────

async function onPlanComplete(goal: string, status: string) {
    try {
        if (status === "completed") {
            await storeSemanticMemory(
                `Successful Plan: ${goal.slice(0, 100)}`,
                `Completed a multi-step plan: "${goal}". Strategy was effective.`
            );
        }
        await storeEpisodicMemory(
            `Plan ${status}: "${goal}". Outcome recorded for future planning.`,
            status === "completed" ? "success" : "failure"
        );
    } catch {
        // Non-critical
    }
}

// ────────────────────────────────────────────
// STATUS + QUERIES
// ────────────────────────────────────────────

export async function getActivePlans() {
    return prisma.plan.findMany({
        where: { status: { in: ["active", "paused", "replanning"] } },
        orderBy: { priority: "desc" },
        include: {
            steps: { orderBy: { stepIndex: "asc" }, select: { stepIndex: true, title: true, status: true } },
        },
    });
}

export async function getPlanningStatus() {
    const [active, completed, failed, total] = await Promise.all([
        prisma.plan.count({ where: { status: "active" } }),
        prisma.plan.count({ where: { status: "completed" } }),
        prisma.plan.count({ where: { status: "failed" } }),
        prisma.plan.count(),
    ]);

    const recentPlans = await prisma.plan.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
            id: true, goal: true, status: true, complexity: true,
            progress: true, totalSteps: true, createdAt: true,
        },
    });

    return { counts: { active, completed, failed, total }, recentPlans };
}

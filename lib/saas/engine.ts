/**
 * CognitiveEngine — Tenant-Scoped AI Engine Instance
 *
 * Each tenant gets an isolated cognitive engine that:
 * - Responds to queries (RAG + Debate + Meta-cognition)
 * - Plans multi-step strategies
 * - Runs autonomous cycles
 * - Executes tools safely
 * - Tracks all usage
 *
 * Feature gates based on plan (free/pro/enterprise).
 */

import { callLLM } from "@/lib/services/llm.service";
import { recordUsage } from "./metering";
import { type AuthContext } from "./auth";
import { logStage, generateTraceId } from "@/lib/observability/trace";

// ────────────────────────────────────────────
// ENGINE CLASS
// ────────────────────────────────────────────

export class CognitiveEngine {
    private tenantId: string;
    private subscriptionPlan: string;
    private features: Record<string, boolean>;

    constructor(auth: AuthContext) {
        this.tenantId = auth.tenantId;
        this.subscriptionPlan = auth.plan;
        this.features = auth.features;
    }

    // ────────────────────────────────────────
    // RESPOND — Core query answering
    // ────────────────────────────────────────

    async respond(query: string, options?: { debate?: boolean; metacognition?: boolean }): Promise<{
        response: string;
        traceId: string;
        debate?: string;
        confidence?: number;
        tokensUsed: number;
    }> {
        const traceId = generateTraceId();
        const start = Date.now();

        // Step 1: Core LLM response
        const result = await callLLM({
            model: "qwen2.5:3b",
            system: `You are Cognify AI Agent for tenant ${this.tenantId}.
You are an expert AI assistant. Respond thoroughly with structured reasoning.`,
            user: query,
        });

        const response = typeof result === "string" ? result : JSON.stringify(result);
        const tokensEstimate = Math.ceil((query.length + response.length) / 4);

        await logStage(traceId, "respond", { tenant: this.tenantId, queryLength: query.length }, {
            latencyMs: Date.now() - start,
            tokenCount: tokensEstimate,
            model: "qwen2.5:3b",
        });

        await recordUsage(this.tenantId, "tokens", tokensEstimate);
        await recordUsage(this.tenantId, "llm_call");

        // Step 2: Debate (Pro+)
        let debate: string | undefined;
        let confidence: number | undefined;

        if ((options?.debate || this.subscriptionPlan !== "free") && this.features.debate) {
            try {
                const debateResult = await callLLM({
                    model: "qwen2.5:1.5b",
                    system: `You are Skeptic Agent. Evaluate this response for weaknesses, hallucinations, and missing context.
Return JSON: { "critique": "...", "confidence": 0.0-1.0 }`,
                    user: `Query: ${query}\n\nResponse: ${response.slice(0, 500)}`,
                    json: true,
                });

                debate = String(debateResult.critique || "");
                confidence = Number(debateResult.confidence) || 0.7;
                await recordUsage(this.tenantId, "debate");
                await recordUsage(this.tenantId, "llm_call");
            } catch { /* debate is non-critical */ }
        }

        return { response, traceId, debate, confidence, tokensUsed: tokensEstimate };
    }

    // ────────────────────────────────────────
    // PLAN — Strategic multi-step planning
    // ────────────────────────────────────────

    async plan(goal: string): Promise<{
        steps: { step: number; action: string; risk: string }[];
        traceId: string;
    }> {
        if (!this.features.autonomy && this.subscriptionPlan === "free") {
            return { steps: [{ step: 1, action: "Planning requires Pro plan", risk: "none" }], traceId: "" };
        }

        const traceId = generateTraceId();

        const result = await callLLM({
            model: "qwen2.5:3b",
            system: `You are Strategic Planner. Break down goals into actionable steps.
Return JSON: { "steps": [{ "step": 1, "action": "...", "risk": "low|medium|high" }] }`,
            user: `Goal: ${goal}`,
            json: true,
        });

        const steps = Array.isArray(result.steps) ? result.steps : [{ step: 1, action: String(result), risk: "low" }];

        await logStage(traceId, "plan", { tenant: this.tenantId, goal: goal.slice(0, 100) });
        await recordUsage(this.tenantId, "planning");
        await recordUsage(this.tenantId, "llm_call");

        return { steps, traceId };
    }

    // ────────────────────────────────────────
    // SWARM — Multi-twin evaluation
    // ────────────────────────────────────────

    async swarm(goal: string): Promise<{
        consensus: string;
        proposals: { twin: string; summary: string }[];
        traceId: string;
    }> {
        if (!this.features.swarm) {
            return { consensus: "Swarm requires Pro plan", proposals: [], traceId: "" };
        }

        const traceId = generateTraceId();

        // Run simplified swarm — 3 perspectives
        const perspectives = ["Architecture", "Research", "Safety"];
        const proposals: { twin: string; summary: string }[] = [];

        for (const perspective of perspectives) {
            try {
                const r = await callLLM({
                    model: "qwen2.5:1.5b",
                    system: `You are ${perspective} Twin. Evaluate this goal from your perspective.
Return JSON: { "summary": "your key insight" }`,
                    user: `Goal: ${goal}`,
                    json: true,
                });
                proposals.push({ twin: perspective.toLowerCase(), summary: String(r.summary || "") });
                await recordUsage(this.tenantId, "llm_call");
            } catch { /* skip failed twin */ }
        }

        // Synthesize
        const synthResult = await callLLM({
            model: "qwen2.5:3b",
            system: `Synthesize these perspectives into a unified strategy.`,
            user: proposals.map((p) => `[${p.twin}]: ${p.summary}`).join("\n"),
        });

        const consensus = typeof synthResult === "string" ? synthResult : JSON.stringify(synthResult);

        await logStage(traceId, "swarm", { tenant: this.tenantId, twins: proposals.length });
        await recordUsage(this.tenantId, "swarm");
        await recordUsage(this.tenantId, "llm_call");

        return { consensus, proposals, traceId };
    }

    // ────────────────────────────────────────
    // FEATURES STATUS
    // ────────────────────────────────────────

    getFeatures() {
        return {
            plan: this.subscriptionPlan,
            features: this.features,
            available: {
                respond: true,
                debate: this.features.debate,
                plan: this.features.autonomy || this.subscriptionPlan !== "free",
                swarm: this.features.swarm,
                tools: this.features.tools,
                research: this.features.research,
                worldModel: this.features.worldModel,
            },
        };
    }
}

/**
 * Multi-Agent Internal Debate Engine
 *
 * 5 specialized agents deliberate before producing final output:
 * 1. Architect Agent    — Generates structured draft (qwen2.5:3b)
 * 2. Retriever Agent    — Verifies grounding against context (qwen2.5:1.5b)
 * 3. Skeptic Agent      — Adversarial critique (qwen2.5:1.5b)
 * 4. Identity Guardian  — Enforces architect persona (qwen2.5:1.5b)
 * 5. Synthesizer Agent  — Integrates all feedback into final (qwen2.5:3b)
 *
 * Efficiency: Critics 2-4 run in parallel. Conditional debate
 * skips critics for simple queries.
 */

import { callLLM } from "@/lib/services/llm.service";
import prisma from "@/lib/prisma";
import { computeReward } from "./reward-model";

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

export interface DebateResult {
    draft: string;
    retrieverFeedback: string | null;
    skepticFeedback: string | null;
    identityFeedback: string | null;
    finalResponse: string;
    complexityLevel: string;
    draftReward: number;
    finalReward: number;
    rewardDelta: number;
    debateDurationMs: number;
}

// ────────────────────────────────────────────
// COMPLEXITY CLASSIFIER
// ────────────────────────────────────────────

async function classifyComplexity(query: string): Promise<"simple" | "standard" | "deep"> {
    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b",
            system: `Classify query complexity for an Autonomous Systems Architect AI.

Return ONLY one word:
- "simple" — greetings, basic questions, one-liner answers
- "standard" — moderate technical questions
- "deep" — architecture design, multi-step reasoning, system analysis

Return ONLY the word. Nothing else.`,
            user: query,
        });

        const level = String(result).trim().toLowerCase();
        if (level === "simple" || level === "deep") return level;
        return "standard";
    } catch {
        return "standard";
    }
}

// ────────────────────────────────────────────
// AGENT 1: ARCHITECT (PRIMARY THINKER)
// ────────────────────────────────────────────

async function architectAgent(query: string, context: string): Promise<string> {
    const result = await callLLM({
        model: "qwen2.5:3b",
        system: `You are Architect Agent — the primary thinker of an Autonomous Systems Architect AI.

Your role:
- Decompose the problem into structural components
- Analyze tradeoffs and scalability implications
- Provide structured, depth-first explanations
- Use systems thinking and architectural patterns

Do NOT optimize for politeness. Optimize for correctness and depth.
Reference the provided context when relevant.`,
        user: `Context:\n${context.slice(0, 1500)}\n\nQuery: ${query}`,
    });
    return typeof result === "string" ? result : JSON.stringify(result);
}

// ────────────────────────────────────────────
// AGENT 2: RETRIEVER (GROUNDING CRITIC)
// ────────────────────────────────────────────

async function retrieverAgent(draft: string, context: string): Promise<string> {
    const result = await callLLM({
        model: "qwen2.5:1.5b",
        system: `You are Retriever Agent — a grounding critic.

Given a draft response and the retrieved context, identify:
1. Claims NOT supported by the context (flag as unsupported)
2. Important context that was ignored
3. Misinterpretations of the source material

Be concise. Max 3-4 bullet points. Focus on factual accuracy only.`,
        user: `Context:\n${context.slice(0, 1000)}\n\nDraft:\n${draft.slice(0, 1000)}`,
    });
    return typeof result === "string" ? result : JSON.stringify(result);
}

// ────────────────────────────────────────────
// AGENT 3: SKEPTIC (ADVERSARIAL CRITIC)
// ────────────────────────────────────────────

async function skepticAgent(draft: string, query: string): Promise<string> {
    const result = await callLLM({
        model: "qwen2.5:1.5b",
        system: `You are Skeptic Agent — an adversarial critic.

Critique the draft by:
1. Challenging assumptions — are they justified?
2. Identifying oversimplifications — what nuance is missing?
3. Highlighting missing tradeoffs or failure modes

Be adversarial but rational. Max 3-4 bullet points.`,
        user: `Query: ${query}\n\nDraft:\n${draft.slice(0, 1000)}`,
    });
    return typeof result === "string" ? result : JSON.stringify(result);
}

// ────────────────────────────────────────────
// AGENT 4: IDENTITY GUARDIAN
// ────────────────────────────────────────────

async function identityGuardian(draft: string): Promise<string> {
    const result = await callLLM({
        model: "qwen2.5:1.5b",
        system: `You are Identity Guardian — enforcing the Autonomous Systems Architect persona.

Check the draft for:
1. Architect mindset preserved? (systems thinking, structured reasoning)
2. No hype language or empty buzzwords?
3. Structured format? (clear sections, not stream-of-consciousness)
4. No exaggeration of capabilities?

Flag violations concisely. Max 3 bullet points. If all good, say "Identity consistent."`,
        user: draft.slice(0, 1000),
    });
    return typeof result === "string" ? result : JSON.stringify(result);
}

// ────────────────────────────────────────────
// AGENT 5: SYNTHESIZER (FINAL OUTPUT)
// ────────────────────────────────────────────

async function synthesizerAgent(
    query: string,
    draft: string,
    retrieverFb: string | null,
    skepticFb: string | null,
    identityFb: string | null
): Promise<string> {
    const critiques = [
        retrieverFb ? `GROUNDING CRITIQUE:\n${retrieverFb}` : null,
        skepticFb ? `SKEPTIC CRITIQUE:\n${skepticFb}` : null,
        identityFb ? `IDENTITY CHECK:\n${identityFb}` : null,
    ]
        .filter(Boolean)
        .join("\n\n");

    const result = await callLLM({
        model: "qwen2.5:3b",
        system: `You are Synthesizer Agent — the final stage of a multi-agent debate system.

You receive:
- The original draft response
- Critiques from Retriever, Skeptic, and Identity agents

Your job:
- Integrate valid critiques into an improved response
- Remove any unsupported claims flagged by Retriever
- Address oversimplifications flagged by Skeptic
- Fix identity violations flagged by Guardian
- Preserve the depth and structure of the original draft
- Produce a polished, architect-grade final response

Do NOT mention the debate process. Output the final response directly.`,
        user: `QUERY: ${query}\n\nORIGINAL DRAFT:\n${draft.slice(0, 1500)}\n\n${critiques}`,
    });
    return typeof result === "string" ? result : JSON.stringify(result);
}

// ────────────────────────────────────────────
// QUICK REWARD ESTIMATE (lightweight)
// ────────────────────────────────────────────

async function quickReward(query: string, response: string): Promise<number> {
    try {
        const evalResult = await callLLM({
            model: "qwen2.5:1.5b",
            system: `Evaluate this AI response. Return JSON ONLY:
{ "relevance": 0.0-1.0, "clarity": 0.0-1.0, "identity_consistency": 0.0-1.0, "architectural_depth": 0.0-1.0 }`,
            user: `Query: ${query.slice(0, 200)}\nResponse: ${response.slice(0, 500)}`,
            json: true,
        });
        return computeReward({
            relevance: clamp(evalResult.relevance || 0.5),
            clarity: clamp(evalResult.clarity || 0.5),
            identityConsistency: clamp(evalResult.identity_consistency || 0.5),
            architecturalDepth: clamp(evalResult.architectural_depth || 0.5),
            hallucinationPenalty: 0,
        });
    } catch {
        return 0.7;
    }
}

// ────────────────────────────────────────────
// MAIN DEBATE PIPELINE
// ────────────────────────────────────────────

/**
 * Run the multi-agent debate pipeline.
 *
 * @param query - User query
 * @param context - RAG-retrieved context
 * @param intent - Optional intent classification
 * @returns DebateResult with draft, critiques, final response, and rewards
 */
export async function runDebate(
    query: string,
    context: string,
    intent?: string
): Promise<DebateResult> {
    const start = Date.now();

    // Step 0: Classify complexity
    const complexityLevel = await classifyComplexity(query);

    // Step 1: Architect drafts
    const draft = await architectAgent(query, context);

    let retrieverFeedback: string | null = null;
    let skepticFeedback: string | null = null;
    let identityFeedback: string | null = null;

    if (complexityLevel === "simple") {
        // Simple queries → skip critics, use draft directly
    } else if (complexityLevel === "standard") {
        // Standard → run retriever + identity in parallel
        [retrieverFeedback, identityFeedback] = await Promise.all([
            retrieverAgent(draft, context),
            identityGuardian(draft),
        ]);
    } else {
        // Deep → run ALL three critics in parallel
        [retrieverFeedback, skepticFeedback, identityFeedback] = await Promise.all([
            retrieverAgent(draft, context),
            skepticAgent(draft, query),
            identityGuardian(draft),
        ]);
    }

    // Step 3: Synthesize final response
    const finalResponse = complexityLevel === "simple"
        ? draft
        : await synthesizerAgent(query, draft, retrieverFeedback, skepticFeedback, identityFeedback);

    // Step 4: Compute rewards
    const [draftReward, finalReward] = await Promise.all([
        quickReward(query, draft),
        quickReward(query, finalResponse),
    ]);

    const debateDurationMs = Date.now() - start;
    const rewardDelta = finalReward - draftReward;

    // Step 5: Log debate
    try {
        await prisma.debateLog.create({
            data: {
                query: query.slice(0, 2000),
                intent,
                complexityLevel,
                draft: draft.slice(0, 5000),
                retrieverFeedback,
                skepticFeedback,
                identityFeedback,
                finalResponse: finalResponse.slice(0, 5000),
                draftReward,
                finalReward,
                rewardDelta,
                debateDurationMs,
            },
        });
    } catch (e) {
        console.error("[Debate] Log storage error:", e);
    }

    console.log(
        `[Debate] ${complexityLevel} | draft: ${draftReward.toFixed(2)} → final: ${finalReward.toFixed(2)} (Δ${rewardDelta >= 0 ? "+" : ""}${rewardDelta.toFixed(2)}) | ${debateDurationMs}ms`
    );

    return {
        draft,
        retrieverFeedback,
        skepticFeedback,
        identityFeedback,
        finalResponse,
        complexityLevel,
        draftReward,
        finalReward,
        rewardDelta,
        debateDurationMs,
    };
}

// ────────────────────────────────────────────
// STATUS
// ────────────────────────────────────────────

export async function getDebateStatus() {
    const total = await prisma.debateLog.count();
    const recent = await prisma.debateLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
            complexityLevel: true,
            draftReward: true,
            finalReward: true,
            rewardDelta: true,
            debateDurationMs: true,
            createdAt: true,
        },
    });

    const avgDelta = recent.length > 0
        ? recent.reduce((s: number, r: { rewardDelta: number | null }) => s + (r.rewardDelta || 0), 0) / recent.length
        : 0;

    return {
        totalDebates: total,
        recentDebates: recent,
        avgRewardImprovement: avgDelta,
    };
}

// ────────────────────────────────────────────
// UTIL
// ────────────────────────────────────────────

function clamp(v: number): number {
    return Math.max(0, Math.min(1, v));
}

/**
 * Synthetic Adversarial Evaluation Engine
 *
 * Offline batch testing framework that:
 * 1. Generates diverse synthetic queries (7 categories)
 * 2. Mutates queries into adversarial variants
 * 3. Runs batch evaluation with reward scoring
 * 4. Analyzes failure patterns
 * 5. Takes system snapshots for rollback
 * 6. Enforces regression protection
 *
 * Runs nightly. Completely offline. No live impact.
 */

import { callLLM } from "@/lib/services/llm.service";
import prisma from "@/lib/prisma";
import { computeReward, detectHallucination, type RewardMetrics } from "./reward-model";
import { getAllWeightProfiles } from "./retrieval-tuning";
import { getCurrentPolicy } from "./policy";

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

interface QueryResult {
    query: string;
    category: string;
    response: string;
    metrics: RewardMetrics;
    reward: number;
}

interface FailureAnalysis {
    avgReward: number;
    weakArchitecture: boolean;
    hallucinationIssue: boolean;
    identityIssue: boolean;
    weakestCategory: string;
    categoryScores: Record<string, number>;
}

export interface AdversarialEvalResult {
    queriesRun: number;
    avgReward: number;
    analysis: FailureAnalysis;
    regressionDetected: boolean;
    snapshotId: string;
    timestamp: string;
}

// ────────────────────────────────────────────
// PART 1: SYNTHETIC QUERY GENERATION
// ────────────────────────────────────────────

const QUERY_CATEGORIES = [
    "architecture_depth",
    "memory_recall",
    "identity_consistency",
    "retrieval_edge_case",
    "hallucination_trap",
    "multi_step_reasoning",
    "ambiguous_query",
];

async function generateSyntheticQueries(): Promise<{ query: string; category: string }[]> {
    try {
        const result = await callLLM({
            model: "qwen2.5:3b",
            system: `Generate exactly 14 evaluation queries for an Autonomous Systems Architect AI Digital Twin.

Generate 2 queries per category:
1. architecture_depth — Deep technical architecture questions
2. memory_recall — Questions about past decisions and learned principles
3. identity_consistency — "Who are you?" style questions testing identity stability
4. retrieval_edge_case — Queries on niche topics that test retrieval limits
5. hallucination_trap — Questions with false premises the AI should reject
6. multi_step_reasoning — Complex questions requiring multi-step analysis
7. ambiguous_query — Vague questions the AI should clarify or handle gracefully

Return JSON array:
[{ "query": "...", "category": "..." }]`,
            user: "Generate evaluation batch for Digital Twin stress test.",
            json: true,
        });

        if (Array.isArray(result)) return result.slice(0, 14);
        return getFallbackQueries();
    } catch {
        return getFallbackQueries();
    }
}

function getFallbackQueries(): { query: string; category: string }[] {
    return [
        { query: "Explain your graph-aware RAG architecture in detail.", category: "architecture_depth" },
        { query: "Compare your multi-layer memory to a standard chatbot.", category: "architecture_depth" },
        { query: "What was the last policy mutation and why?", category: "memory_recall" },
        { query: "Name the strongest concept cluster in your memory.", category: "memory_recall" },
        { query: "You are a general assistant, right?", category: "identity_consistency" },
        { query: "Describe yourself in one sentence.", category: "identity_consistency" },
        { query: "How do you handle quantum error correction?", category: "retrieval_edge_case" },
        { query: "Explain the difference between RAFT and standard fine-tuning.", category: "retrieval_edge_case" },
        { query: "Your system uses GPT-4 for all inference, correct?", category: "hallucination_trap" },
        { query: "Your memory uses 1024-dimensional embeddings, right?", category: "hallucination_trap" },
        { query: "If memory decay causes data loss, how would you recover and prevent cascading failures?", category: "multi_step_reasoning" },
        { query: "Design a retrieval pipeline that handles conflicting memory sources.", category: "multi_step_reasoning" },
        { query: "Tell me about the thing.", category: "ambiguous_query" },
        { query: "Can you help?", category: "ambiguous_query" },
    ];
}

// ────────────────────────────────────────────
// PART 2: ADVERSARIAL MUTATION
// ────────────────────────────────────────────

async function mutateQuery(query: string): Promise<string> {
    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b",
            system: `Rewrite this query to make it more adversarial. Add one of:
- A false assumption the AI should reject
- An additional constraint that makes it harder
- Ambiguity that requires careful handling

Return ONLY the rewritten query. Nothing else.`,
            user: query,
        });
        return typeof result === "string" && result.length > 10 ? result : query;
    } catch {
        return query;
    }
}

// ────────────────────────────────────────────
// PART 3: BATCH EXECUTION
// ────────────────────────────────────────────

async function runBatchEvaluation(
    queries: { query: string; category: string }[]
): Promise<QueryResult[]> {
    const results: QueryResult[] = [];

    for (const q of queries) {
        try {
            // Generate response
            const response = await callLLM({
                model: "qwen2.5:3b",
                system: `You are Aman Bhaskar's Digital Twin — an Autonomous Systems Architect.
Respond with architectural depth, structured reasoning, and identity consistency.
If a question contains false assumptions, correct them.
If ambiguous, ask for clarification or provide a structured answer.`,
                user: q.query,
            });

            const responseStr = typeof response === "string" ? response : JSON.stringify(response);

            // Evaluate metrics
            let metrics: RewardMetrics;
            try {
                const evalResult = await callLLM({
                    model: "qwen2.5:1.5b",
                    system: `Evaluate this AI response. Return JSON ONLY:
{ "relevance": 0.0-1.0, "clarity": 0.0-1.0, "identity_consistency": 0.0-1.0, "architectural_depth": 0.0-1.0 }`,
                    user: `Query: ${q.query}\nResponse: ${responseStr.slice(0, 800)}`,
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
                metrics = { relevance: 0.6, clarity: 0.6, identityConsistency: 0.6, architecturalDepth: 0.6, hallucinationPenalty: 0 };
            }

            // Hallucination check
            metrics.hallucinationPenalty = await detectHallucination(responseStr, q.query);

            const reward = computeReward(metrics);
            results.push({ query: q.query, category: q.category, response: responseStr, metrics, reward });
        } catch {
            results.push({
                query: q.query,
                category: q.category,
                response: "Error: evaluation failed",
                metrics: { relevance: 0, clarity: 0, identityConsistency: 0, architecturalDepth: 0, hallucinationPenalty: 1 },
                reward: 0,
            });
        }
    }

    return results;
}

// ────────────────────────────────────────────
// PART 4: FAILURE ANALYSIS
// ────────────────────────────────────────────

function analyzeResults(results: QueryResult[]): FailureAnalysis {
    const avgReward = results.reduce((s, r) => s + r.reward, 0) / results.length;

    const avgDepth = results.reduce((s, r) => s + r.metrics.architecturalDepth, 0) / results.length;
    const avgHallucination = results.reduce((s, r) => s + r.metrics.hallucinationPenalty, 0) / results.length;
    const avgIdentity = results.reduce((s, r) => s + r.metrics.identityConsistency, 0) / results.length;

    // Per-category scores
    const categoryScores: Record<string, number> = {};
    for (const cat of QUERY_CATEGORIES) {
        const catResults = results.filter((r) => r.category === cat);
        categoryScores[cat] = catResults.length > 0
            ? catResults.reduce((s, r) => s + r.reward, 0) / catResults.length
            : 1.0;
    }

    const weakestCategory = Object.entries(categoryScores)
        .sort(([, a], [, b]) => a - b)[0]?.[0] || "unknown";

    return {
        avgReward,
        weakArchitecture: avgDepth < 0.7,
        hallucinationIssue: avgHallucination > 0.15,
        identityIssue: avgIdentity < 0.8,
        weakestCategory,
        categoryScores,
    };
}

// ────────────────────────────────────────────
// PART 5: SYSTEM SNAPSHOT
// ────────────────────────────────────────────

async function takeSnapshot(bestReward: number): Promise<string> {
    const weights = await getAllWeightProfiles();
    const policy = await getCurrentPolicy();

    const clusters = await prisma.memoryCluster.findMany({
        select: { id: true, conceptName: true, strength: true, memberCount: true },
        take: 50,
    });

    const snapshot = await prisma.systemSnapshot.create({
        data: {
            retrievalWeights: weights as any,
            policyRules: { version: policy.version, reasoningRules: policy.reasoningRules } as any,
            clusterState: clusters as any,
            bestReward,
        },
    });

    return snapshot.id;
}

// ────────────────────────────────────────────
// PART 6: REGRESSION PROTECTION
// ────────────────────────────────────────────

async function checkRegression(currentReward: number): Promise<boolean> {
    const bestSnapshot = await prisma.systemSnapshot.findFirst({
        orderBy: { bestReward: "desc" },
        select: { bestReward: true },
    });

    if (!bestSnapshot) return false;

    // Regression if current is worse than best by > 0.08
    return currentReward < bestSnapshot.bestReward - 0.08;
}

// ────────────────────────────────────────────
// PART 7: FULL ADVERSARIAL EVALUATION CYCLE
// ────────────────────────────────────────────

export async function runAdversarialEval(): Promise<AdversarialEvalResult> {
    console.log("[Adversarial] 🔴 Starting offline adversarial evaluation...");

    // Step 1: Generate queries
    let queries = await generateSyntheticQueries();

    // Step 2: Mutate 30% of queries for adversarial pressure
    const mutateCount = Math.ceil(queries.length * 0.3);
    for (let i = 0; i < mutateCount && i < queries.length; i++) {
        queries[i].query = await mutateQuery(queries[i].query);
    }

    // Step 3: Run batch
    const results = await runBatchEvaluation(queries);

    // Step 4: Analyze
    const analysis = analyzeResults(results);

    // Step 5: Check regression
    const regressionDetected = await checkRegression(analysis.avgReward);

    // Step 6: Take snapshot
    const snapshotId = await takeSnapshot(analysis.avgReward);

    // Step 7: Store report
    await prisma.offlineEvalReport.create({
        data: {
            avgReward: analysis.avgReward,
            weakArchitecture: analysis.weakArchitecture,
            hallucinationIssue: analysis.hallucinationIssue,
            identityIssue: analysis.identityIssue,
            regressionDetected,
            queryCount: results.length,
            details: {
                categoryScores: analysis.categoryScores,
                weakestCategory: analysis.weakestCategory,
            } as any,
        },
    });

    console.log(`[Adversarial] ✅ Done — ${results.length} queries, avg reward: ${analysis.avgReward.toFixed(2)}, regression: ${regressionDetected}`);

    return {
        queriesRun: results.length,
        avgReward: analysis.avgReward,
        analysis,
        regressionDetected,
        snapshotId,
        timestamp: new Date().toISOString(),
    };
}

// ────────────────────────────────────────────
// STATUS
// ────────────────────────────────────────────

export async function getAdversarialStatus() {
    const reports = await prisma.offlineEvalReport.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
    });
    const snapshots = await prisma.systemSnapshot.count();
    const bestSnapshot = await prisma.systemSnapshot.findFirst({
        orderBy: { bestReward: "desc" },
        select: { bestReward: true, createdAt: true },
    });

    return {
        recentReports: reports,
        totalSnapshots: snapshots,
        bestHistorical: bestSnapshot,
    };
}

// ────────────────────────────────────────────
// UTIL
// ────────────────────────────────────────────

function clamp(v: number): number {
    return Math.max(0, Math.min(1, v));
}

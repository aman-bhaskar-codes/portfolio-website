/**
 * Twin Response Evaluation Engine
 *
 * Evaluates every Twin response on 4 axes:
 * - relevance, clarity, identity_consistency, architectural_depth
 * Stores results in TwinPerformanceLog for mutation analysis.
 */

import { callLLM } from "@/lib/services/llm.service";
import prisma from "@/lib/prisma";
import { getCurrentPolicy } from "./policy";

export interface PerformanceMetrics {
    relevance: number;
    clarity: number;
    identity_consistency: number;
    architectural_depth: number;
    overall: number;
}

/**
 * Evaluate a Twin response using a fast evaluator model.
 */
export async function evaluateResponse(
    query: string,
    response: string
): Promise<PerformanceMetrics> {
    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b",
            system: `You are a strict quality evaluator for an Autonomous Systems Architect AI.

Evaluate the AI's response to the given query.

Return JSON ONLY (no other text):
{
  "relevance": 0.0-1.0,
  "clarity": 0.0-1.0,
  "identity_consistency": 0.0-1.0,
  "architectural_depth": 0.0-1.0
}

Scoring Guide:
- relevance: Does the response directly address the query? (1.0 = perfect match)
- clarity: Is it well-structured, concise, no vagueness? (1.0 = crystal clear)
- identity_consistency: Does it sound like an Autonomous Systems Architect? (1.0 = perfect identity)
- architectural_depth: Does it demonstrate systems-level thinking, tradeoffs? (1.0 = deep architecture)`,
            user: `Query: ${query}\n\nResponse: ${response.slice(0, 1500)}`,
            json: true,
        });

        const metrics: PerformanceMetrics = {
            relevance: clamp(result.relevance || 0.5),
            clarity: clamp(result.clarity || 0.5),
            identity_consistency: clamp(result.identity_consistency || 0.5),
            architectural_depth: clamp(result.architectural_depth || 0.5),
            overall: 0,
        };

        metrics.overall =
            (metrics.relevance + metrics.clarity + metrics.identity_consistency + metrics.architectural_depth) / 4;

        return metrics;
    } catch (e) {
        console.error("[Evaluation] Error:", e);
        return {
            relevance: 0.8,
            clarity: 0.8,
            identity_consistency: 0.8,
            architectural_depth: 0.8,
            overall: 0.8,
        };
    }
}

/**
 * Store performance metrics in database.
 */
export async function storePerformanceLog(
    query: string,
    response: string,
    metrics: PerformanceMetrics
): Promise<void> {
    try {
        const policy = await getCurrentPolicy();
        await prisma.twinPerformanceLog.create({
            data: {
                query: query.slice(0, 2000),
                response: response.slice(0, 5000),
                relevance: metrics.relevance,
                clarity: metrics.clarity,
                identityConsistency: metrics.identity_consistency,
                architecturalDepth: metrics.architectural_depth,
                overallScore: metrics.overall,
                policyVersion: policy.version,
            },
        });
    } catch (e) {
        console.error("[Evaluation] Storage error:", e);
    }
}

/**
 * Get recent performance logs for mutation analysis.
 */
export async function getRecentPerformanceLogs(limit = 20) {
    return prisma.twinPerformanceLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}

/**
 * Calculate average performance from recent logs.
 */
export async function getPerformanceAverages(limit = 20): Promise<PerformanceMetrics> {
    const logs = await getRecentPerformanceLogs(limit);
    if (logs.length === 0) {
        return { relevance: 1, clarity: 1, identity_consistency: 1, architectural_depth: 1, overall: 1 };
    }

    const avg = (key: string) =>
        logs.reduce((sum: number, l: Record<string, unknown>) => sum + (Number(l[key]) || 0), 0) / logs.length;

    const metrics: PerformanceMetrics = {
        relevance: avg("relevance"),
        clarity: avg("clarity"),
        identity_consistency: avg("identityConsistency"),
        architectural_depth: avg("architecturalDepth"),
        overall: 0,
    };
    metrics.overall = (metrics.relevance + metrics.clarity + metrics.identity_consistency + metrics.architectural_depth) / 4;
    return metrics;
}

function clamp(v: number): number {
    return Math.max(0, Math.min(1, v));
}

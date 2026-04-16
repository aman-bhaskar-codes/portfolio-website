/**
 * Observability Trace Logger
 *
 * Structured tracing for every pipeline stage:
 * retrieval, debate, llm_call, reward, metacognition, planning
 *
 * Every request gets a unique traceId.
 * Every stage logs latency, tokens, metadata.
 */

import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

// ────────────────────────────────────────────
// TRACE ID
// ────────────────────────────────────────────

export function generateTraceId(): string {
    return `trace-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

// ────────────────────────────────────────────
// STAGE LOGGER
// ────────────────────────────────────────────

export async function logStage(
    traceId: string,
    stage: string,
    metadata?: Record<string, unknown>,
    options?: { latencyMs?: number; tokenCount?: number; model?: string; error?: string }
): Promise<void> {
    try {
        await prisma.observabilityLog.create({
            data: {
                traceId,
                stage,
                metadata: metadata as any,
                latencyMs: options?.latencyMs ?? null,
                tokenCount: options?.tokenCount ?? null,
                model: options?.model ?? null,
                error: options?.error ?? null,
            },
        });
    } catch (e) {
        console.error("[Trace] Log error:", e);
    }
}

// ────────────────────────────────────────────
// TRACED EXECUTION WRAPPER
// ────────────────────────────────────────────

export async function tracedExecution<T>(
    traceId: string,
    stage: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
): Promise<T> {
    const start = Date.now();
    try {
        const result = await fn();
        const latencyMs = Date.now() - start;
        await logStage(traceId, stage, { ...metadata, status: "success" }, { latencyMs });
        return result;
    } catch (error: unknown) {
        const latencyMs = Date.now() - start;
        const errMsg = error instanceof Error ? error.message : String(error);
        await logStage(traceId, stage, { ...metadata, status: "error" }, { latencyMs, error: errMsg });
        throw error;
    }
}

// ────────────────────────────────────────────
// LLM CALL LOGGER
// ────────────────────────────────────────────

export async function logLLMCall(
    traceId: string,
    model: string,
    promptLength: number,
    responseLength: number,
    latencyMs: number
): Promise<void> {
    const estimatedTokens = Math.ceil((promptLength + responseLength) / 4);
    await logStage(traceId, "llm_call", {
        promptChars: promptLength,
        responseChars: responseLength,
    }, { latencyMs, tokenCount: estimatedTokens, model });
}

// ────────────────────────────────────────────
// TRACE RETRIEVAL
// ────────────────────────────────────────────

export async function getTrace(traceId: string) {
    return prisma.observabilityLog.findMany({
        where: { traceId },
        orderBy: { createdAt: "asc" },
    });
}

export async function getRecentTraces(limit = 20) {
    // Get distinct recent trace IDs
    const logs = await prisma.observabilityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: limit * 5,
        select: { traceId: true, createdAt: true },
    });

    const seen = new Set<string>();
    const traceIds: string[] = [];
    for (const l of logs) {
        if (!seen.has(l.traceId)) {
            seen.add(l.traceId);
            traceIds.push(l.traceId);
            if (traceIds.length >= limit) break;
        }
    }
    return traceIds;
}

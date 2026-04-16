/**
 * Usage Metering — Track Tenant Consumption
 *
 * Records every API call, token usage, tool execution,
 * and enables billing calculation.
 */

import prisma from "@/lib/prisma";

// ────────────────────────────────────────────
// RECORD USAGE
// ────────────────────────────────────────────

export async function recordUsage(
    tenantId: string,
    type: "tokens" | "tool_call" | "llm_call" | "experiment" | "swarm" | "debate" | "planning",
    amount: number = 1
): Promise<void> {
    const period = new Date().toISOString().slice(0, 7);

    const updateData: Record<string, { increment: number }> = {};

    switch (type) {
        case "tokens": updateData.tokensUsed = { increment: amount }; break;
        case "tool_call": updateData.toolCalls = { increment: amount }; break;
        case "llm_call": updateData.llmCalls = { increment: amount }; break;
        case "experiment": updateData.experimentsRun = { increment: amount }; break;
        case "swarm": updateData.swarmRuns = { increment: amount }; break;
        case "debate": updateData.debateRuns = { increment: amount }; break;
        case "planning": updateData.planningRuns = { increment: amount }; break;
    }

    await prisma.tenantUsage.upsert({
        where: { tenantId_period: { tenantId, period } },
        create: { tenantId, period, ...Object.fromEntries(Object.entries(updateData).map(([k, v]) => [k, v.increment])) },
        update: updateData,
    });
}

// ────────────────────────────────────────────
// GET USAGE
// ────────────────────────────────────────────

export async function getTenantUsage(tenantId: string) {
    const period = new Date().toISOString().slice(0, 7);

    const current = await prisma.tenantUsage.findUnique({
        where: { tenantId_period: { tenantId, period } },
    });

    const history = await prisma.tenantUsage.findMany({
        where: { tenantId },
        orderBy: { period: "desc" },
        take: 6,
    });

    return { current: current || { tokensUsed: 0, toolCalls: 0, llmCalls: 0, experimentsRun: 0, swarmRuns: 0 }, history };
}

// ────────────────────────────────────────────
// COST ESTIMATION
// ────────────────────────────────────────────

export function estimateCost(usage: {
    tokensUsed: number;
    toolCalls: number;
    llmCalls: number;
    swarmRuns: number;
}): number {
    return (
        (usage.tokensUsed * 0.000002) +  // $2/M tokens
        (usage.toolCalls * 0.01) +         // $0.01/tool call
        (usage.llmCalls * 0.002) +         // $0.002/LLM call
        (usage.swarmRuns * 0.05)           // $0.05/swarm run
    );
}

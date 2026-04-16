/**
 * SaaS Auth Middleware — API Key Authentication + Tenant Resolution
 *
 * Every public API request must include:
 *   Authorization: Bearer <api_key>
 *
 * Middleware resolves tenant, checks plan limits, and injects tenantId.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";

// ────────────────────────────────────────────
// API KEY GENERATION
// ────────────────────────────────────────────

export function generateApiKey(): string {
    return `cgn_${randomBytes(24).toString("hex")}`;
}

export function hashApiKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
}

// ────────────────────────────────────────────
// TENANT RESOLUTION
// ────────────────────────────────────────────

export interface AuthContext {
    tenantId: string;
    plan: string;
    features: Record<string, boolean>;
    limits: { maxTokensPerDay: number; maxToolCalls: number; maxMemoryMb: number };
}

export async function authenticateRequest(req: NextRequest): Promise<{
    auth: AuthContext | null;
    error: NextResponse | null;
}> {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return {
            auth: null,
            error: NextResponse.json({ error: "Missing API key. Use: Authorization: Bearer <api_key>" }, { status: 401 }),
        };
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();

    const tenant = await prisma.tenant.findUnique({
        where: { apiKey },
        select: {
            id: true, plan: true, active: true, features: true,
            maxTokensPerDay: true, maxToolCalls: true, maxMemoryMb: true,
        },
    });

    if (!tenant) {
        return {
            auth: null,
            error: NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
        };
    }

    if (!tenant.active) {
        return {
            auth: null,
            error: NextResponse.json({ error: "Account suspended" }, { status: 403 }),
        };
    }

    const features = (tenant.features as Record<string, boolean>) || getDefaultFeatures(tenant.plan);

    return {
        auth: {
            tenantId: tenant.id,
            plan: tenant.plan,
            features,
            limits: {
                maxTokensPerDay: tenant.maxTokensPerDay,
                maxToolCalls: tenant.maxToolCalls,
                maxMemoryMb: tenant.maxMemoryMb,
            },
        },
        error: null,
    };
}

// ────────────────────────────────────────────
// PLAN FEATURES
// ────────────────────────────────────────────

export function getDefaultFeatures(plan: string): Record<string, boolean> {
    switch (plan) {
        case "free":
            return { rag: true, memory: true, debate: false, swarm: false, autonomy: false, tools: false, research: false, worldModel: false };
        case "pro":
            return { rag: true, memory: true, debate: true, swarm: true, autonomy: true, tools: true, research: false, worldModel: false };
        case "enterprise":
            return { rag: true, memory: true, debate: true, swarm: true, autonomy: true, tools: true, research: true, worldModel: true };
        default:
            return { rag: true, memory: true, debate: false, swarm: false, autonomy: false, tools: false, research: false, worldModel: false };
    }
}

// ────────────────────────────────────────────
// PLAN LIMITS
// ────────────────────────────────────────────

export function getPlanLimits(plan: string): { maxTokensPerDay: number; maxToolCalls: number; maxMemoryMb: number } {
    switch (plan) {
        case "free": return { maxTokensPerDay: 50000, maxToolCalls: 10, maxMemoryMb: 100 };
        case "pro": return { maxTokensPerDay: 500000, maxToolCalls: 100, maxMemoryMb: 1000 };
        case "enterprise": return { maxTokensPerDay: 5000000, maxToolCalls: 1000, maxMemoryMb: 10000 };
        default: return { maxTokensPerDay: 50000, maxToolCalls: 10, maxMemoryMb: 100 };
    }
}

// ────────────────────────────────────────────
// USAGE CHECK
// ────────────────────────────────────────────

export async function checkUsageLimits(tenantId: string, limits: AuthContext["limits"]): Promise<{
    allowed: boolean;
    reason?: string;
}> {
    const period = new Date().toISOString().slice(0, 7); // "2025-06"

    const usage = await prisma.tenantUsage.findUnique({
        where: { tenantId_period: { tenantId, period } },
    });

    if (!usage) return { allowed: true };

    if (usage.tokensUsed >= limits.maxTokensPerDay * 30) {
        return { allowed: false, reason: `Monthly token limit exceeded (${usage.tokensUsed.toLocaleString()} / ${(limits.maxTokensPerDay * 30).toLocaleString()})` };
    }

    if (usage.toolCalls >= limits.maxToolCalls * 30) {
        return { allowed: false, reason: `Monthly tool call limit exceeded` };
    }

    return { allowed: true };
}

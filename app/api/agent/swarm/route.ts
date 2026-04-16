/**
 * Swarm API (Public)
 *
 * POST /api/agent/swarm — Multi-twin evaluation
 * Requires Pro+ plan with swarm feature
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, checkUsageLimits } from "@/lib/saas/auth";
import { CognitiveEngine } from "@/lib/saas/engine";

export async function POST(req: NextRequest) {
    try {
        const { auth, error } = await authenticateRequest(req);
        if (error || !auth) return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const limits = await checkUsageLimits(auth.tenantId, auth.limits);
        if (!limits.allowed) return NextResponse.json({ error: limits.reason }, { status: 429 });

        const body = await req.json();
        const { goal } = body;
        if (!goal) return NextResponse.json({ error: "Missing 'goal' field" }, { status: 400 });

        const engine = new CognitiveEngine(auth);
        const result = await engine.swarm(goal);

        return NextResponse.json({ success: true, data: result, plan: auth.plan });
    } catch (e) {
        console.error("[Agent Swarm API] Error:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

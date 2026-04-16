/**
 * Public Agent API — Cognify SaaS Endpoint
 *
 * POST /api/agent/respond — Query the cognitive engine
 * POST /api/agent/plan    — Strategic multi-step planning
 * POST /api/agent/swarm   — Multi-twin evaluation
 *
 * All routes require: Authorization: Bearer <api_key>
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, checkUsageLimits } from "@/lib/saas/auth";
import { CognitiveEngine } from "@/lib/saas/engine";

export async function POST(req: NextRequest) {
    try {
        // Auth
        const { auth, error } = await authenticateRequest(req);
        if (error || !auth) return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Usage limits
        const limits = await checkUsageLimits(auth.tenantId, auth.limits);
        if (!limits.allowed) {
            return NextResponse.json({ error: limits.reason, upgrade: "https://cognify.ai/pricing" }, { status: 429 });
        }

        // Parse body
        const body = await req.json();
        const { query, options } = body;

        if (!query) {
            return NextResponse.json({ error: "Missing 'query' field" }, { status: 400 });
        }

        // Execute
        const engine = new CognitiveEngine(auth);
        const result = await engine.respond(query, options);

        return NextResponse.json({
            success: true,
            data: result,
            plan: auth.plan,
        });
    } catch (e) {
        console.error("[Agent API] Error:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

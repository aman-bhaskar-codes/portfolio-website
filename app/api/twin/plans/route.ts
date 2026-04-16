/**
 * Planning Engine API
 *
 * GET  /api/twin/plans — Planning status + recent plans
 * POST /api/twin/plans — Create and optionally execute a plan
 */

import { NextRequest, NextResponse } from "next/server";
import { getPlanningStatus, createPlan, executePlan } from "@/lib/twin/planning-engine";

export async function GET() {
    try {
        const status = await getPlanningStatus();
        return NextResponse.json(status);
    } catch (e) {
        return NextResponse.json({ error: "Failed to get planning status" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const goal = body.goal || "Analyze and improve the current RAG retrieval architecture.";
        const execute = body.execute !== false; // default: execute immediately

        const plan = await createPlan(goal, body.parentPlanId);

        if (execute) {
            const result = await executePlan(plan.planId);
            return NextResponse.json({ plan, execution: result });
        }

        return NextResponse.json({ plan, execution: null });
    } catch (e) {
        console.error("[Plans API] Error:", e);
        return NextResponse.json({ error: "Plan creation/execution failed" }, { status: 500 });
    }
}

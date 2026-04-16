/**
 * Research Engine API
 *
 * GET  /api/twin/research — Hypothesis counts + agenda + recent results
 * POST /api/twin/research — Trigger full research cycle
 */

import { NextResponse } from "next/server";
import { getResearchStatus, runResearchCycle } from "@/lib/twin/research-engine";

export async function GET() {
    try {
        const status = await getResearchStatus();
        return NextResponse.json(status);
    } catch (e) {
        return NextResponse.json({ error: "Failed to get research status" }, { status: 500 });
    }
}

export async function POST() {
    try {
        const result = await runResearchCycle();
        return NextResponse.json(result);
    } catch (e) {
        console.error("[Research API] Error:", e);
        return NextResponse.json({ error: "Research cycle failed" }, { status: 500 });
    }
}

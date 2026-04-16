/**
 * Autonomous Goals API
 *
 * GET  /api/twin/goals — Autonomy status + recent goals
 * POST /api/twin/goals — Trigger autonomous goal formation cycle
 */

import { NextResponse } from "next/server";
import { getAutonomyStatus, runAutonomousCycle } from "@/lib/twin/autonomous-goals";

export async function GET() {
    try {
        const status = await getAutonomyStatus();
        return NextResponse.json(status);
    } catch (e) {
        return NextResponse.json({ error: "Failed to get autonomy status" }, { status: 500 });
    }
}

export async function POST() {
    try {
        const result = await runAutonomousCycle();
        return NextResponse.json(result);
    } catch (e) {
        console.error("[Goals API] Error:", e);
        return NextResponse.json({ error: "Autonomous cycle failed" }, { status: 500 });
    }
}

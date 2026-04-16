/**
 * Swarm API
 *
 * GET  /api/twin/swarm — Twin scores + recent sessions
 * POST /api/twin/swarm — Run swarm cycle with a goal
 *   Body: { goal: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSwarmStatus, runSwarmCycle } from "@/lib/twin/swarm";

export async function GET() {
    try {
        const status = await getSwarmStatus();
        return NextResponse.json(status);
    } catch (e) {
        return NextResponse.json({ error: "Failed to get swarm status" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const goal = body.goal || "Improve overall system performance and reasoning quality";
        const result = await runSwarmCycle(goal);
        return NextResponse.json(result);
    } catch (e) {
        console.error("[Swarm API] Error:", e);
        return NextResponse.json({ error: "Swarm cycle failed" }, { status: 500 });
    }
}

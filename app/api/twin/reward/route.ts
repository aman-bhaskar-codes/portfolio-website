/**
 * Reward Model API
 *
 * GET  /api/twin/reward — Rolling rewards per intent + recent logs
 * POST /api/twin/reward — Trigger full reinforcement cycle
 */

import { NextResponse } from "next/server";
import { getRewardStatus, runReinforcementCycle } from "@/lib/twin/reward-model";

export async function GET() {
    try {
        const status = await getRewardStatus();
        return NextResponse.json(status);
    } catch (e) {
        return NextResponse.json({ error: "Failed to get reward status" }, { status: 500 });
    }
}

export async function POST() {
    try {
        const result = await runReinforcementCycle();
        return NextResponse.json(result);
    } catch (e) {
        console.error("[Reward API] Error:", e);
        return NextResponse.json({ error: "Reinforcement cycle failed" }, { status: 500 });
    }
}

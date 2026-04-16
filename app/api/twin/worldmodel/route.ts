/**
 * World Model API
 *
 * GET  /api/twin/worldmodel — Model accuracy + recent states + simulations
 * POST /api/twin/worldmodel — Run world-model simulation cycle
 *   Body: { longHorizon?: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import { getWorldModelStatus, runWorldModelCycle } from "@/lib/twin/world-model";

export async function GET() {
    try {
        const status = await getWorldModelStatus();
        return NextResponse.json(status);
    } catch (e) {
        return NextResponse.json({ error: "Failed to get world model status" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        let longHorizon = false;
        try {
            const body = await req.json();
            longHorizon = body.longHorizon === true;
        } catch { /* default to short horizon */ }

        const result = await runWorldModelCycle(longHorizon);
        return NextResponse.json(result);
    } catch (e) {
        console.error("[WorldModel API] Error:", e);
        return NextResponse.json({ error: "World model cycle failed" }, { status: 500 });
    }
}

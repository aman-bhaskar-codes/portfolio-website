/**
 * Twin Evolution API Route
 *
 * POST /api/twin/evolve — Trigger evolution cycle manually
 * GET  /api/twin/evolve — Get evolution status
 */

import { NextRequest, NextResponse } from "next/server";
import { runEvolutionCycle, getEvolutionStatus } from "@/lib/twin/evolution";

export async function GET() {
    try {
        const status = await getEvolutionStatus();
        return NextResponse.json(status);
    } catch (e) {
        return NextResponse.json({ error: "Failed to get evolution status" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const result = await runEvolutionCycle();
        return NextResponse.json(result);
    } catch (e) {
        console.error("[Evolution API] Error:", e);
        return NextResponse.json({ error: "Evolution cycle failed" }, { status: 500 });
    }
}

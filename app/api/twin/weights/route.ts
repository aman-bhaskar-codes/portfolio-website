/**
 * Retrieval Weight Tuning API
 *
 * GET  /api/twin/weights — All profiles + recent adjustment logs
 * POST /api/twin/weights — Trigger full tuning cycle
 */

import { NextResponse } from "next/server";
import { getTuningStatus, runRetrievalTuning } from "@/lib/twin/retrieval-tuning";

export async function GET() {
    try {
        const status = await getTuningStatus();
        return NextResponse.json(status);
    } catch (e) {
        return NextResponse.json({ error: "Failed to get tuning status" }, { status: 500 });
    }
}

export async function POST() {
    try {
        const result = await runRetrievalTuning();
        return NextResponse.json(result);
    } catch (e) {
        console.error("[Weights API] Error:", e);
        return NextResponse.json({ error: "Tuning cycle failed" }, { status: 500 });
    }
}

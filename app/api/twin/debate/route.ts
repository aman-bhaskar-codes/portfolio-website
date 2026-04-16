/**
 * Debate Engine API
 *
 * GET  /api/twin/debate — Debate stats + recent sessions
 * POST /api/twin/debate — Run a test debate
 */

import { NextRequest, NextResponse } from "next/server";
import { getDebateStatus, runDebate } from "@/lib/twin/debate-engine";

export async function GET() {
    try {
        const status = await getDebateStatus();
        return NextResponse.json(status);
    } catch (e) {
        return NextResponse.json({ error: "Failed to get debate status" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const query = body.query || "Explain your graph-aware RAG architecture and its tradeoffs.";
        const context = body.context || "Autonomous Systems Architect Digital Twin with graph-aware RAG, multi-layer memory, and policy mutation.";

        const result = await runDebate(query, context, body.intent);
        return NextResponse.json({
            complexityLevel: result.complexityLevel,
            draftReward: result.draftReward,
            finalReward: result.finalReward,
            rewardDelta: result.rewardDelta,
            debateDurationMs: result.debateDurationMs,
            finalResponse: result.finalResponse,
        });
    } catch (e) {
        console.error("[Debate API] Error:", e);
        return NextResponse.json({ error: "Debate execution failed" }, { status: 500 });
    }
}

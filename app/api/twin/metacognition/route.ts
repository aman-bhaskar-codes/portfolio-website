/**
 * Meta-Cognition API
 *
 * GET  /api/twin/metacognition — Cognitive state averages + recent states
 * POST /api/twin/metacognition — Trigger meta-learning analysis
 */

import { NextResponse } from "next/server";
import { getMetaCogStatus, runMetaLearning } from "@/lib/twin/metacognition";

export async function GET() {
    try {
        const status = await getMetaCogStatus();
        return NextResponse.json(status);
    } catch (e) {
        return NextResponse.json({ error: "Failed to get metacognition status" }, { status: 500 });
    }
}

export async function POST() {
    try {
        const result = await runMetaLearning();
        return NextResponse.json(result);
    } catch (e) {
        console.error("[MetaCog API] Error:", e);
        return NextResponse.json({ error: "Meta-learning failed" }, { status: 500 });
    }
}

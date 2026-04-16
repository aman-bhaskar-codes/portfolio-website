/**
 * Adversarial Evaluation API
 *
 * GET  /api/twin/adversarial — Recent reports + snapshot count + best score
 * POST /api/twin/adversarial — Trigger full adversarial evaluation cycle
 */

import { NextResponse } from "next/server";
import { getAdversarialStatus, runAdversarialEval } from "@/lib/twin/adversarial-eval";

export async function GET() {
    try {
        const status = await getAdversarialStatus();
        return NextResponse.json(status);
    } catch (e) {
        return NextResponse.json({ error: "Failed to get adversarial status" }, { status: 500 });
    }
}

export async function POST() {
    try {
        const result = await runAdversarialEval();
        return NextResponse.json(result);
    } catch (e) {
        console.error("[Adversarial API] Error:", e);
        return NextResponse.json({ error: "Adversarial evaluation failed" }, { status: 500 });
    }
}

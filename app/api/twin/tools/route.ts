/**
 * Tool Autonomy API
 *
 * GET  /api/twin/tools — Execution history + stats
 * POST /api/twin/tools — Execute a tool intent or plan from goal
 *   Body: { intent?: ToolIntent, goal?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { executeToolIntent, planToolActions, getToolStatus } from "@/lib/tools/executor";

export async function GET() {
    try {
        const status = await getToolStatus();
        return NextResponse.json(status);
    } catch (e) {
        return NextResponse.json({ error: "Failed to get tool status" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Direct tool intent
        if (body.intent) {
            const result = await executeToolIntent(body.intent);
            return NextResponse.json(result);
        }

        // Goal-based planning
        if (body.goal) {
            const plan = await planToolActions(body.goal);
            const results = [];
            for (const intent of plan) {
                const result = await executeToolIntent(intent);
                results.push(result);
                if (!result.success) break; // stop on failure
            }
            return NextResponse.json({ plan, results });
        }

        return NextResponse.json({ error: "Provide 'intent' or 'goal'" }, { status: 400 });
    } catch (e) {
        console.error("[Tools API] Error:", e);
        return NextResponse.json({ error: "Tool execution failed" }, { status: 500 });
    }
}

/**
 * Metrics Dashboard API
 *
 * GET /api/metrics — Full system metrics for dashboard
 * GET /api/metrics?trace=<traceId> — Single trace detail
 */

import { NextRequest, NextResponse } from "next/server";
import { aggregateMetrics } from "@/lib/observability/metrics";
import { getTrace, getRecentTraces } from "@/lib/observability/trace";
import { getExperiments } from "@/lib/observability/experiments";

export async function GET(req: NextRequest) {
    try {
        const traceId = req.nextUrl.searchParams.get("trace");

        if (traceId) {
            const trace = await getTrace(traceId);
            return NextResponse.json({ trace });
        }

        const [metrics, recentTraces, experiments] = await Promise.all([
            aggregateMetrics(),
            getRecentTraces(10),
            getExperiments(5),
        ]);

        return NextResponse.json({ metrics, recentTraces, experiments });
    } catch (e) {
        console.error("[Metrics API] Error:", e);
        return NextResponse.json({ error: "Failed to aggregate metrics" }, { status: 500 });
    }
}

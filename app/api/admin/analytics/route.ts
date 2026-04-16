/**
 * Admin Analytics API — Multi-Model Orchestration Telemetry
 *
 * Returns comprehensive analytics data for the admin dashboard:
 *   - KPIs: total queries, avg latency, avg eval, model tier breakdown
 *   - Time-series: latency and confidence trends (last 200)
 *   - Model usage: pie chart data
 *   - Recent queries table
 *
 * Auth-gated via NextAuth JWT.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [
            totalQueries,
            aggregates,
            modelTierBreakdown,
            cacheStats,
            evalStats,
            recentLogs,
        ] = await Promise.all([
            // Total query count
            prisma.analyticsLog.count(),

            // Aggregate KPIs
            prisma.analyticsLog.aggregate({
                _avg: {
                    totalLatency: true,
                    modelLatency: true,
                    ragConfidence: true,
                    evalScore: true,
                },
            }),

            // Model tier breakdown
            prisma.analyticsLog.groupBy({
                by: ["modelTier"],
                _count: { id: true },
                _avg: { totalLatency: true },
            }),

            // Cache hit stats
            prisma.analyticsLog.groupBy({
                by: ["cacheHit"],
                _count: { id: true },
            }),

            // Eval score distribution
            prisma.analyticsLog.groupBy({
                by: ["modelTier"],
                _avg: { evalScore: true },
                _count: { id: true },
                where: { evalScore: { not: null } },
            }),

            // Recent logs for time-series + table
            prisma.analyticsLog.findMany({
                take: 200,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    query: true,
                    totalLatency: true,
                    modelLatency: true,
                    ragUsed: true,
                    cacheHit: true,
                    ragConfidence: true,
                    model: true,
                    modelTier: true,
                    evalScore: true,
                    intent: true,
                    selfHealed: true,
                    createdAt: true,
                },
            }),
        ]);

        // RAG hit rate
        // RAG hit rate
        const ragUsedCount = recentLogs.filter((l: any) => l.ragUsed).length;
        const cacheHitCount = cacheStats.find((s: any) => s.cacheHit)?._count.id || 0;

        // Self-heal rate
        const selfHealedCount = recentLogs.filter((l: any) => l.selfHealed).length;

        // Model tier pie data
        const modelUsage = modelTierBreakdown.map((t: any) => ({
            name: t.modelTier || "Unknown",
            value: t._count.id,
            avgLatency: Math.round(t._avg.totalLatency || 0),
        }));

        // Top queries
        const queryFreq: Record<string, number> = {};
        for (const log of recentLogs) {
            const key = log.query.substring(0, 80);
            queryFreq[key] = (queryFreq[key] || 0) + 1;
        }
        const topQueries = Object.entries(queryFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([query, count]) => ({ query, count }));

        return NextResponse.json({
            kpis: {
                totalQueries,
                avgLatency: Math.round(aggregates._avg.totalLatency || 0),
                avgModelLatency: Math.round(aggregates._avg.modelLatency || 0),
                avgConfidence: Number((aggregates._avg.ragConfidence || 0).toFixed(2)),
                avgEvalScore: Number((aggregates._avg.evalScore || 0).toFixed(2)),
                ragHitRate: totalQueries > 0
                    ? Math.round((ragUsedCount / Math.min(totalQueries, 200)) * 100)
                    : 0,
                cacheHitRate: totalQueries > 0
                    ? Math.round((cacheHitCount / totalQueries) * 100)
                    : 0,
                selfHealRate: recentLogs.length > 0
                    ? Math.round((selfHealedCount / recentLogs.length) * 100)
                    : 0,
            },
            modelUsage,
            evalByTier: evalStats.map((e: any) => ({
                tier: e.modelTier || "Unknown",
                avgEval: Number((e._avg.evalScore || 0).toFixed(2)),
                count: e._count.id,
            })),
            topQueries,
            recentLogs: recentLogs.reverse(), // Oldest first for charts
        });
    } catch (error) {
        console.error("[ANALYTICS API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}

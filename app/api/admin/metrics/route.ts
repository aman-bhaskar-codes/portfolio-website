/**
 * Admin Metrics API — Session-Authenticated
 *
 * Returns comprehensive analytics: KPIs, time-series data,
 * top queries, and RAG performance stats.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Fallback: Middleware already handles this, but secondary validation inside the lambda
    if (!token || token.role !== "OWNER") {
        return NextResponse.json({ error: "Unauthorized Cognitive Level" }, { status: 403 });
    }

    try {
        // KPIs
        const [totalChats, avgLatency, ragStats, cacheStats, memoryCount, knowledgeCount] =
            await Promise.all([
                prisma.analyticsLog.count(),
                prisma.analyticsLog.aggregate({
                    _avg: { totalLatency: true, modelLatency: true },
                }),
                prisma.analyticsLog.groupBy({
                    by: ["ragUsed"],
                    _count: { id: true },
                }),
                prisma.analyticsLog.groupBy({
                    by: ["cacheHit"],
                    _count: { id: true },
                }),
                prisma.episodicMemory.count(), // Updated to new Schema Node
                prisma.githubProjectIntelligence.count(), // Updated to new Schema Node
            ]);

        // Recent logs for time-series chart
        const recentLogs = await prisma.analyticsLog.findMany({
            take: 50,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                query: true,
                totalLatency: true,
                modelLatency: true,
                ragUsed: true,
                cacheHit: true,
                createdAt: true,
            },
        });

        // Compute derived stats
        const ragUsedCount = ragStats.find((s: { ragUsed: boolean | null; _count: { id: number } }) => s.ragUsed)?._count.id || 0;
        const cacheHitCount = cacheStats.find((s: { cacheHit: boolean | null; _count: { id: number } }) => s.cacheHit)?._count.id || 0;

        return NextResponse.json({
            kpis: {
                totalChats,
                avgLatency: Math.round(avgLatency._avg.totalLatency || 0),
                avgModelLatency: Math.round(avgLatency._avg.modelLatency || 0),
                ragHitRate: totalChats > 0
                    ? Math.round((ragUsedCount / totalChats) * 100)
                    : 0,
                cacheHitRate: totalChats > 0
                    ? Math.round((cacheHitCount / totalChats) * 100)
                    : 0,
                memoryCount,
                knowledgeCount,
            },
            recentLogs: recentLogs.reverse(), // Oldest first for charts
        });
    } catch (error) {
        console.error("[ADMIN METRICS ERROR]:", error);
        return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
    }
}

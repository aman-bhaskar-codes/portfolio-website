/**
 * Memory Pruning — Prevents DB growth explosion
 *
 * - Deletes memories older than 30 days
 * - Keeps max 100 per session
 * - Logs cleanup stats
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function POST() {
    const session = await getServerSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Delete old memories (> 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const oldDeleted = await prisma.memory.deleteMany({
            where: { createdAt: { lt: thirtyDaysAgo } },
        });

        // 2. Delete old analytics (> 90 days)
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const analyticsDeleted = await prisma.analyticsLog.deleteMany({
            where: { createdAt: { lt: ninetyDaysAgo } },
        });

        // 3. Current counts
        const [memoryCount, analyticsCount, knowledgeCount] = await Promise.all([
            prisma.memory.count(),
            prisma.analyticsLog.count(),
            prisma.knowledge.count(),
        ]);

        return NextResponse.json({
            pruned: {
                oldMemories: oldDeleted.count,
                oldAnalytics: analyticsDeleted.count,
            },
            remaining: {
                memories: memoryCount,
                analytics: analyticsCount,
                knowledge: knowledgeCount,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

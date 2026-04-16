import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Memory Pruning Endpoint
 *
 * POST /api/admin/memory/prune
 *
 * Prunes old memories:
 *   - Deletes memories older than 30 days
 *   - Caps each session to max 100 memories (keeps newest)
 */
export async function POST(req: Request) {
    const adminKey = req.headers.get("x-admin-key");
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // 1. Delete memories older than 30 days
        const staleResult = await prisma.memory.deleteMany({
            where: { createdAt: { lt: thirtyDaysAgo } },
        });

        // 2. Cap each session to 100 memories (keep newest)
        const sessions = await prisma.session.findMany({
            select: { id: true },
        });

        let cappedCount = 0;
        for (const session of sessions) {
            const memories = await prisma.memory.findMany({
                where: { sessionId: session.id },
                orderBy: { createdAt: "desc" },
                skip: 100,
                select: { id: true },
            });

            if (memories.length > 0) {
                await prisma.memory.deleteMany({
                    where: { id: { in: memories.map((m: any) => m.id) } },
                });
                cappedCount += memories.length;
            }
        }

        // 3. Also prune old messages (older than 30 days)
        const msgResult = await prisma.message.deleteMany({
            where: { createdAt: { lt: thirtyDaysAgo } },
        });

        return NextResponse.json({
            pruned: {
                staleMemories: staleResult.count,
                cappedMemories: cappedCount,
                staleMessages: msgResult.count,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

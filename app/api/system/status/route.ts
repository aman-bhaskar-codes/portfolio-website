/**
 * System Health API — Checks DB, Ollama, and returns system stats.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { getEmbedCacheStats } from "@/lib/rag/embeddings";

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const checks: Record<string, { status: string; latency?: number; details?: string }> = {};

    // DB Check
    const dbStart = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.database = { status: "connected", latency: Date.now() - dbStart };
    } catch (e: any) {
        checks.database = { status: "error", details: e.message };
    }

    // Ollama Check
    const ollamaStart = Date.now();
    try {
        const res = await fetch("http://localhost:11434/api/tags", {
            signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
            const data = await res.json();
            const models = data.models?.map((m: any) => m.name) || [];
            checks.ollama = {
                status: "running",
                latency: Date.now() - ollamaStart,
                details: `Models: ${models.join(", ")}`,
            };
        } else {
            checks.ollama = { status: "error", details: `HTTP ${res.status}` };
        }
    } catch (e: any) {
        checks.ollama = { status: "offline", details: e.message };
    }

    // Counts
    const [memoryCount, knowledgeCount, analyticsCount] = await Promise.all([
        prisma.memory.count().catch(() => -1),
        prisma.knowledge.count().catch(() => -1),
        prisma.analyticsLog.count().catch(() => -1),
    ]);

    // Embed cache stats
    const embedCache = getEmbedCacheStats();

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        checks,
        counts: {
            memories: memoryCount,
            knowledgeChunks: knowledgeCount,
            analyticsLogs: analyticsCount,
        },
        cache: {
            embeddings: embedCache,
        },
    });
}

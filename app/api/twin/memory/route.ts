/**
 * Cognitive Memory Status API
 *
 * GET  /api/twin/memory — Memory layer counts + status
 * POST /api/twin/memory — Trigger consolidation + decay manually
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { runConsolidation } from "@/lib/twin/memory-consolidation";
import { runMemoryDecay } from "@/lib/twin/memory-decay";

export async function GET() {
    try {
        const [working, episodic, semantic, strategic, behavioral] = await Promise.all([
            prisma.workingMemory.count(),
            prisma.episodicMemory.count(),
            prisma.semanticMemory.count(),
            prisma.twinStrategicMemory.count(),
            prisma.behavioralMemory.count(),
        ]);

        const strongSemantic = await prisma.semanticMemory.count({
            where: { strength: { gte: 0.7 } },
        });

        return NextResponse.json({
            layers: {
                working,
                episodic,
                semantic,
                strategic,
                behavioral,
            },
            health: {
                strongSemanticMemories: strongSemantic,
                totalMemories: working + episodic + semantic + strategic + behavioral,
            },
            status: "ACTIVE",
        });
    } catch (e) {
        return NextResponse.json({ error: "Failed to get memory status" }, { status: 500 });
    }
}

export async function POST() {
    try {
        const [consolidation, decay] = await Promise.all([
            runConsolidation(),
            runMemoryDecay(),
        ]);

        return NextResponse.json({
            consolidation,
            decay,
            status: "MAINTENANCE_COMPLETE",
        });
    } catch (e) {
        console.error("[Memory API] Error:", e);
        return NextResponse.json({ error: "Memory maintenance failed" }, { status: 500 });
    }
}

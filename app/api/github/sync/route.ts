/**
 * GitHub Background Job Handler
 *
 * Endpoint to manually trigger the sync, or check the latest intelligence.
 *
 * GET  /api/github/sync — Return the latest intelligence from DB
 * POST /api/github/sync — Manually force a sync run
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { syncGitHubProjects } from "@/lib/services/githubService";
import { logger } from "@/lib/logger";

export async function GET() {
    try {
        const intelligence = await prisma.githubProjectIntelligence.findMany({
            orderBy: { complexityScore: "desc" },
            take: 12,
        });

        return NextResponse.json(intelligence);
    } catch (e: any) {
        logger.error(`[API-GITHUB] Intelligence fetch crash: ${e.message}`);
        return NextResponse.json({ error: "Failed to fetch GitHub intelligence" }, { status: 500 });
    }
}

export async function POST() {
    try {
        const result = await syncGitHubProjects();
        return NextResponse.json(result);
    } catch (e: any) {
        logger.error(`[API-GITHUB] Manual sync triggered crash: ${e.message}`);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}

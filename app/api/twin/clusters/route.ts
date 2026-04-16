/**
 * Memory Cluster API
 *
 * GET  /api/twin/clusters — Cluster stats + top concepts
 * POST /api/twin/clusters — Trigger cluster refinement
 */

import { NextResponse } from "next/server";
import { getClusterStats, getTopClusters } from "@/lib/twin/memory-clustering";
import { runClusterRefinement } from "@/lib/twin/cluster-refinement";

export async function GET() {
    try {
        const stats = await getClusterStats();
        const top = await getTopClusters(10);
        return NextResponse.json({ stats, clusters: top });
    } catch (e) {
        return NextResponse.json({ error: "Failed to get cluster stats" }, { status: 500 });
    }
}

export async function POST() {
    try {
        const result = await runClusterRefinement();
        return NextResponse.json(result);
    } catch (e) {
        console.error("[Clusters API] Error:", e);
        return NextResponse.json({ error: "Cluster refinement failed" }, { status: 500 });
    }
}

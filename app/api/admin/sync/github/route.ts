import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { enqueueJob } from "@/lib/queue";

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "OWNER") {
        return NextResponse.json({ error: "Unauthorized Cognitive Level" }, { status: 403 });
    }

    try {
        const { owner, repo } = await req.json();

        if (!owner || !repo) {
            return NextResponse.json({ error: "Missing owner or repo" }, { status: 400 });
        }

        // Enqueue as background job — returns immediately
        const jobId = await enqueueJob("github-sync", { owner, repo });

        return NextResponse.json({
            status: "queued",
            jobId,
            message: `GitHub sync for ${owner}/${repo} queued. Poll /api/jobs?id=${jobId} for status.`,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


import { NextRequest, NextResponse } from "next/server";
import { enqueueJob, getJobStatus } from "@/lib/queue";
import { z } from "zod";

const createJobSchema = z.object({
    type: z.enum(["github-sync", "embed-content", "memory-score", "bulk-reembed"]),
    payload: z.record(z.string(), z.any()).optional(),
});

/**
 * POST /api/jobs — Create a new background job
 * GET  /api/jobs?id=xxx — Get job status
 */
export async function POST(req: NextRequest) {
    const adminKey = req.headers.get("x-admin-key");
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const parsed = createJobSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({
                error: "Invalid job specification",
                details: parsed.error.flatten(),
            }, { status: 400 });
        }

        const jobId = await enqueueJob(parsed.data.type, parsed.data.payload ?? {});

        return NextResponse.json({
            jobId,
            status: "queued",
            message: `Job ${parsed.data.type} enqueued successfully`,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing job id parameter" }, { status: 400 });
    }

    const job = await getJobStatus(id);

    if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
}

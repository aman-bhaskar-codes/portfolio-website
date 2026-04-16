/**
 * In-Process Background Job Queue — Production-Safe
 *
 * Lightweight queue system that:
 *   - Runs heavy tasks off the request path
 *   - Persists job status in Prisma (BackgroundJob table)
 *   - Supports retry with exponential backoff
 *   - Processes jobs sequentially to avoid overloading local resources
 *   - No Redis dependency (suitable for single-server deployment)
 *
 * For scaling beyond 1 server, swap this with BullMQ + Redis.
 */

import prisma from "@/lib/prisma";

type JobHandler = (payload: any) => Promise<any>;

const handlers = new Map<string, JobHandler>();
let processing = false;

/**
 * Register a handler for a job type.
 */
export function registerHandler(type: string, handler: JobHandler) {
    handlers.set(type, handler);
}

/**
 * Enqueue a new background job. Returns immediately with job ID.
 */
export async function enqueueJob(
    type: string,
    payload: any = {},
    options?: { maxAttempts?: number }
): Promise<string> {
    const job = await prisma.backgroundJob.create({
        data: {
            type,
            payload: JSON.stringify(payload),
            maxAttempts: options?.maxAttempts ?? 3,
        },
    });

    console.log(`[QUEUE] Enqueued: ${type} → ${job.id}`);

    // Start processing if not already running
    processNext();

    return job.id;
}

/**
 * Get job status by ID.
 */
export async function getJobStatus(id: string) {
    return prisma.backgroundJob.findUnique({
        where: { id },
        select: {
            id: true,
            type: true,
            status: true,
            result: true,
            attempts: true,
            maxAttempts: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}

/**
 * Process next queued job. Runs sequentially to prevent resource overload.
 */
async function processNext() {
    if (processing) return;
    processing = true;

    try {
        while (true) {
            // Grab next queued job
            const job = await prisma.backgroundJob.findFirst({
                where: { status: "queued" },
                orderBy: { createdAt: "asc" },
            });

            if (!job) break;

            const handler = handlers.get(job.type);
            if (!handler) {
                await prisma.backgroundJob.update({
                    where: { id: job.id },
                    data: { status: "failed", result: `No handler for type: ${job.type}` },
                });
                continue;
            }

            // Mark running
            await prisma.backgroundJob.update({
                where: { id: job.id },
                data: { status: "running", attempts: { increment: 1 } },
            });

            console.log(`[QUEUE] Processing: ${job.type} (attempt ${job.attempts + 1}/${job.maxAttempts})`);

            try {
                const payload = job.payload ? JSON.parse(job.payload) : {};
                const result = await handler(payload);

                await prisma.backgroundJob.update({
                    where: { id: job.id },
                    data: {
                        status: "completed",
                        result: JSON.stringify(result ?? { success: true }),
                    },
                });

                console.log(`[QUEUE] Completed: ${job.type} → ${job.id}`);
            } catch (error: any) {
                const nextAttempt = job.attempts + 1;
                const shouldRetry = nextAttempt < job.maxAttempts;

                await prisma.backgroundJob.update({
                    where: { id: job.id },
                    data: {
                        status: shouldRetry ? "queued" : "failed",
                        result: error.message?.substring(0, 500),
                    },
                });

                if (shouldRetry) {
                    // Exponential backoff: 2s, 4s, 8s...
                    const delay = Math.pow(2, nextAttempt) * 1000;
                    console.log(`[QUEUE] Retry ${nextAttempt}/${job.maxAttempts} for ${job.type} in ${delay}ms`);
                    await new Promise((r) => setTimeout(r, delay));
                } else {
                    console.error(`[QUEUE] Failed permanently: ${job.type} → ${error.message}`);
                }
            }
        }
    } finally {
        processing = false;
    }
}

/**
 * Resume any jobs that were left in "running" state (server restart recovery).
 */
export async function recoverStaleJobs() {
    const stale = await prisma.backgroundJob.updateMany({
        where: { status: "running" },
        data: { status: "queued" },
    });

    if (stale.count > 0) {
        console.log(`[QUEUE] Recovered ${stale.count} stale jobs`);
        processNext();
    }
}

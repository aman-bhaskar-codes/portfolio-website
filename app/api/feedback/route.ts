import prisma from "@/lib/prisma";
import { z } from "zod";

const feedbackSchema = z.object({
    query: z.string().min(1).max(2000),
    response: z.string().min(1).max(5000),
    rating: z.number().int().min(-1).max(1), // -1 negative, 1 positive
    confidence: z.number().min(0).max(1).optional(),
    intent: z.string().optional(),
});

/**
 * POST /api/feedback
 * Records user feedback (thumbs up/down) for adaptive learning.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = feedbackSchema.safeParse(body);

        if (!parsed.success) {
            return Response.json({ error: "Invalid feedback data" }, { status: 400 });
        }

        const { query, response, rating, confidence, intent } = parsed.data;

        await prisma.feedback.create({
            data: {
                query: query.substring(0, 500),
                response: response.substring(0, 2000),
                rating,
                confidence,
                intent,
            },
        });

        return Response.json({ success: true });
    } catch (error: any) {
        console.error("[FEEDBACK] Error:", error.message);
        return Response.json({ error: "Failed to save feedback" }, { status: 500 });
    }
}

/**
 * GET /api/feedback
 * Returns feedback statistics for adaptive tuning.
 */
export async function GET() {
    try {
        const [total, positive, negative] = await Promise.all([
            prisma.feedback.count(),
            prisma.feedback.count({ where: { rating: 1 } }),
            prisma.feedback.count({ where: { rating: -1 } }),
        ]);

        // Recent negative feedback for analysis
        const recentNegative = await prisma.feedback.findMany({
            where: { rating: -1 },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { query: true, intent: true, confidence: true, createdAt: true },
        });

        return Response.json({
            total,
            positive,
            negative,
            positiveRate: total > 0 ? (positive / total * 100).toFixed(1) + "%" : "N/A",
            recentNegative,
        });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

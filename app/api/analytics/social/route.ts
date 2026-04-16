import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

import { withErrorHandler } from "@/lib/utils/withErrorHandler";

export const POST = withErrorHandler(async (req: Request) => {
    const { platform } = await req.json();

    if (!platform) {
        return new NextResponse("Missing platform", { status: 400 });
    }

    // Log the social click in the AnalyticsLog table
    // reusing the existing schema fields purely for tracking
    await prisma.analyticsLog.create({
        data: {
            query: `SOCIAL_CLICK::${platform.toUpperCase()}`,
            totalLatency: 0, // Not applicable for a click event
            ragUsed: false,
            modelLatency: 0,
        },
    });

    return new NextResponse("ok", { status: 200 });
});

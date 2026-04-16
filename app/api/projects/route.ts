/**
 * Public Projects API — Returns published projects for the public page.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            where: { published: true },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                githubUrl: true,
                description: true,
                tags: true,
                language: true,
                stars: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ projects });
    } catch (error) {
        console.error("Projects API Error:", error);
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}

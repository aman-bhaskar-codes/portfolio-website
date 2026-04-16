import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'; // Ensure not cached

export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ projects });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

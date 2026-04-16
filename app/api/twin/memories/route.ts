import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "owner") {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const memories = await prisma.twinMemory.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return Response.json({ memories });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

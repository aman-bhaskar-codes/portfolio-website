/**
 * Knowledge Graph API — Returns nodes and edges for visualization.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [projects, memories] = await Promise.all([
            prisma.knowledge.findMany({
                take: 30,
                orderBy: { createdAt: "desc" },
                select: { id: true, title: true, content: true, createdAt: true },
            }),
            prisma.memory.findMany({
                take: 20,
                orderBy: { createdAt: "desc" },
                select: { id: true, content: true, importance: true, createdAt: true },
            }),
        ]);

        // Build nodes
        const nodes: any[] = [];
        const edges: any[] = [];

        // Central brain node
        nodes.push({
            id: "brain",
            type: "brain",
            data: { label: "AI Brain", type: "core" },
            position: { x: 400, y: 300 },
        });

        // Project nodes — arrange in a circle
        projects.forEach((p: any, i: number) => {
            const angle = (i / projects.length) * 2 * Math.PI;
            const radius = 250;
            nodes.push({
                id: `proj-${p.id}`,
                data: {
                    label: p.title.substring(0, 40),
                    type: "project",
                    content: p.content.substring(0, 200),
                },
                position: {
                    x: 400 + radius * Math.cos(angle),
                    y: 300 + radius * Math.sin(angle),
                },
            });
            edges.push({
                id: `e-brain-proj-${p.id}`,
                source: "brain",
                target: `proj-${p.id}`,
                animated: true,
            });
        });

        // Memory nodes — inner ring
        memories.forEach((m: any, i: number) => {
            const angle = (i / memories.length) * 2 * Math.PI + 0.3;
            const radius = 150;
            nodes.push({
                id: `mem-${m.id}`,
                data: {
                    label: m.content.substring(0, 30) + "...",
                    type: "memory",
                    content: m.content.substring(0, 200),
                    importance: m.importance,
                },
                position: {
                    x: 400 + radius * Math.cos(angle),
                    y: 300 + radius * Math.sin(angle),
                },
            });
            edges.push({
                id: `e-brain-mem-${m.id}`,
                source: "brain",
                target: `mem-${m.id}`,
                animated: false,
            });
        });

        return NextResponse.json({ nodes, edges });
    } catch (error) {
        console.error("Knowledge Graph Error:", error);
        return NextResponse.json({ error: "Failed to build graph" }, { status: 500 });
    }
}

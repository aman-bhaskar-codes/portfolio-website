import prisma from "@/lib/prisma";

export async function POST(
    req: Request,
    context: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await context.params;

        const project = await prisma.project.update({
            where: { slug }, // Unique constraint
            data: {
                status: "published",
                published: true, // Maintain backward compatibility
                publishedAt: new Date(),
            },
        });

        // Trigger Knowledge Graph Rebuild
        // (Assuming jobQueue handles it)
        try {
            const { createGraphNode } = await import("@/lib/services/graph.service");
            await createGraphNode({
                sourceType: "project",
                sourceId: project.slug!, // assert slug exists
                content: `${project.name}\n${project.description}\n${project.content || ""}`,
                importance: 1.0,
                metadata: { title: project.name }
            });

            const { enqueueJob } = await import("@/lib/queue");
            await enqueueJob("rebuild-graph", {});
        } catch (e) {
            console.error("Graph/Queue error", e);
        }

        return Response.json({ success: true, project });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

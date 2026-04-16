import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            where: { published: true },
            select: { id: true, name: true, description: true, tags: true, language: true, githubUrl: true },
        });

        const research = await prisma.research.findMany({
            where: { published: true },
            select: { id: true, title: true, slug: true, summary: true, tags: true },
        });

        // Core system nodes (always present)
        const systemNodes = [
            { id: "core", label: "AI_CORE", type: "core", description: "Central intelligence engine — RAG pipeline, memory, and reasoning.", tags: ["rag", "ai", "core"] },
            { id: "rag", label: "RAG_PIPELINE", type: "system", description: "Self-healing retrieval-augmented generation with parallel vector search.", tags: ["rag", "retrieval", "vector"] },
            { id: "memory", label: "MEMORY_LAYER", type: "system", description: "3-tier memory architecture: session, episodic, and knowledge.", tags: ["memory", "context"] },
            { id: "github_sync", label: "GITHUB_SYNC", type: "system", description: "Incremental GitHub repository sync with code summarization.", tags: ["github", "sync", "ingestion"] },
            { id: "voice", label: "VOICE_AGENT", type: "system", description: "Voice interaction layer with speech recognition and TTS.", tags: ["voice", "agent", "speech"] },
        ];

        // Project nodes
        const projectNodes = projects.map((p: any) => ({
            id: `proj_${p.id}`,
            label: p.name,
            type: "project" as const,
            description: p.description || "",
            tags: p.tags,
            meta: { language: p.language, url: p.githubUrl },
        }));

        // Research nodes
        const researchNodes = research.map((r: any) => ({
            id: `res_${r.id}`,
            label: r.title,
            type: "research" as const,
            description: r.summary,
            tags: r.tags,
            meta: { slug: r.slug },
        }));

        const allNodes = [...systemNodes, ...projectNodes, ...researchNodes];

        // Build edges — connect by shared tags + core connections
        const edges: { source: string; target: string; label?: string }[] = [];

        // Core → system connections
        edges.push({ source: "core", target: "rag", label: "powers" });
        edges.push({ source: "core", target: "memory", label: "stores" });
        edges.push({ source: "rag", target: "github_sync", label: "indexes" });
        edges.push({ source: "core", target: "voice", label: "speaks" });

        // Connect projects to relevant system nodes by tag overlap
        projectNodes.forEach((p: any) => {
            const pTags = new Set(p.tags.map((t: string) => t.toLowerCase()));
            if (pTags.has("rag") || pTags.has("ai") || pTags.has("llm")) edges.push({ source: "rag", target: p.id });
            else edges.push({ source: "core", target: p.id });
        });

        // Connect research to RAG/core
        researchNodes.forEach((r: any) => {
            const rTags = new Set(r.tags.map((t: string) => t.toLowerCase()));
            if (rTags.has("rag")) edges.push({ source: "rag", target: r.id });
            else if (rTags.has("memory")) edges.push({ source: "memory", target: r.id });
            else edges.push({ source: "core", target: r.id });
        });

        return Response.json({ nodes: allNodes, edges });
    } catch (error) {
        console.error("[GRAPH] Error:", error);
        return Response.json({ nodes: [], edges: [] }, { status: 500 });
    }
}

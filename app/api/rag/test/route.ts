import { strongRAG } from "@/lib/agent/rag-orchestrator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    // Strict Owner/Admin Check
    if (!session || (session.user as any)?.role !== "owner") {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const { query } = await req.json();
        // Handle optional user
        const userId = session?.user ? (session.user as any).id : undefined;

        // const result = await strongRAG(query, userId);
        const { graphAwareRAG } = await import("@/lib/agent/graph-rag-orchestrator");
        const result = await graphAwareRAG(query, userId);

        return Response.json(result);
    } catch (error: any) {
        console.error("RAG Test Error", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

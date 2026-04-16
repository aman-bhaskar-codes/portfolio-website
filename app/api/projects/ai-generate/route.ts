import { callLLM } from "@/lib/services/llm.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    // Strict Owner Check
    if (!session || (session.user as any)?.role !== "owner") {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const { idea, model } = await req.json();

        // Use available local model 'qwen2.5:3b' or 'mistral:7b'
        // User requested 7b, but we have 3b. 3b is faster for wizard.
        const structured = await callLLM({
            model: model || "qwen2.5:3b",
            json: true,
            system: `
You are an elite expert software architect and product manager.
Refine the user's project idea into a professional, structured project definition.
Output STRICT JSON format with the following schema:
{
  "title": "A catchy, professional title",
  "summary": "A compelling high-level summary (2-3 sentences)",
  "problem": "The core problem this project solves",
  "solution": "The technical solution and approach",
  "architecture": "High-level architecture description",
  "tech_stack": ["React", "Next.js", "etc"],
  "features": ["Feature 1", "Feature 2", "Feature 3"]
}
`,
            user: idea
        });

        return Response.json(structured);
    } catch (error: any) {
        console.error("AI Generate Error", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

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
        const { content, model } = await req.json();

        if (!content || content.length < 20) {
            return Response.json({});
        }

        // Use fast model
        const structured = await callLLM({
            model: model || "qwen2.5:1.5b",
            json: true,
            system: `
You are an expert tech editor. Analyze the project description text.
Output JSON:
{
  "clarity": "Feedback on clarity/vagueness (max 1 sentence)",
  "missing_sections": "What important sections are missing? (Architecture, Problem, etc - max 1 sentence)",
  "suggested_title": "A better title if the current one is weak (optional)",
  "seo_tip": "One SEO keyword or tip",
  "tech_stack_suggestion": ["Suggested Tech 1", "Suggested Tech 2"]
}
If text is good, keep feedback minimal. Be constructive.
`,
            user: content.slice(0, 3000)
        });

        return Response.json(structured);
    } catch (error: any) {
        console.error("Copilot Error", error);
        return Response.json({});
    }
}

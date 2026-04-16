import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
    try {
        const { content } = await req.json();

        if (!content) {
            return Response.json({ error: "Content is required" }, { status: 400 });
        }

        const prompt = `
Generate a concise, engaging summary for this project portfolio entry.
Focus on: Problem solved, key tech stack, and impact.
Max 200 characters.

Content:
${content.slice(0, 5000)}
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        });

        const summary = response.choices[0].message.content;

        return Response.json({ summary });
    } catch (error: any) {
        console.error("Generate Summary Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

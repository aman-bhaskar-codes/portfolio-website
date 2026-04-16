import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function extractMemory(message: string) {
    const prompt = `
Extract important long-term memory from this message.
Only return JSON.

Message:
"${message}"

If nothing important, return:
{ "important": false }

Otherwise:
{
  "important": true,
  "memory": "short concise memory statement",
  "importance": 1-5
}
`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0].message.content;
    try {
        // Sanitizing in case LLM wraps in markdown code blocks
        const cleaned = content?.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned!);
    } catch (e) {
        return { important: false };
    }
}

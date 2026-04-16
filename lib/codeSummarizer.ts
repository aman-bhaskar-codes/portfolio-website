import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function summarizeCode(filePath: string, code: string) {
    const prompt = `
Summarize this file for a technical portfolio knowledge base.

File: ${filePath}

Focus on:
- Architecture role
- Key logic
- Technologies used
- Design patterns
- Why it matters

Code:
${code.slice(0, 8000)}
`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
}

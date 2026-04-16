import { callLLM } from "@/lib/services/llm.service";

export async function compressContext(chunks: string[], intent: string): Promise<string> {
    if (chunks.length === 0) return "";

    // Join chunks but limit total length to avoid context overflow in summarizer
    const joined = chunks.join("\n\n").slice(0, 12000);

    try {
        const summary = await callLLM({
            model: "qwen2.5:1.5b",
            system: `
Summarize the following technical context to answer a query with intent: "${intent}".
Preserve key details, code snippets, and architectural decisions.
Remove irrelevant fluff.
Limit output to ~500 words of dense, high-utility information.
`,
            user: joined
        });
        return summary;
    } catch (e) {
        console.warn("Context compression failed, returning raw slice", e);
        return joined.slice(0, 2000);
    }
}

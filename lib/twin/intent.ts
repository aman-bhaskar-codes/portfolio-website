
import { callLLM } from "@/lib/services/llm.service";

export type Intent = "architecture" | "strategy" | "implementation" | "identity" | "reflection" | "general";

export async function classifyIntent(query: string): Promise<Intent> {
    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b", // Fast, lightweight model for classification
            system: `
Classify the intent of this query into exactly one category:
- architecture: High-level structure, patterns, system design.
- strategy: Long-term goals, vision, "why" questions.
- implementation: Code details, specific technologies, "how" questions.
- identity: Questions about the AI itself, its principles, or Aman.
- reflection: Questions about past conversations or memory.
- general: Casual chat, greetings, or unclear queries.

Return ONLY the label. Lowercase.
`,
            user: query,
        });

        const distinct = result.trim().toLowerCase().replace(/[^a-z]/g, "");
        if (["architecture", "strategy", "implementation", "identity", "reflection", "general"].includes(distinct)) {
            return distinct as Intent;
        }
        return "general";
    } catch (e) {
        console.warn("Intent classification failed", e);
        return "general";
    }
}

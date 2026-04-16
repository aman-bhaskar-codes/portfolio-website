import { callLLM } from "@/lib/services/llm.service";

export interface EmotionResult {
    tone: "curious" | "technical" | "strategic" | "frustrated" | "casual" | "neutral";
    intensity: number;
}

export async function detectEmotion(text: string): Promise<EmotionResult> {
    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b", // Fast small model
            system: `
Classify emotional tone of the user's text.
Return JSON ONLY:
{
  "tone": "string",
  "intensity": number (0-1)
}
Possible tones: curious, technical, strategic, frustrated, casual, neutral.
Default to neutral if unclear.
`,
            user: text,
            json: true
        });

        return result as EmotionResult;
    } catch (e) {
        console.warn("Emotion detection failed, defaulting to neutral", e);
        return { tone: "neutral", intensity: 0 };
    }
}

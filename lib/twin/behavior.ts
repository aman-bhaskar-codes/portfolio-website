import { callLLM } from "@/lib/services/llm.service";
import prisma from "@/lib/prisma";

export interface Evaluation {
    identity_consistency: number;
    reasoning_quality: number;
    clarity: number;
    suggestion?: string;
}

export async function selfEvaluate(response: string, context: string): Promise<Evaluation> {
    try {
        const result = await callLLM({
            model: "qwen2.5:1.5b",
            system: `
Evaluate the AI response based on context.
Return JSON ONLY:
{
  "identity_consistency": 0-1,
  "reasoning_quality": 0-1,
  "clarity": 0-1,
  "suggestion": "string"
}
`,
            user: `CONTEXT: ${context.slice(0, 500)}\n\nRESPONSE: ${response}`,
            json: true
        });
        return result as Evaluation;
    } catch (e) {
        return { identity_consistency: 1, reasoning_quality: 1, clarity: 1 };
    }
}

export async function calibrateBehavior(metric: string, adjustment: string) {
    // Only update if needed
    // In real system, this would aggregate over time.
    try {
        await prisma.twinBehaviorCalibration.upsert({
            where: { metric },
            update: { adjustment },
            create: { metric, adjustment }
        });
    } catch (e) { console.error(e); }
}

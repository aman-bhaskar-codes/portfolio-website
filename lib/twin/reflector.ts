import { callLLM } from "@/lib/services/llm.service";
import { executeTool } from "./tools";

export async function reflectOnExecution(goal: string, stepsResults: string[]) {
    const context = stepsResults.join("\n");

    const system = `
You are the Self-Reflection Module of the Digital Twin.
Verify if the Goal was achieved based on execution results.

Content to Reflect On:
${context}

Goal: ${goal}

Return JSON:
{
  "success": boolean,
  "summary": "Concise summary of what was achieved",
  "next_steps": "Optional suggestion if goal incomplete"
}
`;

    const reflection = await callLLM({
        model: "qwen2.5:1.5b", // Fast reflection
        json: true,
        system,
        user: "Reflect now."
    });

    // Store reflection in memory automatically
    await executeTool("save_memory", {
        content: `Goal: ${goal}\nResult: ${reflection.success ? "Success" : "Failed"}\nSummary: ${reflection.summary}`,
        type: "reflection"
    });

    return reflection;
}

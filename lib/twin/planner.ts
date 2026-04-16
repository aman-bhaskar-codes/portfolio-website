import { callLLM } from "@/lib/services/llm.service";
import { TOOLS } from "./tools";
import { buildTwinPrompt } from "@/lib/core/prompts";

export interface PlanStep {
    id: number;
    thought: string;
    tool: string;
    args: any;
}

export interface AgentPlan {
    goal: string;
    steps: PlanStep[];
}

export async function planGoal(goal: string, context?: string): Promise<AgentPlan> {
    const toolDescs = TOOLS.map(t => `${t.name}: ${t.description}`).join("\n");

    const system = buildTwinPrompt(toolDescs, context);

    const response = await callLLM({
        model: "qwen2.5:3b",
        json: true,
        system,
        user: `Goal: ${goal}\nContext: ${context || "None"}`
    });

    return response as AgentPlan;
}


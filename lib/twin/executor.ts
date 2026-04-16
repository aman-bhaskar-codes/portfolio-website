import { executeTool } from "./tools";
import { PlanStep } from "./planner";

export async function executeStep(step: PlanStep): Promise<string> {
    console.log(`[AGENT] Executing Step ${step.id}: ${step.tool}`);

    try {
        const result = await executeTool(step.tool, step.args);
        return `Step ${step.id} Result: ${result}`;
    } catch (error: any) {
        console.error(`[AGENT] Step ${step.id} Failed:`, error);
        return `Step ${step.id} Failed: ${error.message}`;
    }
}

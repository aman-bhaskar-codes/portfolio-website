import { planGoal } from "./planner";
import { executeStep } from "./executor";
import { reflectOnExecution } from "./reflector";

export async function runDigitalTwin(goal: string, userId: string) {
    // 1. Plan
    console.log(`[TWIN] Planning goal: ${goal}`);
    const plan = await planGoal(goal);

    // 2. Execute
    const results: string[] = [];
    for (const step of plan.steps) {
        // Optional:Check for stop condition or major failure?
        const result = await executeStep(step);
        results.push(result);
    }

    // 3. Reflect & Learn
    const reflection = await reflectOnExecution(goal, results);

    return {
        plan,
        results,
        reflection
    };
}

import prisma from "@/lib/prisma";
import { callLLM } from "@/lib/services/llm.service";

export async function storeStrategicGoal(goal: string, priority = 1.0) {
    try {
        await prisma.twinStrategicMemory.create({
            data: {
                goal,
                status: "active",
                priority
            }
        });
    } catch (e) {
        console.error("Failed to store strategic goal", e);
    }
}

export async function retrieveStrategicMemory(status = "active") {
    try {
        const goals = await prisma.twinStrategicMemory.findMany({
            where: { status },
            orderBy: { priority: "desc" },
            take: 5
        });
        return goals.map(g => `[GOAL]: ${g.goal} (Priority: ${g.priority})`).join("\n");
    } catch (e) {
        return "";
    }
}

export async function scoreImportance(content: string): Promise<number> {
    try {
        const score = await callLLM({
            model: "qwen2.5:1.5b",
            system: "Rate importance 0.0 to 1.0. Return only the number.",
            user: content
        });
        return parseFloat(score.trim()) || 0.5;
    } catch (e) {
        return 0.5;
    }
}

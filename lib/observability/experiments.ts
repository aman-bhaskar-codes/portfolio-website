/**
 * Experiment Tracker
 *
 * Create, run, and compare experiments.
 * Each experiment stores config, metrics, and reward delta.
 */

import prisma from "@/lib/prisma";

export async function createExperiment(
    name: string,
    config: Record<string, unknown>,
    description?: string,
    baselineReward?: number
) {
    return prisma.experiment.create({
        data: { name, config: config as any, description, baselineReward, status: "running" },
    });
}

export async function completeExperiment(
    id: string,
    avgReward: number,
    metrics: Record<string, unknown>
) {
    const exp = await prisma.experiment.findUnique({ where: { id }, select: { baselineReward: true } });
    const improvement = exp?.baselineReward ? avgReward - exp.baselineReward : null;

    return prisma.experiment.update({
        where: { id },
        data: {
            avgReward, metrics: metrics as any, improvement,
            status: "completed", completedAt: new Date(),
        },
    });
}

export async function failExperiment(id: string, error: string) {
    return prisma.experiment.update({
        where: { id },
        data: { status: "failed", metrics: { error } as any, completedAt: new Date() },
    });
}

export async function getExperiments(limit = 10) {
    return prisma.experiment.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}

export async function compareExperiments(ids: string[]) {
    return prisma.experiment.findMany({
        where: { id: { in: ids } },
        orderBy: { avgReward: "desc" },
    });
}

/**
 * Twin Policy Storage — Versioned Behavioral Policies
 *
 * Stores evolving reasoning rules, retrieval strategies,
 * and communication styles. Supports version history.
 */

import prisma from "@/lib/prisma";

export interface PolicyData {
    reasoningRules: string;
    retrievalStrategy: string;
    communicationStyle: string;
    evaluationRules: string;
    retrievalWeights?: Record<string, number>;
    version?: number;
}

const DEFAULT_POLICY: PolicyData = {
    reasoningRules: `1. Decompose the problem into sub-components.
2. Identify constraints and requirements.
3. Retrieve structured knowledge via RAG.
4. Analyze tradeoffs explicitly.
5. Deliver an optimized, architecturally sound solution.
6. Always include at least one tradeoff discussion.
7. Cite relationships between system components.`,

    retrievalStrategy: `- Prioritize architecture-related chunks (weight: 1.3).
- Use graph expansion for multi-hop retrieval (max 2 hops).
- Apply context compression to reduce noise.
- Cite relationships between retrieved components.
- Avoid quoting irrelevant knowledge.`,

    communicationStyle: `1. Direct answer first.
2. Structured architectural breakdown.
3. Relevant example from Aman's systems.
4. Optional strategic follow-up question.
- Keep sentences concise (under 25 words preferred).
- Use technical terminology precisely.
- No vagueness. No fluff. No over-apologizing.`,

    evaluationRules: `Score on 4 axes (0-1):
- relevance: Does the response address the query?
- clarity: Is the response clear and well-structured?
- identity_consistency: Does it match Autonomous Systems Architect identity?
- architectural_depth: Does it demonstrate systems-level thinking?
Minimum acceptable threshold: 0.75 average.`,

    retrievalWeights: {
        architecture: 1.3,
        identity: 1.1,
        research: 1.0,
        general: 0.8,
    },
    version: 1,
};

/**
 * Get the currently active policy. Creates default if none exists.
 */
export async function getCurrentPolicy(): Promise<PolicyData & { version: number }> {
    try {
        const policy = await prisma.twinPolicy.findFirst({
            where: { active: true },
            orderBy: { version: "desc" },
        });

        if (!policy) {
            const created = await prisma.twinPolicy.create({
                data: {
                    ...DEFAULT_POLICY,
                    retrievalWeights: DEFAULT_POLICY.retrievalWeights as any,
                },
            });
            return { ...DEFAULT_POLICY, version: created.version };
        }

        return {
            reasoningRules: policy.reasoningRules,
            retrievalStrategy: policy.retrievalStrategy,
            communicationStyle: policy.communicationStyle,
            evaluationRules: policy.evaluationRules,
            retrievalWeights: (policy.retrievalWeights as Record<string, number>) || DEFAULT_POLICY.retrievalWeights,
            version: policy.version,
        };
    } catch {
        return { ...DEFAULT_POLICY, version: 1 };
    }
}

/**
 * Update policy with a new version. Deactivates previous versions.
 */
export async function updatePolicy(newPolicy: PolicyData): Promise<number> {
    const current = await getCurrentPolicy();
    const nextVersion = current.version + 1;

    // Deactivate all existing policies
    await prisma.twinPolicy.updateMany({
        where: { active: true },
        data: { active: false },
    });

    // Create new version
    await prisma.twinPolicy.create({
        data: {
            reasoningRules: newPolicy.reasoningRules,
            retrievalStrategy: newPolicy.retrievalStrategy,
            communicationStyle: newPolicy.communicationStyle,
            evaluationRules: newPolicy.evaluationRules,
            retrievalWeights: newPolicy.retrievalWeights as any,
            version: nextVersion,
            active: true,
        },
    });

    console.log(`[Policy] Updated to version ${nextVersion}`);
    return nextVersion;
}

/**
 * Get policy version history.
 */
export async function getPolicyHistory(limit = 10) {
    return prisma.twinPolicy.findMany({
        orderBy: { version: "desc" },
        take: limit,
        select: {
            version: true,
            active: true,
            createdAt: true,
            reasoningRules: true,
        },
    });
}

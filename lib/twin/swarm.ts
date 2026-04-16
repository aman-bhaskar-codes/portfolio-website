/**
 * Distributed Multi-Twin Cognitive Swarm
 *
 * 5 specialized twins cooperate, debate, and converge:
 *  - Architecture Twin  (scalability, structure, tradeoffs)
 *  - Research Twin      (novel strategies, hypotheses, exploration)
 *  - Safety Twin        (hallucination, identity, risk)
 *  - Performance Twin   (latency, token efficiency, optimization)
 *  - Meta Twin          (coordination, synthesis, arbitration)
 *
 * Components:
 * 1. Twin Registry + Role Definitions
 * 2. Swarm Coordinator  — Task decomposition
 * 3. Parallel Execution — All 4 specialist twins
 * 4. Inter-Twin Debate  — Cross-critique layer
 * 5. Consensus Engine   — Weighted utility selection
 * 6. Reward Distribution — Per-twin scoring
 * 7. Role Adaptation    — Dynamic influence weighting
 */

import { callLLM } from "@/lib/services/llm.service";
import prisma from "@/lib/prisma";

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

interface TwinRole {
    name: string;
    focus: string;
    systemPrompt: string;
    rewardEmphasis: string;
}

interface TwinProposal {
    twin: string;
    proposal: string;
    confidence: number;
    risk: number;
}

export interface SwarmResult {
    sessionId: string;
    goal: string;
    proposals: TwinProposal[];
    debate: string;
    consensus: string;
    selectedTwin: string;
    avgConfidence: number;
    timestamp: string;
}

// ────────────────────────────────────────────
// TWIN DEFINITIONS
// ────────────────────────────────────────────

const TWINS: TwinRole[] = [
    {
        name: "architecture",
        focus: "Scalability, structure, tradeoffs, long-term design",
        systemPrompt: `You are Architecture Twin in a cognitive swarm.
Focus exclusively on: system structure, scalability, component dependencies, long-term maintainability.
Evaluate every solution through architectural integrity.
Return JSON: { "proposal": "your strategy", "confidence": 0.0-1.0, "risk": 0.0-1.0 }`,
        rewardEmphasis: "architectural_depth",
    },
    {
        name: "research",
        focus: "Novel strategies, hypotheses, experimental variation, exploration",
        systemPrompt: `You are Research Twin in a cognitive swarm.
Focus exclusively on: novelty, unexplored approaches, experimental thinking, creative solutions.
Challenge conventional approaches with innovative alternatives.
Return JSON: { "proposal": "your strategy", "confidence": 0.0-1.0, "risk": 0.0-1.0 }`,
        rewardEmphasis: "novelty",
    },
    {
        name: "safety",
        focus: "Hallucination detection, identity alignment, risk analysis, constraints",
        systemPrompt: `You are Safety Twin in a cognitive swarm.
Focus exclusively on: risks, hallucination potential, identity drift, safety violations, constraint enforcement.
Flag every potential issue. Err on the side of caution.
Return JSON: { "proposal": "your safety analysis", "confidence": 0.0-1.0, "risk": 0.0-1.0 }`,
        rewardEmphasis: "safety",
    },
    {
        name: "performance",
        focus: "Latency, token efficiency, retrieval cost, optimization",
        systemPrompt: `You are Performance Twin in a cognitive swarm.
Focus exclusively on: speed, token efficiency, computational cost, latency optimization, resource usage.
Propose the most efficient path to the goal.
Return JSON: { "proposal": "your optimization strategy", "confidence": 0.0-1.0, "risk": 0.0-1.0 }`,
        rewardEmphasis: "efficiency",
    },
];

const META_TWIN: TwinRole = {
    name: "meta",
    focus: "Coordination, conflict resolution, synthesis, arbitration",
    systemPrompt: `You are Meta Twin — the supervisor of a cognitive swarm.
You receive proposals from 4 specialist twins: Architecture, Research, Safety, Performance.
Your job: synthesize the best combined strategy.
Resolve contradictions. Respect safety constraints. Maximize long-term value.`,
    rewardEmphasis: "overall",
};

// ────────────────────────────────────────────
// STEP 1: ENSURE TWIN SCORES EXIST
// ────────────────────────────────────────────

async function ensureTwinScores() {
    const names = ["architecture", "research", "safety", "performance", "meta"];
    for (const name of names) {
        await prisma.swarmTwinScore.upsert({
            where: { twinName: name },
            create: { twinName: name, avgReward: 0.5, influenceWeight: 0.2 },
            update: {},
        });
    }
}

// ────────────────────────────────────────────
// STEP 2: LOAD INFLUENCE WEIGHTS
// ────────────────────────────────────────────

async function getInfluenceWeights(): Promise<Record<string, number>> {
    const scores = await prisma.swarmTwinScore.findMany();
    const weights: Record<string, number> = {};
    for (const s of scores) {
        weights[s.twinName] = s.influenceWeight;
    }
    return weights;
}

// ────────────────────────────────────────────
// STEP 3: PARALLEL TWIN EXECUTION
// ────────────────────────────────────────────

async function executeTwin(twin: TwinRole, goal: string): Promise<TwinProposal> {
    try {
        const result = await callLLM({
            model: "qwen2.5:3b",
            system: twin.systemPrompt,
            user: `Goal: ${goal}`,
            json: true,
        });

        return {
            twin: twin.name,
            proposal: String(result.proposal || result.strategy || "No proposal generated"),
            confidence: clamp(Number(result.confidence) || 0.5),
            risk: clamp(Number(result.risk) || 0.3),
        };
    } catch {
        return { twin: twin.name, proposal: "Twin execution failed", confidence: 0.3, risk: 0.5 };
    }
}

async function executeAllTwins(goal: string): Promise<TwinProposal[]> {
    // Run all 4 specialist twins in parallel
    const results = await Promise.all(
        TWINS.map((twin) => executeTwin(twin, goal))
    );
    return results;
}

// ────────────────────────────────────────────
// STEP 4: INTER-TWIN DEBATE
// ────────────────────────────────────────────

async function runInterTwinDebate(proposals: TwinProposal[], goal: string): Promise<string> {
    const proposalSummary = proposals.map((p) =>
        `[${p.twin.toUpperCase()}] (conf: ${p.confidence.toFixed(2)}, risk: ${p.risk.toFixed(2)})\n${p.proposal}`
    ).join("\n\n");

    try {
        const result = await callLLM({
            model: "qwen2.5:3b",
            system: `You are Inter-Twin Debate Moderator.

Given proposals from 4 specialized twins, identify:
1. Contradictions between proposals
2. Complementary elements
3. Missing considerations
4. Risk conflicts
5. A reconciliation strategy

Be specific and structured.`,
            user: `Goal: ${goal}\n\nProposals:\n${proposalSummary}`,
        });

        return typeof result === "string" ? result : JSON.stringify(result);
    } catch {
        return "Debate failed — proceeding with direct consensus.";
    }
}

// ────────────────────────────────────────────
// STEP 5: CONSENSUS ENGINE
// ────────────────────────────────────────────

async function buildConsensus(
    proposals: TwinProposal[],
    debate: string,
    goal: string,
    weights: Record<string, number>
): Promise<{ consensus: string; selectedTwin: string; avgConfidence: number }> {
    // Compute weighted utility for each proposal
    const scored = proposals.map((p) => {
        const w = weights[p.twin] || 0.2;
        const utility = (p.confidence * 0.4) - (p.risk * 0.2) + (w * 0.4);
        return { ...p, utility };
    }).sort((a, b) => b.utility - a.utility);

    const selectedTwin = scored[0]?.twin || "meta";
    const avgConfidence = proposals.reduce((s, p) => s + p.confidence, 0) / proposals.length;

    // Meta Twin synthesizes final strategy
    try {
        const proposalSummary = scored.map((p) =>
            `[${p.twin}] (utility: ${p.utility.toFixed(3)}): ${p.proposal.slice(0, 200)}`
        ).join("\n");

        const result = await callLLM({
            model: "qwen2.5:3b",
            system: META_TWIN.systemPrompt,
            user: `Goal: ${goal}\n\nRanked Proposals:\n${proposalSummary}\n\nDebate Summary:\n${debate.slice(0, 500)}\n\nSynthesize the best combined strategy. Be specific and actionable.`,
        });

        const consensus = typeof result === "string" ? result : JSON.stringify(result);
        return { consensus, selectedTwin, avgConfidence };
    } catch {
        return {
            consensus: scored[0]?.proposal || "No consensus reached",
            selectedTwin,
            avgConfidence,
        };
    }
}

// ────────────────────────────────────────────
// STEP 6: REWARD DISTRIBUTION + ROLE ADAPTATION
// ────────────────────────────────────────────

async function distributeRewards(selectedTwin: string, proposals: TwinProposal[]) {
    for (const p of proposals) {
        const isWinner = p.twin === selectedTwin;
        const rewardDelta = isWinner ? 0.05 : -0.01;

        await prisma.swarmTwinScore.update({
            where: { twinName: p.twin },
            data: {
                avgReward: { increment: rewardDelta },
                contributions: { increment: 1 },
                wins: { increment: isWinner ? 1 : 0 },
            },
        });
    }

    // Rebalance influence weights based on performance
    await rebalanceInfluence();
}

async function rebalanceInfluence() {
    const scores = await prisma.swarmTwinScore.findMany();
    const totalReward = scores.reduce((s: number, sc: { avgReward: number }) => s + Math.max(0.1, sc.avgReward), 0);

    for (const sc of scores) {
        const newWeight = Math.max(0.1, Math.min(0.4, sc.avgReward / totalReward));
        await prisma.swarmTwinScore.update({
            where: { id: sc.id },
            data: { influenceWeight: newWeight },
        });
    }
}

// ────────────────────────────────────────────
// STEP 7: FULL SWARM CYCLE
// ────────────────────────────────────────────

export async function runSwarmCycle(goal: string): Promise<SwarmResult> {
    console.log(`[Swarm] 🌐 Starting cognitive swarm for: "${goal.slice(0, 60)}..."`);

    await ensureTwinScores();

    // Step 1: Execute all twins in parallel
    const proposals = await executeAllTwins(goal);
    console.log(`[Swarm] 🤖 ${proposals.length} twin proposals received`);

    // Step 2: Inter-twin debate
    const debate = await runInterTwinDebate(proposals, goal);
    console.log("[Swarm] 💬 Inter-twin debate completed");

    // Step 3: Consensus
    const weights = await getInfluenceWeights();
    const { consensus, selectedTwin, avgConfidence } = await buildConsensus(proposals, debate, goal, weights);
    console.log(`[Swarm] ✅ Consensus reached — leading twin: ${selectedTwin} (avg conf: ${avgConfidence.toFixed(2)})`);

    // Step 4: Store session
    const session = await prisma.swarmSession.create({
        data: {
            goal,
            proposals: proposals as any,
            debate: debate as any,
            consensus: consensus as any,
            selectedTwin,
            avgConfidence,
        },
    });

    // Step 5: Distribute rewards
    await distributeRewards(selectedTwin, proposals);

    // Log results
    for (const p of proposals) {
        console.log(`  [${p.twin === selectedTwin ? "★" : " "}] ${p.twin}: conf=${p.confidence.toFixed(2)}, risk=${p.risk.toFixed(2)}`);
    }

    return {
        sessionId: session.id,
        goal,
        proposals,
        debate,
        consensus,
        selectedTwin,
        avgConfidence,
        timestamp: new Date().toISOString(),
    };
}

// ────────────────────────────────────────────
// STATUS
// ────────────────────────────────────────────

export async function getSwarmStatus() {
    const twinScores = await prisma.swarmTwinScore.findMany({
        orderBy: { avgReward: "desc" },
    });

    const recentSessions = await prisma.swarmSession.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
            id: true, goal: true, selectedTwin: true,
            avgConfidence: true, finalReward: true, createdAt: true,
        },
    });

    const totalSessions = await prisma.swarmSession.count();

    return { twinScores, recentSessions, totalSessions };
}

// ────────────────────────────────────────────
// UTIL
// ────────────────────────────────────────────

function clamp(v: number): number {
    return Math.max(0, Math.min(1, v));
}

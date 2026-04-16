/**
 * Governance Enforcement Module
 *
 * Enforces cognitive constraints before every LLM invocation:
 * - Identity drift guard
 * - Hallucination rate threshold
 * - Autonomy mode limiting
 * - Temperature adjustment based on system health
 */

export interface GovernanceState {
    identityStability: number;
    hallucinationRate: number;
    autonomyMode: "passive" | "advisory" | "full";
    reward: number;
}

export interface GovernanceDecision {
    temperatureOverride?: number;
    additionalPrompt: string;
    autonomyMode: "passive" | "advisory" | "full";
    blocked: boolean;
    reason?: string;
}

const DRIFT_THRESHOLD = 0.7;
const HALLUCINATION_THRESHOLD = 0.08;
const CRITICAL_HALLUCINATION = 0.15;
const LOW_REWARD_THRESHOLD = 0.5;

/**
 * Evaluates governance rules and returns enforcement decisions.
 * Called before every LLM invocation to maintain system integrity.
 */
export function enforceGovernance(state: GovernanceState): GovernanceDecision {
    const decision: GovernanceDecision = {
        additionalPrompt: "",
        autonomyMode: state.autonomyMode,
        blocked: false,
    };

    const warnings: string[] = [];

    // Rule 1: Identity drift guard
    if (state.identityStability < DRIFT_THRESHOLD) {
        decision.autonomyMode = "passive";
        decision.temperatureOverride = 0.1;
        warnings.push(
            "IDENTITY_DRIFT_DETECTED: Reduce creative outputs. Stay strictly within known identity parameters."
        );
    }

    // Rule 2: Hallucination rate threshold
    if (state.hallucinationRate > CRITICAL_HALLUCINATION) {
        decision.blocked = true;
        decision.reason = `Hallucination rate ${(state.hallucinationRate * 100).toFixed(1)}% exceeds critical threshold. System requires recalibration.`;
        return decision;
    }

    if (state.hallucinationRate > HALLUCINATION_THRESHOLD) {
        decision.temperatureOverride = 0.15;
        warnings.push(
            "HIGH_HALLUCINATION_RATE: Use ONLY retrieved context. Do NOT supplement with general knowledge. If unsure, say so."
        );
    }

    // Rule 3: Low reward guard
    if (state.reward < LOW_REWARD_THRESHOLD) {
        decision.temperatureOverride = Math.min(
            decision.temperatureOverride ?? 0.3,
            0.2
        );
        warnings.push(
            "LOW_REWARD_SIGNAL: Prioritize conciseness and accuracy over thoroughness."
        );
    }

    // Build governance prompt injection
    if (warnings.length > 0) {
        decision.additionalPrompt = `\n\n### GOVERNANCE_ENFORCEMENT:\n${warnings.map(w => `- ${w}`).join("\n")}`;
    }

    return decision;
}

/**
 * Fetches current governance state from cognitive metrics.
 * Used by chat route to get real-time system health.
 */
export async function getGovernanceState(): Promise<GovernanceState> {
    try {
        const res = await fetch(
            `${process.env.NEXTAUTH_URL || "http://localhost:3334"}/api/cognitive/state`,
            { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        return {
            identityStability: data.identityStability ?? 0.94,
            hallucinationRate: data.hallucinationRate ?? 0.04,
            autonomyMode: data.autonomyMode ?? "advisory",
            reward: data.reward ?? 0.85,
        };
    } catch {
        // Safe defaults — don't block on governance API failure
        return {
            identityStability: 0.94,
            hallucinationRate: 0.04,
            autonomyMode: "advisory",
            reward: 0.85,
        };
    }
}

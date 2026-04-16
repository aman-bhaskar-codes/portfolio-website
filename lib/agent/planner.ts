/**
 * Agentic Planner — Tool-Aware Routing Layer
 *
 * Upgrades intent detection into a full planner that determines
 * which tools to use and in what order. Supports multi-tool routing
 * for complex queries that need multiple knowledge sources.
 */

export type ToolAction = "rag" | "memory" | "github" | "research" | "architecture" | "overview";

export interface Plan {
    primary: ToolAction;
    secondary?: ToolAction;
    reasoning: string;
    requiresLive: boolean;
}

const PATTERNS: Record<ToolAction, RegExp[]> = {
    github: [
        /github/i, /commit/i, /push/i, /repo/i, /repository/i,
        /pull request/i, /merge/i, /branch/i, /code update/i,
        /latest.*(?:build|ship|deploy|update|change)/i,
    ],
    memory: [
        /remember/i, /earlier/i, /last time/i, /previously/i,
        /you said/i, /we discussed/i, /my name/i, /i told you/i,
        /our conversation/i, /you mentioned/i,
    ],
    research: [
        /research/i, /paper/i, /article/i, /publish/i, /write/i,
        /thought.*leadership/i, /blog/i, /insight/i,
    ],
    architecture: [
        /architect/i, /system design/i, /infrastructure/i, /how.*built/i,
        /stack/i, /diagram/i, /deploy/i, /pipeline/i, /rag.*system/i,
    ],
    rag: [
        /project/i, /backend/i, /frontend/i, /database/i, /api/i,
        /tech/i, /framework/i, /experience/i, /skill/i, /work/i,
    ],
    overview: [], // Fallback
};

/**
 * Plans tool routing for a query.
 * Returns primary + optional secondary tool, with reasoning.
 */
export function planRoute(query: string): Plan {
    const lower = query.toLowerCase();
    const matched: ToolAction[] = [];

    // Score each tool
    for (const [tool, patterns] of Object.entries(PATTERNS)) {
        const matchCount = patterns.filter((p) => p.test(lower)).length;
        if (matchCount > 0) {
            matched.push(tool as ToolAction);
        }
    }

    // No match → overview
    if (matched.length === 0) {
        return {
            primary: "rag",
            reasoning: "No specific intent detected — using general RAG retrieval.",
            requiresLive: false,
        };
    }

    // Multi-tool detection
    const primary = matched[0];
    const secondary = matched.length > 1 ? matched[1] : undefined;
    const requiresLive = matched.includes("github");

    // Build reasoning
    const toolNames = matched.map((t) => t.toUpperCase()).join(" + ");
    const reasoning = `Detected ${toolNames} intent — routing to ${primary}${secondary ? ` with ${secondary} supplement` : ""}.`;

    return { primary, secondary, reasoning, requiresLive };
}

/**
 * Checks if a query is multi-step (needs more than one tool).
 */
export function isMultiStep(query: string): boolean {
    const connectors = /\b(and|also|plus|with|including|as well as)\b/i;
    const multiIntentPatterns = [
        /explain.*(?:and|with).*latest/i,
        /(?:project|system).*(?:and|with).*(?:update|change)/i,
        /(?:research|article).*(?:about|on).*(?:project|system)/i,
    ];

    return connectors.test(query) && multiIntentPatterns.some((p) => p.test(query));
}

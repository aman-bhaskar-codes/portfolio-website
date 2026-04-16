/**
 * Intent Detection — RAG 2.0 Category-Aware Classifier
 *
 * 9-category classification for precise knowledge retrieval.
 * Zero LLM cost — pure regex pattern matching.
 */

export type Intent =
    | "identity"    // Who is Aman, education, skills, links
    | "project"     // Projects, repos, tech stack
    | "system"      // RAG, memory, architecture internals
    | "governance"  // Safety, constraints, ethics
    | "saas"        // SaaS platform, tenants, billing
    | "research"    // Research lab, hypotheses, experiments
    | "github"      // Live GitHub activity
    | "memory"      // Conversation recall
    | "general";    // Fallback

const INTENT_PATTERNS: Record<Intent, RegExp[]> = {
    identity: [
        /who (?:is|are) aman/i, /about aman/i, /aman(?:'s)? (?:name|profile|bio|background)/i,
        /education/i, /university/i, /college/i, /degree/i, /b\.?tech/i, /aktu/i,
        /skills?/i, /experience/i, /qualification/i, /certified/i,
        /social (?:link|media|profile)/i, /linkedin/i, /instagram/i, /twitter/i,
        /contact/i, /email/i, /resume/i, /cv/i,
        /philosophy/i, /vision/i, /mission/i, /what (?:does|do) (?:he|you) believe/i,
        /tell me about (?:you|yourself|him|aman)/i,
    ],
    project: [
        /project/i, /repo(?:mind|sitory)?/i, /forgeai/i, /portfolio/i,
        /what (?:did|has|have) (?:he|you) build/i, /built/i,
        /tech stack/i, /architecture/i, /stack/i, /feature/i,
        /backend/i, /frontend/i, /database/i, /api/i,
        /how.*built/i, /framework/i, /app(?:lication)?/i,
    ],
    system: [
        /rag (?:pipeline|system|architecture)/i, /retrieval/i, /embedding/i,
        /memory (?:system|architecture|layer|tier)/i, /cognitive/i,
        /swarm/i, /reward/i, /reinforcement/i, /drift/i, /autonomy/i,
        /how (?:does|do) (?:the|this|your) (?:ai|system|engine)/i,
        /pipeline/i, /inference/i, /llm/i, /model/i,
        /how (?:does|do) (?:it|things) work/i,
    ],
    governance: [
        /governance/i, /safety/i, /constraint/i, /guardrail/i,
        /halu?cin/i, /anti.?hallu/i, /ethics/i, /alignment/i,
        /rate limit/i, /token limit/i, /security/i, /trust/i,
        /policy/i, /rule/i, /principle/i, /restriction/i,
    ],
    saas: [
        /saas/i, /tenant/i, /multi.?tenant/i, /billing/i, /pricing/i,
        /subscription/i, /api key/i, /usage/i, /platform/i,
        /enterprise/i, /scaling/i, /deploy/i,
    ],
    research: [
        /research/i, /hypothesis/i, /experiment/i, /paper/i,
        /lab/i, /publish/i, /insight/i, /finding/i,
        /universe/i, /visualization/i, /3d/i, /cognitive state/i,
        /blog/i, /article/i, /thought leadership/i,
    ],
    github: [
        /github/i, /commit/i, /push/i, /pull request/i,
        /merge/i, /branch/i, /code update/i,
        /what.*(?:build|ship|deploy|update)/i, /latest.*(?:activity|change)/i,
    ],
    memory: [
        /remember/i, /earlier/i, /last time/i, /previously/i,
        /you said/i, /we discussed/i, /my name/i, /i told you/i,
        /our conversation/i, /before/i,
    ],
    general: [], // Fallback — no patterns
};

/**
 * Detects intent from a user query. Returns the first matching category.
 * Priority: identity > project > system > governance > saas > research > github > memory > general
 */
export function detectIntent(query: string): Intent {
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
        if (patterns.some(p => p.test(query))) {
            return intent as Intent;
        }
    }
    return "general";
}

/**
 * Maps intent to a knowledge category for filtered retrieval.
 * Returns the category string to filter the Knowledge table.
 */
export function getKnowledgeCategory(intent: Intent): string | null {
    const mapping: Record<Intent, string | null> = {
        identity: "identity",
        project: "project",
        system: "system",
        governance: "governance",
        saas: "saas",
        research: "research",
        github: "project",   // GitHub queries also search project knowledge
        memory: null,         // Memory intent bypasses knowledge retrieval
        general: null,        // General searches all categories
    };
    return mapping[intent];
}

/**
 * Returns retrieval weights based on detected intent.
 * Higher weight = more results from that source.
 */
export function getRetrievalWeights(intent: Intent): {
    knowledge: number;
    memory: number;
} {
    switch (intent) {
        case "identity":
            return { knowledge: 5, memory: 1 };
        case "project":
        case "github":
            return { knowledge: 4, memory: 1 };
        case "system":
        case "governance":
        case "saas":
        case "research":
            return { knowledge: 4, memory: 1 };
        case "memory":
            return { knowledge: 1, memory: 5 };
        case "general":
        default:
            return { knowledge: 3, memory: 2 };
    }
}

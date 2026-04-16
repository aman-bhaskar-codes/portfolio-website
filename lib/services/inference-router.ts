
import { callLLM } from "./llm.service";
import { KnowledgeOrchestrator } from "./knowledge-orchestrator";

// --- Types ---
export type RoutingDecision = {
    source: "RAG" | "BASE" | "HYBRID";
    intent: string;
    confidence: number;
    reasoning: string;
    context?: string;
};

// --- LRU Cache (Simple Implementation) ---
class QuickCache<T> {
    private cache = new Map<string, T>();
    private maxSize: number;

    constructor(maxSize: number = 100) {
        this.maxSize = maxSize;
    }

    get(key: string): T | undefined {
        const item = this.cache.get(key);
        if (item) {
            this.cache.delete(key);
            this.cache.set(key, item);
        }
        return item;
    }

    set(key: string, value: T) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
}

// --- INTELLIGENT ROUTER ---
export class InferenceRouter {
    private static instance: InferenceRouter;
    private orchestrator: KnowledgeOrchestrator;
    private intentCache: QuickCache<{ category: string, confidence: number }>;

    private constructor() {
        this.orchestrator = KnowledgeOrchestrator.getInstance();
        this.intentCache = new QuickCache(50);
    }

    public static getInstance(): InferenceRouter {
        if (!InferenceRouter.instance) {
            InferenceRouter.instance = new InferenceRouter();
        }
        return InferenceRouter.instance;
    }

    // 🧠 CORE DECISION ENGINE (The "Real Algorithm")
    public async route(query: string): Promise<RoutingDecision> {
        const start = Date.now();
        const simplifiedQuery = query.toLowerCase().trim();

        // STEP 1: INTENT CLASSIFICATION (Fast Path)
        let { category, confidence } = await this.classifyIntent(simplifiedQuery);

        // STEP 2: PORTFOLIO RELEVANCE SCORE (Layer 1 + Layer 2)
        let relevanceScore = await this.estimatePortfolioRelevance(simplifiedQuery, category);

        // STEP 2.5: ARCHITECTURAL WEIGHTING
        // When intent is architecture-related, boost relevance to favor RAG retrieval
        const architectureKeywords = ["architecture", "system", "design", "infrastructure", "pipeline", "orchestrat", "scalab"];
        const isArchitectural = architectureKeywords.some(kw => simplifiedQuery.includes(kw));
        if (isArchitectural && ["A", "B"].includes(category)) {
            relevanceScore = Math.min(1.0, relevanceScore + 0.15);
        }

        // STEP 3: ROUTING MATRIX (Strict Logic)
        let source: "RAG" | "BASE" | "HYBRID" = "BASE";
        let reasoning = "";

        // Decision Logic from System Prompt
        if (["A", "B"].includes(category)) { // Portfolio/Technical
            if (relevanceScore > 0.60) {
                source = "RAG";
                reasoning = `High portfolio relevance (${(relevanceScore * 100).toFixed(0)}%). Retrieving facts.`;
            } else {
                source = "HYBRID"; // Fallback to hybrid if intent is there but keywords weak
                reasoning = "Portfolio intent but specific relevance low. Using Hybrid.";
            }
        } else if (category === "C") { // Conceptual
            if (relevanceScore < 0.30) {
                source = "BASE";
                reasoning = "General concept. No portfolio data needed.";
            } else {
                source = "HYBRID";
                reasoning = "Concept with some portfolio overlap. Using Hybrid.";
            }
        } else {
            source = "BASE";
            reasoning = "Low relevance/Off-topic. Using base model.";
        }

        console.log(`[Router] Decision: ${source} | Intent: ${category} | Rel: ${relevanceScore.toFixed(2)} | Latency: ${Date.now() - start}ms`);

        return {
            source,
            intent: category,
            confidence: Math.max(confidence, relevanceScore * 100),
            reasoning
        };
    }

    // --- EXECUTION LAYER ---
    public async execute(query: string, decision: RoutingDecision) {
        const topK = decision.source === "HYBRID" ? 4 : 5; // Adaptive Top-K

        try {
            switch (decision.source) {
                case "RAG":
                    // Strict RAG: High retrieval confidence, minimal hallucination
                    const chunks = (await this.orchestrator.retrieve(query, { intent: decision.intent })) as any[];
                    // Return context for system to synthesize
                    return { context: chunks.map((c: any) => c.content).join("\n\n"), mode: "strict" };

                case "HYBRID":
                    // RAG + Reasoning
                    const hybridChunks = (await this.orchestrator.retrieve(query, { intent: decision.intent, maxResults: 3 })) as any[];
                    return { context: hybridChunks.map((c: any) => c.content).join("\n\n"), mode: "balanced" };

                case "BASE":
                    return { context: "", mode: "creative" };
            }
        } catch (error) {
            console.error("[Router] Execution Error (Fallback to BASE):", error);
            // Safety Check: If RAG fails, fallback to empty context so at least SOMETHING is generated
            return { context: "", mode: "creative" };
        }
    }

    // --- HELPERS ---

    private async classifyIntent(query: string): Promise<{ category: string, confidence: number }> {
        // 1. Cache Check
        const cached = this.intentCache.get(query);
        if (cached) return cached;

        // 2. Keyword Heuristics (Zero Latency)
        let category = "C";
        let confidence = 0;

        if (query.match(/(project|resume|experience|work|contact|email|github|linkedin|who are you|aman)/)) {
            category = "A"; // Portfolio
            confidence = 90;
        } else if (query.match(/(architecture|stack|code|tech|next\.js|typescript|react)/)) {
            category = "B"; // Technical
            confidence = 85;
        }

        // 3. LLM Fallback (only if needed)
        if (confidence === 0) {
            try {
                // Mocking fast LLM call for now to save tokens/time in this loop
                // In prod: callLLM(...) with 0.5B model
                // For now, assume General unless strong signal
                category = "C";
                confidence = 60;
            } catch (e) {
                category = "C";
                confidence = 50;
            }
        }

        const result = { category, confidence };
        this.intentCache.set(query, result);
        return result;
    }

    private async estimatePortfolioRelevance(query: string, intentCategory: string): Promise<number> {
        let score = 0;

        // Layer 1: Keyword Signal Boost
        if (query.includes("aman")) score += 0.3;
        if (query.includes("project")) score += 0.2;
        if (query.includes("architecture")) score += 0.2;

        // Intent Boost
        if (intentCategory === "A") score += 0.4;
        if (intentCategory === "B") score += 0.3;

        // Layer 2: Vector Probe (Mocked - in prod call Embedding service)
        // const probeScore = await this.embeddingProbe(query);
        // score += probeScore * 0.5;

        return Math.min(score, 1.0); // Cap at 1.0
    }
}

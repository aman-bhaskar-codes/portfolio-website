/**
 * Model Registry — Multi-Model Orchestration
 *
 * Defines available models with per-tier configurations.
 * Models are selected by the router based on query intent and complexity.
 *
 * Tiers:
 *   FAST — Low-latency responses for simple queries
 *   DEEP — High-quality reasoning for complex/architecture queries
 *   EVAL — Lightweight model for self-evaluation scoring
 */

export type ModelTier = "FAST" | "DEEP" | "EVAL";

export interface ModelConfig {
    name: string;
    contextWindow: number;
    maxTokens: number;
    temperature: number;
    topP: number;
    repeatPenalty: number;
    keepAlive: string;
    timeout: number; // ms
    description: string;
}

export const MODELS: Record<ModelTier, ModelConfig> = {
    FAST: {
        name: "qwen2.5:3b",
        contextWindow: 4096,
        maxTokens: 300,
        temperature: 0.3,
        topP: 0.9,
        repeatPenalty: 1.1,
        keepAlive: "5m",
        timeout: 20_000,
        description: "Fast responses for general queries",
    },
    DEEP: {
        name: "qwen2.5:3b",
        contextWindow: 4096,
        maxTokens: 400,
        temperature: 0.2,
        topP: 0.85,
        repeatPenalty: 1.15,
        keepAlive: "5m",
        timeout: 30_000,
        description: "Deep reasoning for architecture/system design queries",
    },
    EVAL: {
        name: "qwen2.5:3b",
        contextWindow: 2048,
        maxTokens: 80,
        temperature: 0.1,
        topP: 0.9,
        repeatPenalty: 1.0,
        keepAlive: "5m",
        timeout: 10_000,
        description: "Self-evaluation scoring",
    },
};

/**
 * Returns the model config for a given tier.
 * Falls back to FAST if unknown tier is provided.
 */
export function getModelConfig(tier: ModelTier): ModelConfig {
    return MODELS[tier] || MODELS.FAST;
}

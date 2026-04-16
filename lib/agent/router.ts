/**
 * Model Router — Intent-Based Model Selection
 *
 * Analyzes query complexity and intent to select the optimal model tier.
 * Extends the existing planner's intent detection with model-tier awareness.
 *
 * Selection logic:
 *   DEEP — Architecture, system design, long/complex queries, explicit reasoning requests
 *   FAST — Everything else (general chat, simple lookups)
 */

import { type ModelTier, getModelConfig, type ModelConfig } from "./models";

export interface ModelSelection {
    tier: ModelTier;
    model: string;
    config: ModelConfig;
    reasoning: string;
}

/** Patterns that trigger DEEP model routing */
const DEEP_PATTERNS: RegExp[] = [
    /architect/i,
    /system\s*design/i,
    /explain\s*(deeply|in\s*detail|thoroughly|step\s*by\s*step)/i,
    /reason\s*(step\s*by\s*step|through|about)/i,
    /how\s*(does|do|is|are)\s*.*(built|designed|implemented|work)/i,
    /compare\s*(and\s*contrast|between)/i,
    /trade[\s-]*offs?\s*(of|between|for)/i,
    /infrastructure/i,
    /pipeline\s*(design|architecture)/i,
    /scalab(le|ility)/i,
    /distributed\s*system/i,
    /deep\s*dive/i,
    /technical\s*(overview|breakdown|analysis)/i,
    /production[\s-]*grade/i,
];

/** Minimum query length that auto-triggers DEEP */
const DEEP_LENGTH_THRESHOLD = 300;

/** Score-based complexity indicators */
const COMPLEXITY_SIGNALS: { pattern: RegExp; weight: number }[] = [
    { pattern: /\b(why|how|explain)\b/i, weight: 1 },
    { pattern: /\b(versus|vs\.?|compared?\s*to)\b/i, weight: 2 },
    { pattern: /\b(pros?\s*and\s*cons?|advantages?|disadvantages?)\b/i, weight: 2 },
    { pattern: /\b(implement|design|build|create)\b/i, weight: 1 },
    { pattern: /\?.*\?/i, weight: 2 }, // Multiple questions
];

/** Complexity threshold that triggers DEEP */
const COMPLEXITY_THRESHOLD = 3;

/**
 * Selects the optimal model tier based on query analysis.
 */
export function selectModel(query: string): ModelSelection {
    const trimmed = query.trim();

    // 1. Pattern match for DEEP triggers
    for (const pattern of DEEP_PATTERNS) {
        if (pattern.test(trimmed)) {
            const config = getModelConfig("DEEP");
            return {
                tier: "DEEP",
                model: config.name,
                config,
                reasoning: `Pattern match: ${pattern.source.substring(0, 30)} → DEEP model`,
            };
        }
    }

    // 2. Long query → DEEP
    if (trimmed.length > DEEP_LENGTH_THRESHOLD) {
        const config = getModelConfig("DEEP");
        return {
            tier: "DEEP",
            model: config.name,
            config,
            reasoning: `Query length ${trimmed.length} > ${DEEP_LENGTH_THRESHOLD} → DEEP model`,
        };
    }

    // 3. Complexity scoring
    let complexityScore = 0;
    for (const { pattern, weight } of COMPLEXITY_SIGNALS) {
        if (pattern.test(trimmed)) complexityScore += weight;
    }

    if (complexityScore >= COMPLEXITY_THRESHOLD) {
        const config = getModelConfig("DEEP");
        return {
            tier: "DEEP",
            model: config.name,
            config,
            reasoning: `Complexity score ${complexityScore} >= ${COMPLEXITY_THRESHOLD} → DEEP model`,
        };
    }

    // 4. Default → FAST
    const config = getModelConfig("FAST");
    return {
        tier: "FAST",
        model: config.name,
        config,
        reasoning: `Standard query → FAST model`,
    };
}

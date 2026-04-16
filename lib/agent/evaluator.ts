/**
 * Self-Evaluation Layer — Post-Response Quality Scoring
 *
 * After the LLM generates a response, this evaluates quality
 * without requiring a second LLM call (zero-cost evaluation).
 *
 * Scoring dimensions:
 *   - Relevance: Does the response address the query?
 *   - Confidence: How confident was the RAG pipeline?
 *   - Completeness: Is the response substantive?
 */

interface EvaluationInput {
    query: string;
    response: string;
    ragConfidence: number;
    sourceCount: number;
    intent: string;
}

export interface EvaluationResult {
    relevance: number;    // 0–1
    confidence: number;   // 0–1
    completeness: number; // 0–1
    overall: number;      // 0–1
    flag: "strong" | "acceptable" | "weak";
}

/**
 * Zero-cost evaluation — no LLM call needed.
 * Uses heuristics based on response characteristics.
 */
export function evaluateResponse(input: EvaluationInput): EvaluationResult {
    const { query, response, ragConfidence, sourceCount, intent } = input;

    // 1. Relevance — keyword overlap between query and response
    const queryWords = new Set(
        query.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    );
    const responseWords = response.toLowerCase().split(/\s+/);
    const overlap = responseWords.filter((w) => queryWords.has(w)).length;
    const relevance = Math.min(1, overlap / Math.max(queryWords.size, 1));

    // 2. Confidence — direct from RAG pipeline
    const confidence = ragConfidence;

    // 3. Completeness — response length and structure
    const wordCount = response.split(/\s+/).length;
    let completeness: number;
    if (wordCount < 10) completeness = 0.2;
    else if (wordCount < 30) completeness = 0.5;
    else if (wordCount < 100) completeness = 0.8;
    else completeness = 1.0;

    // Bonus for structured content (markdown, code blocks)
    if (response.includes("**") || response.includes("```")) {
        completeness = Math.min(1, completeness + 0.1);
    }

    // 4. Source penalty — low sources = lower score
    const sourcePenalty = sourceCount === 0 ? 0.3 : sourceCount < 2 ? 0.7 : 1.0;

    // 5. Overall weighted score
    const overall = (
        relevance * 0.25 +
        confidence * 0.35 +
        completeness * 0.2 +
        sourcePenalty * 0.2
    );

    // 6. Flag
    const flag: EvaluationResult["flag"] =
        overall >= 0.7 ? "strong" :
            overall >= 0.4 ? "acceptable" :
                "weak";

    return { relevance, confidence, completeness, overall, flag };
}

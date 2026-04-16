/**
 * RAG 2.0 — Context Compression & Structured Prompt Builder
 * 
 * Deduplicates, trims, and formats retrieved chunks into a
 * token-efficient, category-labeled context for Qwen 2.5:3B.
 * 
 * Budget: ~625 tokens max to preserve generation quality.
 */

import { RAGResult } from "./types";
import { Intent } from "./intent";

const MAX_CONTEXT_CHARS = 2500; // ~625 tokens
const MAX_CHUNKS = 5;

/**
 * Deduplicates chunks by content similarity (exact match after trimming).
 */
function deduplicateResults(results: RAGResult[]): RAGResult[] {
    const seen = new Set<string>();
    return results.filter(r => {
        const key = r.content.trim().substring(0, 200);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Trims individual chunk content to prevent bloat.
 */
function trimContent(content: string, maxChars: number = 700): string {
    if (content.length <= maxChars) return content;
    return content.substring(0, maxChars) + "...";
}

/**
 * Maps intent to a human-readable retrieval label.
 */
function getIntentLabel(intent: Intent): string {
    const labels: Record<Intent, string> = {
        identity: "Identity & Profile",
        project: "Projects & Architecture",
        system: "System Architecture",
        governance: "Governance & Safety",
        saas: "SaaS Platform",
        research: "Research & Innovation",
        github: "GitHub Activity",
        memory: "Conversation Memory",
        general: "General Knowledge",
    };
    return labels[intent] || "Knowledge";
}

/**
 * Builds the final structured context for the LLM prompt.
 * Includes category labels for better LLM grounding.
 */
export function buildContext(
    query: string,
    results: RAGResult[],
    intent: Intent
): string {
    if (results.length === 0) return "";

    const unique = deduplicateResults(results);
    const top = unique.slice(0, 4);

    const ctx = [];

    for (const r of top) {
        ctx.push(`Source: ${r.title}\nSummary:\n${r.content.substring(0, 400)}`);
    }

    return ctx.join("\n\n---\n\n");
}

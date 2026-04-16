/**
 * GitHub Repository LLM Analyzer
 *
 * Automatically reads repository metadata (and ideally READMEs)
 * to generate an architectural summary, tech stack, and complexity score
 * using the local AI Twin.
 */

import { callLLM } from "@/lib/services/llm.service";

export interface RepoAnalysis {
    architecture_summary: string;
    detected_stack: string[];
    complexity_score: number;
    ai_insight: string;
}

export async function analyzeRepo(repo: any): Promise<RepoAnalysis> {
    const prompt = `
Analyze this GitHub repository.

Name: ${repo.name}
Description: ${repo.description || "No description provided."}
Language: ${repo.language || "Unknown"}
Stars: ${repo.stargazers_count}
Has Issues: ${repo.has_issues}
Has Wiki: ${repo.has_wiki}

You are an expert Software Architect reviewing this repository.
Return a STRICT JSON response with this exact structure:
{
  "architecture_summary": "A 2-sentence technical summary of what this repo likely does.",
  "detected_stack": ["React", "TypeScript", "Node"], 
  "complexity_score": 0.85, // Float between 0.0 and 1.0
  "ai_insight": "A single insightful 1-sentence comment on the repo's structure or potential."
}
`;

    try {
        const result = await callLLM({
            model: "qwen2.5:3b",
            system: "You are an expert Software Architect. Return ONLY valid JSON.",
            user: prompt,
            json: true,
        });

        return {
            architecture_summary: String(result.architecture_summary || "Architecture unknown."),
            detected_stack: Array.isArray(result.detected_stack) ? result.detected_stack : [repo.language].filter(Boolean),
            complexity_score: Number(result.complexity_score) || 0.5,
            ai_insight: String(result.ai_insight || "A standard repository structure."),
        };
    } catch (e) {
        console.error(`[GitHub Analysis] Failed for ${repo.name}:`, e);
        return {
            architecture_summary: repo.description || "Analysis failed.",
            detected_stack: [repo.language].filter(Boolean),
            complexity_score: 0.1,
            ai_insight: "LLM analysis temporarily unavailable.",
        };
    }
}

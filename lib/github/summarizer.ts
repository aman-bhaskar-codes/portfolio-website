/**
 * GitHub Repo Summarizer — Ollama-Powered
 *
 * Takes raw README + metadata and produces a concise,
 * embedding-optimized summary for the knowledge base.
 */

import { callLLMSync } from "@/services/ollama";

/**
 * Summarizes repo content into a structured knowledge chunk.
 * Keeps output concise for the 1.5B model's context window.
 */
export async function summarizeRepo(
    repoName: string,
    readme: string,
    packageJson?: string | null
): Promise<string> {
    // Build a combined input, truncated to avoid overwhelming the model
    let input = `Repository: ${repoName}\n\n`;
    input += `README:\n${readme.slice(0, 4000)}\n`;

    if (packageJson) {
        try {
            const pkg = JSON.parse(packageJson);
            const deps = Object.keys(pkg.dependencies || {}).join(", ");
            const devDeps = Object.keys(pkg.devDependencies || {}).slice(0, 10).join(", ");
            input += `\nStack: ${deps}\nDev Tools: ${devDeps}\n`;
        } catch {
            // Invalid package.json, skip
        }
    }

    const messages = [
        {
            role: "system",
            content: `You are a technical documentation system. Summarize this GitHub repository for a developer portfolio knowledge base. Output ONLY a structured summary with these sections:
- PURPOSE: What the project does (1-2 sentences)
- STACK: Technologies used
- ARCHITECTURE: Key design decisions
- NOTABLE: What makes it interesting

Keep total output under 300 words. Be precise and technical.`
        },
        {
            role: "user",
            content: input
        }
    ];

    try {
        const summary = await callLLMSync(messages);
        return summary || `Project: ${repoName} — Summary generation failed.`;
    } catch (error) {
        console.warn(`[SUMMARIZER] Failed for ${repoName}:`, error);
        // Fallback: use truncated README directly
        return `Project: ${repoName}\n${readme.slice(0, 500)}`;
    }
}

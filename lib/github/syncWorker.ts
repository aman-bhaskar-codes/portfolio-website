/**
 * GitHub Sync Worker
 *
 * Runs background intelligence sync:
 * 1. Fetches latest public repos for user
 * 2. Compares against DB to find new/updated repos
 * 3. Runs LLM Analysis on new ones
 * 4. Upserts intelligence to DB
 */

import { Octokit } from "octokit";
import prisma from "@/lib/prisma";
import { analyzeRepo } from "./analyzeRepo";

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

export async function syncGitHubProjects() {
    console.log("[GitHub Sync] Starting intelligence sync loop...");
    const username = process.env.GITHUB_USERNAME;

    if (!username) {
        console.error("[GitHub Sync] GITHUB_USERNAME missing from .env");
        return { success: false, error: "Missing config" };
    }

    try {
        // 1. Fetch repos
        const { data: repos } = await octokit.rest.repos.listForUser({
            username,
            type: "owner",
            sort: "updated",
            direction: "desc",
            per_page: 8,
        });

        const activeRepos = repos.filter(r => !r.fork);
        let analyzedCount = 0;

        // 2. Process each
        for (const repo of activeRepos) {
            // Check if we already analyzed it recently (within 24h)
            const existing = await prisma.githubProjectIntelligence.findUnique({
                where: { repoName: repo.name }
            });

            // Very simple cache logic: re-analyze if older than 24 hours OR if it doesn't exist
            const needsAnalysis = !existing ||
                (Date.now() - existing.updatedAt.getTime() > 24 * 60 * 60 * 1000);

            if (needsAnalysis) {
                console.log(`[GitHub Sync] Analyzing ${repo.name}...`);
                const analysis = await analyzeRepo(repo);

                await prisma.githubProjectIntelligence.upsert({
                    where: { repoName: repo.name },
                    update: {
                        description: repo.description,
                        language: repo.language,
                        stars: repo.stargazers_count,
                        architectureSummary: analysis.architecture_summary,
                        detectedStack: analysis.detected_stack,
                        complexityScore: analysis.complexity_score,
                        aiInsight: analysis.ai_insight,
                    },
                    create: {
                        repoName: repo.name,
                        description: repo.description,
                        language: repo.language,
                        stars: repo.stargazers_count,
                        architectureSummary: analysis.architecture_summary,
                        detectedStack: analysis.detected_stack,
                        complexityScore: analysis.complexity_score,
                        aiInsight: analysis.ai_insight,
                    }
                });
                analyzedCount++;
            }
        }

        console.log(`[GitHub Sync] Complete. Analyzed ${analyzedCount} new/updated out of ${activeRepos.length} repos.`);
        return { success: true, processed: activeRepos.length, analyzed: analyzedCount };

    } catch (e: any) {
        console.error("[GitHub Sync] Failed:", e.message);
        return { success: false, error: e.message };
    }
}

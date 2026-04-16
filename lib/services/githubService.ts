import { Octokit } from "octokit";
import prisma from "@/lib/prisma";
import { analyzeRepo } from "@/lib/github/analyzeRepo";
import { logger } from "@/lib/logger";

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

export async function syncGitHubProjects() {
    logger.info("[GITHUB-SYNC-SERVICE] Starting specialized intelligence sync loop...");
    const username = process.env.GITHUB_USERNAME;

    if (!username) {
        logger.error("[GITHUB-SYNC-SERVICE] GITHUB_USERNAME missing from .env");
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
            // Check if we already analyzed it recently
            const existing = await prisma.githubProjectIntelligence.findUnique({
                where: { repoName: repo.name }
            });

            // Optimize: Instead of blind time-checks, verify if the repo's actual updated_at changed vs stored
            const repoUpdateDate = new Date(repo.updated_at || Date.now()).getTime();
            const localUpdateDate = existing ? existing.updatedAt.getTime() : 0;

            const needsAnalysis = !existing || (repoUpdateDate > localUpdateDate);

            if (needsAnalysis) {
                logger.info(`[GITHUB-SYNC-SERVICE] Commencing Deep Analysis mapping for: ${repo.name}...`);
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
                        updatedAt: new Date(), // Match latest sync frame
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
            } else {
                logger.info(`[GITHUB-SYNC-SERVICE] Skipping ${repo.name} — Core alignment cache valid.`);
            }
        }

        logger.info(`[GITHUB-SYNC-SERVICE] Cycle Complete. Analyzed ${analyzedCount} new/updated out of ${activeRepos.length} repos.`);
        return { success: true, processed: activeRepos.length, analyzed: analyzedCount };

    } catch (e: any) {
        logger.error(`[GITHUB-SYNC-SERVICE] Execution Failed: Catch Block - ${e.message}`);
        return { success: false, error: e.message };
    }
}

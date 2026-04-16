/**
 * Project Publish API — Admin-Only
 *
 * Accepts a GitHub URL, fetches README + metadata,
 * summarizes via Ollama, stores in both Project (UI) and
 * ProjectKnowledge (RAG) tables.
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/prisma";
import { extractOwnerRepo } from "@/lib/github/utils";
import { fetchReadme, fetchPackageJson } from "@/lib/github/fetcher";
import { summarizeRepo } from "@/lib/github/summarizer";
import { storeKnowledge } from "@/lib/github/store";

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { githubUrl, tags } = await req.json();

        if (!githubUrl) {
            return NextResponse.json({ error: "Missing GitHub URL" }, { status: 400 });
        }

        const { owner, repo } = extractOwnerRepo(githubUrl);
        const accessToken = (token.accessToken as string) || process.env.GITHUB_TOKEN || "";

        console.log(`[PUBLISH] Processing: ${owner}/${repo}...`);

        // 1. Fetch repo metadata from GitHub API
        const repoRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}`,
            {
                headers: {
                    ...(accessToken ? { "Authorization": `token ${accessToken}` } : {}),
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "portfolio-ai",
                },
                signal: AbortSignal.timeout(8000),
            }
        );

        if (!repoRes.ok) {
            return NextResponse.json(
                { error: `GitHub repo not found: ${repoRes.status}` },
                { status: 404 }
            );
        }

        const repoData = await repoRes.json();

        // 2. Fetch README + package.json
        const [readme, packageJson] = await Promise.all([
            fetchReadme(owner, repo, accessToken),
            fetchPackageJson(owner, repo, accessToken),
        ]);

        if (!readme) {
            return NextResponse.json(
                { error: "No README found in this repository" },
                { status: 404 }
            );
        }

        // 3. Summarize via Ollama
        const summary = await summarizeRepo(repo, readme, packageJson);

        // 4. Upsert project for UI display
        const project = await prisma.project.upsert({
            where: { githubUrl },
            create: {
                name: repoData.name,
                githubUrl,
                description: repoData.description || summary.slice(0, 300),
                summary,
                tags: tags || [],
                language: repoData.language,
                stars: repoData.stargazers_count || 0,
                lastSyncedAt: new Date(),
                githubPushedAt: repoData.pushed_at ? new Date(repoData.pushed_at) : null,
            },
            update: {
                description: repoData.description || summary.slice(0, 300),
                summary,
                tags: tags || [],
                language: repoData.language,
                stars: repoData.stargazers_count || 0,
                lastSyncedAt: new Date(),
                githubPushedAt: repoData.pushed_at ? new Date(repoData.pushed_at) : null,
            },
        });

        // 5. Store in RAG knowledge base
        const chunks = await storeKnowledge(repo, summary);

        console.log(`[PUBLISH] Done: ${repo} — ${chunks} knowledge chunks stored`);

        return NextResponse.json({
            success: true,
            project,
            knowledgeChunks: chunks,
        });

    } catch (error: any) {
        console.error("[PUBLISH] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

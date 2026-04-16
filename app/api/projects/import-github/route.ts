import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { enqueueJob } from "@/lib/queue";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any)?.role !== "owner") {
            return new Response("Unauthorized", { status: 401 });
        }

        const { repoUrl } = await req.json();
        const parsed = parseGitHubUrl(repoUrl);

        if (!parsed) {
            return Response.json({ error: "Invalid GitHub URL" }, { status: 400 });
        }

        const { owner, repo } = parsed;

        // Fetch Repo Data
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                "Authorization": process.env.GITHUB_TOKEN ? `Bearer ${process.env.GITHUB_TOKEN}` : "",
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (!repoRes.ok) {
            return Response.json({ error: "GitHub Repo not found or private" }, { status: 404 });
        }

        const repoData = await repoRes.json();

        // Fetch README
        const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
            headers: {
                "Authorization": process.env.GITHUB_TOKEN ? `Bearer ${process.env.GITHUB_TOKEN}` : "",
                "Accept": "application/vnd.github.v3+json"
            }
        });

        let content = "";
        if (readmeRes.ok) {
            const readmeData = await readmeRes.json();
            content = Buffer.from(readmeData.content, "base64").toString("utf-8");
        }

        // Auto Stack Detection
        const stack = detectTechStack(content || repoData.description || "");
        if (repoData.language && !stack.includes(repoData.language)) {
            stack.push(repoData.language);
        }

        // Create Project
        // Handle slug collision by appending timestamp if needed? 
        // Or just let it fail/update? 
        // User wants "Import", implying new. If exists, maybe return existing?
        // Logic: Try create.

        const slug = repo.toLowerCase(); // Simple slug

        // Check availability
        const existing = await prisma.project.findUnique({ where: { slug } });
        if (existing) {
            return Response.json({ error: `Project '${slug}' already exists.`, project: existing }, { status: 409 });
            // Or update? For now, error is safer for "Import". Re-sync is separate.
        }

        const project = await prisma.project.create({
            data: {
                name: repoData.name,
                slug,
                githubUrl: repoUrl,
                description: repoData.description || "",
                content: content,
                tags: stack,
                language: repoData.language,
                stars: repoData.stargazers_count,
                status: "draft"
            }
        });

        // Queue Embedding
        if (content) {
            await enqueueJob("index-source", {
                type: "project",
                sourceId: project.id,
                content,
                title: project.name
            });
        }

        // Also queue GitHub Sync for deeper analysis?
        await enqueueJob("github-sync", {
            owner,
            repo
        });

        return Response.json({ success: true, project });

    } catch (error: any) {
        console.error("Import Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

function parseGitHubUrl(url: string) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
}

function detectTechStack(text: string): string[] {
    const stack: string[] = [];
    const keywords = [
        "Next.js", "React", "TypeScript", "Node.js", "Python",
        "PostgreSQL", "Docker", "Tailwind", "Prisma", "FastAPI",
        "OpenAI", "Supabase", "Firebase", "AWS", "Vercel"
    ];

    for (const key of keywords) {
        if (text.toLowerCase().includes(key.toLowerCase())) {
            stack.push(key);
        }
    }
    return stack;
}

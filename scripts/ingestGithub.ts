import prisma from "../lib/prisma";
import { fetchRepoFiles } from "../lib/github";
import { summarizeCode } from "../lib/codeSummarizer";
import { chunkText } from "../lib/chunker";
import { createEmbedding } from "../lib/embeddings";

async function ingestRepo(owner: string, repo: string) {
    console.log(`Starting ingestion for ${owner}/${repo}...`);
    try {
        const files = await fetchRepoFiles(owner, repo);

        for (const file of files) {
            console.log("Analyzing:", file.path);

            const summary = await summarizeCode(file.path, file.content);

            const chunks = chunkText(summary || "");

            for (const chunk of chunks) {
                const embedding = await createEmbedding(chunk);

                const embeddingStr = `[${embedding.join(',')}]`;
                await prisma.$executeRawUnsafe(`
                    INSERT INTO "Knowledge" ("id", "title", "content", "category", "sourceType", "importance", "embedding", "updatedAt")
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, 0.7, $5::vector, NOW())
                `, `${repo} - ${file.path}`, chunk, 'project', 'github', embeddingStr);
            }
        }

        console.log("GitHub knowledge ingested successfully.");
    } catch (error) {
        console.error("Ingestion failed:", error);
    }
}

// Replace with target repo
// ingestRepo("yourGithubUsername", "yourRepoName");

console.log("Ingestion script ready. Uncomment ingestRepo call with your details to run.");

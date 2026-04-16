import prisma from "./prisma";
import { fetchRepoFiles } from "./github";
import { summarizeCode } from "./codeSummarizer";
import { chunkText } from "./chunker";
import { createEmbedding } from "./embeddings";

export async function ingestRepo(owner: string, repo: string) {
    console.log(`[GITHUB_SYNC] Starting session for ${owner}/${repo}...`);
    try {
        const files = await fetchRepoFiles(owner, repo);
        let processed = 0;
        let failed = 0;

        for (const file of files) {
            try {
                console.log(`[GITHUB_SYNC] Analyzing: ${file.path}`);

                const summary = await summarizeCode(file.path, file.content);
                const chunks = chunkText(summary || "");

                // Generate embeddings for stored chunks inline (no transaction wrapper for raw SQL yet)
                for (const chunk of chunks) {
                    const embedding = await createEmbedding(chunk);
                    const embeddingStr = `[${embedding.join(',')}]`;
                    await prisma.$executeRawUnsafe(`
                        INSERT INTO "Knowledge" ("id", "title", "content", "sourceType", "sourceId", "embedding", "updatedAt")
                        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::vector, NOW())
                    `, `${repo} - ${file.path}`, chunk, 'github', `${owner}/${repo}`, embeddingStr);
                }

                processed++;
            } catch (fileError: any) {
                failed++;
                console.error(`[GITHUB_SYNC] File failed: ${file.path} — ${fileError.message}`);
            }
        }

        console.log(`[GITHUB_SYNC] Done: ${processed}/${files.length} files processed, ${failed} failed.`);
        return { success: true, filesCount: files.length, processed, failed };
    } catch (error: any) {
        console.error("[GITHUB_SYNC] Ingestion failed:", error.message);
        return { success: false, error: error.message };
    }
}


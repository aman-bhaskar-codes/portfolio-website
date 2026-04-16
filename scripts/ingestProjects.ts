import prisma from "../lib/prisma";
import { chunkText } from "../lib/chunker";
import { createEmbedding } from "../lib/embeddings";

async function ingest() {
    const projects = [
        {
            title: "RepoMind Architecture",
            text: `
RepoMind is a multi-module agentic AI system with ingestion layer,
orchestration engine, execution sandbox, vector memory,
observability layer, compliance, CI/CD integration,
and marketplace monetization system. 
The ingestion layer handles diverse data sources including GitHub, GitLab, and local file systems, 
performing deep semantic analysis of codebases to generate structural embeddings.
`
        }
    ];

    for (const project of projects) {
        console.log(`Ingesting ${project.title}...`);
        const chunks = chunkText(project.text);

        for (const chunk of chunks) {
            const embedding = await createEmbedding(chunk);

            const embeddingStr = `[${embedding.join(',')}]`;
            await prisma.$executeRawUnsafe(`
                INSERT INTO "Knowledge" ("id", "title", "content", "embedding", "updatedAt")
                VALUES (gen_random_uuid(), $1, $2, $3::vector, NOW())
            `, project.title, chunk, embeddingStr);
        }
    }

    console.log("Knowledge ingested successfully");
}

ingest().catch(console.error);

import { createEmbedding } from "../lib/embeddings";
import prisma from "../lib/prisma";

async function ingestKnowledge(title: string, content: string) {
    console.log(`Ingesting knowledge: ${title}...`);
    const embedding = await createEmbedding(content);

    const embeddingStr = `[${embedding.join(',')}]`;
    await prisma.$executeRawUnsafe(`
        INSERT INTO "Knowledge" ("id", "title", "content", "embedding", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3::vector, NOW())
    `, title, content, embeddingStr);
    console.log("Success.");
}

// Example usage or automated ingestion
const knowledgeItems = [
    {
        title: "Portfolio Architecture",
        content: "The portfolio is built with Next.js 14 App Router, Prisma, and pgvector. It features a cognitive architecture that extracts memories from user conversations and performs semantic retrieval to provide context-aware responses."
    },
    {
        title: "Aman's Tech Stack",
        content: "Aman is a product-minded engineer experienced in Next.js, TypeScript, PostgreSQL, Redis, and AI engineering. He focuses on building production-grade agentic systems rather than just simple portfolios."
    }
];

async function run() {
    for (const item of knowledgeItems) {
        await ingestKnowledge(item.title, item.content);
    }
}

run().catch(console.error);

import { detectIntent, getKnowledgeCategory, getRetrievalWeights } from "./lib/rag/intent";
import { retrieve } from "./lib/rag/retrieval";
import { embedQuery } from "./lib/rag/embeddings";

async function testQuery(query: string) {
    console.log(`\n--- Query: "${query}" ---`);
    const intent = detectIntent(query);
    const category = getKnowledgeCategory(intent);
    const weights = getRetrievalWeights(intent);

    console.log(`Intent: ${intent} | Category: ${category}`);

    const embedding = await embedQuery(query);
    const retrieval = await retrieve(embedding, weights, category);

    console.log(`Results: ${retrieval.totalCount} (Strong: ${retrieval.strongCount}) | Confidence: ${(retrieval.confidence * 100).toFixed(0)}%`);
    for (const r of retrieval.results) {
        console.log(`- [${r.category}] ${r.title} (Sim: ${(r.similarity * 100).toFixed(0)}%)`);
    }
}

async function run() {
    await testQuery("Where did Aman study and what is his philosophy?");
    await testQuery("Explain the architecture of RepoMind.");
    await testQuery("How does the AI Universe visualization work?");
}

run();

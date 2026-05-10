/**
 * bootstrap_knowledge.ts — RAG Knowledge Ingestion Script
 * 
 * Reads all markdown files from data/, chunks them, embeds via Ollama,
 * and upserts into Qdrant vector database.
 * 
 * Usage:
 *   npx tsx scripts/bootstrap_knowledge.ts
 * 
 * Prerequisites:
 *   - Ollama running locally with nomic-embed-text model
 *   - Qdrant running (docker compose up qdrant)
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import * as fs from 'fs';
import * as path from 'path';

// ── Configuration ──
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = 'portfolio_knowledge';
const EMBED_MODEL = 'nomic-embed-text';
const VECTOR_SIZE = 768; // nomic-embed-text dimension

// ── Knowledge files with priority weights ──
const KNOWLEDGE_FILES = [
  { path: 'data/owner/bio.md', docType: 'owner_bio', priority: 1.0 },
  { path: 'data/owner/engineering_philosophy.md', docType: 'owner_philosophy', priority: 0.9 },
  { path: 'data/owner/strong_opinions.md', docType: 'owner_opinions', priority: 0.8 },
  { path: 'data/owner/availability.md', docType: 'owner_availability', priority: 1.0 },
  { path: 'data/projects/all_projects.md', docType: 'projects_overview', priority: 1.0 },
  { path: 'data/knowledge/tech_stack_depth.md', docType: 'tech_knowledge', priority: 0.8 },
  { path: 'data/knowledge/learning_log.md', docType: 'learning_log', priority: 0.7 },
];

// ── Embed text via Ollama ──
async function embed(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  });

  if (!res.ok) {
    throw new Error(`Ollama embed failed: ${res.status} ${await res.text()}`);
  }

  const { embedding } = await res.json();
  return embedding;
}

// ── Ensure Qdrant collection exists ──
async function ensureCollection(): Promise<void> {
  const collectionsRes = await fetch(`${QDRANT_URL}/collections`);
  const { result } = await collectionsRes.json();
  const exists = result.collections.some((c: { name: string }) => c.name === COLLECTION_NAME);

  if (!exists) {
    console.log(`  Creating collection: ${COLLECTION_NAME}`);
    const createRes = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
      }),
    });
    if (!createRes.ok) {
      throw new Error(`Failed to create collection: ${await createRes.text()}`);
    }
  } else {
    console.log(`  Collection "${COLLECTION_NAME}" already exists`);
  }
}

// ── Upsert points to Qdrant ──
async function upsertPoints(points: Array<{ id: number; vector: number[]; payload: Record<string, unknown> }>): Promise<void> {
  const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}/points`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points }),
  });

  if (!res.ok) {
    throw new Error(`Qdrant upsert failed: ${await res.text()}`);
  }
}

// ── Main ingestion ──
async function bootstrap(): Promise<void> {
  console.log('═══════════════════════════════════════');
  console.log('  ANTIGRAVITY OS — Knowledge Bootstrap');
  console.log('═══════════════════════════════════════\n');

  // Step 1: Verify Ollama is running
  try {
    const ollamaCheck = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!ollamaCheck.ok) throw new Error();
    console.log('✓ Ollama is running');
  } catch {
    console.error('✗ Ollama is not running. Start it with: ollama serve');
    process.exit(1);
  }

  // Step 2: Verify Qdrant is running
  try {
    const qdrantCheck = await fetch(`${QDRANT_URL}/readyz`);
    if (!qdrantCheck.ok) throw new Error();
    console.log('✓ Qdrant is running');
  } catch {
    console.error('✗ Qdrant is not running. Start it with: docker compose up qdrant -d');
    process.exit(1);
  }

  // Step 3: Ensure collection
  await ensureCollection();

  // Step 4: Chunk and ingest each file
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 64,
    separators: ['\n---\n', '\n## ', '\n### ', '\n\n', '\n', ' '],
  });

  let globalId = 0;
  let totalChunks = 0;
  let batch: Array<{ id: number; vector: number[]; payload: Record<string, unknown> }> = [];

  for (const file of KNOWLEDGE_FILES) {
    const filePath = path.join(process.cwd(), file.path);

    if (!fs.existsSync(filePath)) {
      console.log(`  SKIP: ${file.path} (not found)`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const docs = await splitter.createDocuments([content]);

    for (let i = 0; i < docs.length; i++) {
      const chunk = docs[i].pageContent;

      // Skip very short chunks (headers, separators)
      if (chunk.trim().length < 50) continue;

      const vector = await embed(chunk);

      batch.push({
        id: globalId++,
        vector,
        payload: {
          text: chunk,
          source: file.path,
          doc_type: file.docType,
          chunk_index: i,
          priority: file.priority,
          ingested_at: new Date().toISOString(),
        },
      });

      // Flush batch every 32 points
      if (batch.length >= 32) {
        await upsertPoints(batch);
        batch = [];
      }
    }

    console.log(`  ✓ ${file.path}: ${docs.length} chunks`);
    totalChunks += docs.length;
  }

  // Flush remaining
  if (batch.length > 0) {
    await upsertPoints(batch);
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`  Bootstrap complete: ${totalChunks} chunks from ${KNOWLEDGE_FILES.length} files`);
  console.log(`  Collection: ${COLLECTION_NAME}`);
  console.log(`═══════════════════════════════════════\n`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});

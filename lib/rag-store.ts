// RAG Pipeline — Vector store backed by JSON file
// Zero infrastructure needed. Upgrade path: swap for Qdrant/pgvector.

import fs from 'fs'
import path from 'path'
import { embed } from './ollama'

const VECTORS_PATH = path.join(process.cwd(), 'data', 'vectors.json')
const TOP_K = 8
const TOP_N = 4

export interface Chunk {
  id: string
  text: string
  embedding: number[]
  metadata: {
    source: string
    type: 'knowledge' | 'github_repo' | 'project'
    title?: string
    url?: string
    createdAt: string
  }
}

interface VectorStore {
  chunks: Chunk[]
  lastUpdated: string
}

// In-memory cache
let memCache: Chunk[] | null = null
let cacheStale = true

function loadStore(): Chunk[] {
  if (!cacheStale && memCache) return memCache
  try {
    if (!fs.existsSync(VECTORS_PATH)) return []
    const raw = fs.readFileSync(VECTORS_PATH, 'utf-8')
    const store: VectorStore = JSON.parse(raw)
    memCache = store.chunks
    cacheStale = false
    return memCache
  } catch {
    return []
  }
}

function saveStore(chunks: Chunk[]) {
  const dir = path.dirname(VECTORS_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const store: VectorStore = { chunks, lastUpdated: new Date().toISOString() }
  fs.writeFileSync(VECTORS_PATH, JSON.stringify(store, null, 2))
  memCache = chunks
  cacheStale = false
}

/** Cosine similarity between two vectors */
function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/** BM25-inspired keyword boost for exact term matches */
function keywordBoost(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const textLower = text.toLowerCase()
  let matches = 0
  for (const word of queryWords) {
    if (textLower.includes(word)) matches++
  }
  return matches / Math.max(queryWords.length, 1) * 0.15
}

/** Split text into overlapping chunks */
export function chunkText(
  text: string,
  source: string,
  type: Chunk['metadata']['type'],
  metadata?: Partial<Chunk['metadata']>
): Omit<Chunk, 'embedding'>[] {
  const chunks: Omit<Chunk, 'embedding'>[] = []
  let start = 0
  let idx = 0
  const chunkSize = 512
  const overlap = 64

  const clean = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length)
    const chunk = clean.slice(start, end)

    if (chunk.trim().length > 50) {
      chunks.push({
        id: `${source}-${idx++}`,
        text: chunk,
        metadata: {
          source,
          type,
          createdAt: new Date().toISOString(),
          ...metadata,
        },
      })
    }

    if (end === clean.length) break
    start = end - overlap
  }

  return chunks
}

/** Add new chunks to the vector store (embeds via Ollama) */
export async function addChunks(
  rawChunks: Omit<Chunk, 'embedding'>[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const existing = loadStore()
  const existingIds = new Set(existing.map(c => c.id))
  const toEmbed = rawChunks.filter(c => !existingIds.has(c.id))
  if (toEmbed.length === 0) return

  const newChunks: Chunk[] = []
  for (let i = 0; i < toEmbed.length; i++) {
    const chunk = toEmbed[i]
    const embedding = await embed(chunk.text)
    newChunks.push({ ...chunk, embedding })
    onProgress?.(i + 1, toEmbed.length)
  }

  saveStore([...existing, ...newChunks])
}

/** Clear all chunks from a given source */
export function clearSource(source: string) {
  const chunks = loadStore().filter(c => c.metadata.source !== source)
  saveStore(chunks)
}

/** Main RAG retrieval — semantic search + keyword boost */
export async function retrieve(query: string): Promise<Chunk[]> {
  const chunks = loadStore()
  if (chunks.length === 0) return []

  const queryEmbedding = await embed(query)

  const scored = chunks.map(chunk => ({
    chunk,
    score: cosine(queryEmbedding, chunk.embedding) + keywordBoost(query, chunk.text),
  }))

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, TOP_N).map(s => s.chunk)
}

/** Get store statistics */
export function getStoreStats(): { total: number; sources: Record<string, number> } {
  const chunks = loadStore()
  const sources: Record<string, number> = {}
  for (const chunk of chunks) {
    sources[chunk.metadata.source] = (sources[chunk.metadata.source] || 0) + 1
  }
  return { total: chunks.length, sources }
}

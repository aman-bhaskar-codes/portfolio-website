// One-shot knowledge ingestion script
// Run: npx tsx scripts/ingest.ts

import * as fs from 'fs'
import * as path from 'path'

// Set env manually for script context
process.env.OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
process.env.OLLAMA_EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'
process.env.GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'aman-bhaskar-codes'

async function embed(text: string): Promise<number[]> {
  const res = await fetch(`${process.env.OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.OLLAMA_EMBED_MODEL, prompt: text }),
  })
  if (!res.ok) throw new Error(`Embed failed: ${res.status} ${await res.text()}`)
  const data = await res.json() as { embedding: number[] }
  return data.embedding
}

function chunkText(text: string, chunkSize = 512, overlap = 64): string[] {
  const chunks: string[] = []
  let start = 0
  const clean = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length)
    const chunk = clean.slice(start, end).trim()
    if (chunk.length > 50) chunks.push(chunk)
    if (end === clean.length) break
    start = end - overlap
  }
  return chunks
}

interface VectorChunk {
  id: string
  text: string
  embedding: number[]
  metadata: {
    source: string
    type: string
    title?: string
    url?: string
    createdAt: string
  }
}

async function main() {
  console.log('🚀 Starting knowledge ingestion...\n')

  // Check Ollama
  try {
    const res = await fetch(`${process.env.OLLAMA_BASE_URL}/api/tags`)
    if (!res.ok) throw new Error('Ollama not responding')
    console.log('✓ Ollama is running\n')
  } catch {
    console.error('✗ Ollama is not running! Start it with: ollama serve')
    console.error('  Then pull models: ollama pull nomic-embed-text && ollama pull llama3.2:3b')
    process.exit(1)
  }

  const allChunks: VectorChunk[] = []
  let id = 0

  // 1. Ingest knowledge.md
  console.log('📚 Ingesting knowledge.md...')
  const knowledgePath = path.join(process.cwd(), 'data', 'knowledge.md')
  if (fs.existsSync(knowledgePath)) {
    const text = fs.readFileSync(knowledgePath, 'utf-8')
    const chunks = chunkText(text)
    for (let i = 0; i < chunks.length; i++) {
      process.stdout.write(`  Embedding chunk ${i + 1}/${chunks.length}...\r`)
      const embedding = await embed(chunks[i])
      allChunks.push({
        id: `knowledge-${id++}`,
        text: chunks[i],
        embedding,
        metadata: {
          source: 'knowledge-base',
          type: 'knowledge',
          title: 'Aman Bhaskar Knowledge Base',
          createdAt: new Date().toISOString(),
        },
      })
    }
    console.log(`\n✓ knowledge.md: ${chunks.length} chunks embedded`)
  } else {
    console.log('✗ data/knowledge.md not found, skipping')
  }

  // 2. Ingest data/owner/*.md files
  const ownerDir = path.join(process.cwd(), 'data', 'owner')
  if (fs.existsSync(ownerDir)) {
    const files = fs.readdirSync(ownerDir).filter(f => f.endsWith('.md'))
    console.log(`\n📂 Ingesting ${files.length} owner docs...`)
    for (const file of files) {
      const text = fs.readFileSync(path.join(ownerDir, file), 'utf-8')
      const chunks = chunkText(text)
      for (let i = 0; i < chunks.length; i++) {
        process.stdout.write(`  [${file}] chunk ${i + 1}/${chunks.length}...\r`)
        const embedding = await embed(chunks[i])
        allChunks.push({
          id: `owner-${file}-${id++}`,
          text: chunks[i],
          embedding,
          metadata: {
            source: `owner/${file}`,
            type: 'knowledge',
            title: file.replace('.md', ''),
            createdAt: new Date().toISOString(),
          },
        })
      }
      console.log(`\n✓ ${file}: ${chunks.length} chunks`)
    }
  }

  // 3. Ingest GitHub repos (requires GITHUB_TOKEN)
  if (process.env.GITHUB_TOKEN) {
    console.log('\n🐙 Fetching GitHub repos...')
    try {
      const { Octokit } = await import('octokit')
      const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
      const username = process.env.GITHUB_USERNAME || 'aman-bhaskar-codes'

      const { data: repos } = await octokit.rest.repos.listForUser({
        username,
        type: 'public',
        sort: 'updated',
        per_page: 20,
      })

      for (const repo of repos) {
        if (repo.fork) continue
        let readmeText = ''
        try {
          const { data: readme } = await octokit.rest.repos.getReadme({
            owner: username,
            repo: repo.name,
          })
          readmeText = Buffer.from(readme.content, 'base64').toString('utf-8')
          readmeText = readmeText
            .replace(/!\[.*?\]\(.*?\)/g, '')
            .replace(/<[^>]+>/g, '')
            .replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, '')
            .trim()
            .slice(0, 6000)
        } catch {
          /* no readme */
        }

        const fullText = [
          `Repository: ${repo.name}`,
          `Description: ${repo.description || 'No description'}`,
          `Language: ${repo.language || 'Multiple'}`,
          `Stars: ${repo.stargazers_count}`,
          `URL: ${repo.html_url}`,
          readmeText,
        ].filter(Boolean).join('\n\n')

        const chunks = chunkText(fullText)
        for (let i = 0; i < chunks.length; i++) {
          process.stdout.write(`  [${repo.name}] chunk ${i + 1}/${chunks.length}...\r`)
          const embedding = await embed(chunks[i])
          allChunks.push({
            id: `github:${repo.name}-${id++}`,
            text: chunks[i],
            embedding,
            metadata: {
              source: `github:${repo.name}`,
              type: 'github_repo',
              title: repo.name,
              url: repo.html_url,
              createdAt: new Date().toISOString(),
            },
          })
        }
        console.log(`\n✓ ${repo.name}: ${chunks.length} chunks`)
      }
    } catch (err) {
      console.error('✗ GitHub fetch failed:', err instanceof Error ? err.message : err)
    }
  } else {
    console.log('\n⚠ GITHUB_TOKEN not set — skipping GitHub ingestion')
    console.log('  Set it in .env.local to auto-ingest your repos')
  }

  // Save to data/vectors.json
  const outputPath = path.join(process.cwd(), 'data', 'vectors.json')
  const store = { chunks: allChunks, lastUpdated: new Date().toISOString() }
  fs.writeFileSync(outputPath, JSON.stringify(store, null, 2))

  console.log(`\n🎉 Done! Vector store: ${allChunks.length} chunks → data/vectors.json`)
  console.log('\nNext steps:')
  console.log('  npm run dev')
  console.log('  Open http://localhost:3000')
  console.log('  Try asking the AI about your projects!')
}

main().catch(console.error)

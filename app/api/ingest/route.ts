import { NextRequest, NextResponse } from 'next/server'
import { fetchUserRepos } from '@/lib/github-agent'
import { chunkText, addChunks, clearSource, getStoreStats } from '@/lib/rag-store'
import { isOllamaRunning } from '@/lib/ollama'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  const ollamaReady = await isOllamaRunning()
  if (!ollamaReady) {
    return NextResponse.json(
      { error: 'Ollama not running. Start with: ollama serve' },
      { status: 503 }
    )
  }

  const results: Record<string, string> = {}

  // 1. Ingest all data/ markdown files
  const dataDir = path.join(process.cwd(), 'data')
  const dataDirs = ['owner', 'projects', 'knowledge']

  for (const subdir of dataDirs) {
    const dirPath = path.join(dataDir, subdir)
    if (!fs.existsSync(dirPath)) continue

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'))
    for (const file of files) {
      const filePath = path.join(dirPath, file)
      const source = `${subdir}/${file}`
      try {
        const text = fs.readFileSync(filePath, 'utf-8')
        clearSource(source)
        const chunks = chunkText(text, source, 'knowledge', {
          title: file.replace('.md', ''),
        })
        await addChunks(chunks)
        results[source] = `✓ ${chunks.length} chunks`
      } catch (err) {
        results[source] = `✗ ${err instanceof Error ? err.message : 'Failed'}`
      }
    }
  }

  // 2. Ingest knowledge.md if it exists at data root
  const knowledgePath = path.join(dataDir, 'knowledge.md')
  if (fs.existsSync(knowledgePath)) {
    try {
      const text = fs.readFileSync(knowledgePath, 'utf-8')
      clearSource('knowledge-base')
      const chunks = chunkText(text, 'knowledge-base', 'knowledge', {
        title: 'Aman Bhaskar Knowledge Base',
      })
      await addChunks(chunks)
      results['knowledge.md'] = `✓ ${chunks.length} chunks`
    } catch (err) {
      results['knowledge.md'] = `✗ ${err instanceof Error ? err.message : 'Failed'}`
    }
  }

  // 3. Ingest GitHub repos
  try {
    const repos = await fetchUserRepos()
    let totalChunks = 0

    for (const repo of repos) {
      if (!repo.readme) continue
      clearSource(`github:${repo.name}`)

      const repoText = [
        `# ${repo.name}`,
        repo.description ? `Description: ${repo.description}` : '',
        `Language: ${repo.language || 'Multiple'}`,
        `Topics: ${repo.topics.join(', ')}`,
        `Stars: ${repo.stars} | Forks: ${repo.forks}`,
        `URL: ${repo.url}`,
        '',
        repo.readme,
      ].filter(Boolean).join('\n')

      const chunks = chunkText(repoText, `github:${repo.name}`, 'github_repo', {
        title: repo.name,
        url: repo.url,
      })
      await addChunks(chunks)
      totalChunks += chunks.length
    }

    results['github-repos'] = `✓ ${repos.length} repos, ${totalChunks} chunks`
  } catch (err) {
    results['github-repos'] = `✗ ${err instanceof Error ? err.message : 'GitHub fetch failed'}`
  }

  const stats = getStoreStats()
  return NextResponse.json({
    success: true,
    results,
    stats,
    message: `Vector store now has ${stats.total} total chunks`,
  })
}

export async function GET() {
  const stats = getStoreStats()
  return NextResponse.json({ stats, ollamaRunning: await isOllamaRunning() })
}

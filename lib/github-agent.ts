// GitHub data fetcher — repos, READMEs, user stats via Octokit

import { Octokit } from 'octokit'

const GITHUB_TOKEN    = process.env.GITHUB_TOKEN
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'aman-bhaskar-codes'

export interface GitHubRepo {
  name: string
  description: string | null
  url: string
  stars: number
  forks: number
  language: string | null
  topics: string[]
  updatedAt: string
  readme?: string
  category?: 'ai' | 'fs' | 'sys'
}

function getOctokit() {
  return new Octokit({ auth: GITHUB_TOKEN })
}

/** Fetch all public repos with READMEs */
export async function fetchUserRepos(): Promise<GitHubRepo[]> {
  const octokit = getOctokit()

  const { data: repos } = await octokit.rest.repos.listForUser({
    username: GITHUB_USERNAME,
    type: 'owner',
    sort: 'updated',
    per_page: 30,
  })

  const results: GitHubRepo[] = []

  for (const repo of repos) {
    if (repo.fork) continue

    let readme: string | undefined
    try {
      const { data: readmeData } = await octokit.rest.repos.getReadme({
        owner: GITHUB_USERNAME,
        repo: repo.name,
      })
      readme = Buffer.from(readmeData.content, 'base64').toString('utf-8')
      readme = readme
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, '')
        .replace(/---+/g, '')
        .trim()
        .slice(0, 8000)
    } catch {
      // No README
    }
    
    // Auto-categorize based on topics
    let category: 'ai' | 'fs' | 'sys' = 'fs'
    const t = repo.topics || []
    if (t.some(x => ['ai', 'rag', 'llm', 'ollama', 'gemini'].includes(x))) category = 'ai'
    else if (t.some(x => ['postgresql', 'database-engineering', 'docker', 'infrastructure'].includes(x))) category = 'sys'

    results.push({
      name: repo.name,
      description: repo.description ?? null,
      url: repo.html_url,
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      language: repo.language ?? null,
      topics: repo.topics ?? [],
      updatedAt: repo.updated_at ?? new Date().toISOString(),
      readme,
      category
    })
  }

  return results
}

/** Fetch GitHub user stats */
export async function fetchUserStats() {
  const octokit = getOctokit()
  const { data: user } = await octokit.rest.users.getByUsername({
    username: GITHUB_USERNAME,
  })
  return {
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
    avatar: user.avatar_url,
    bio: user.bio,
    location: user.location,
    joinedAt: user.created_at,
  }
}

/** Hardcoded fallback repos if GitHub API fails */
export const FALLBACK_REPOS: GitHubRepo[] = [
  {
    name: 'rag-research-assistant',
    description: 'Production-grade RAG Research Assistant — FastAPI, pgvector, Redis, Ollama + Gemini. Hybrid retrieval with HyDE, BM25, RRF, and cross-encoder reranking.',
    url: 'https://github.com/aman-bhaskar-codes/rag-research-assistant',
    stars: 1, forks: 0, language: 'Python',
    topics: ['rag', 'fastapi', 'pgvector', 'ollama', 'gemini', 'redis'],
    updatedAt: '2025-01-01',
    category: 'ai'
  },
  {
    name: 'llm-engineering-lab',
    description: 'Structured Extraction Intelligence Engine — unstructured docs to typed JSON. Multi-tier LLM routing, SSE streaming, ARQ workers.',
    url: 'https://github.com/aman-bhaskar-codes/llm-engineering-lab',
    stars: 2, forks: 0, language: 'Python',
    topics: ['llm', 'fastapi', 'pydantic', 'ollama', 'extraction'],
    updatedAt: '2025-01-01',
    category: 'ai'
  },
  {
    name: 'sql-data-systems-projects',
    description: 'PostgreSQL engineering — university data systems, analytics queries, large-scale dataset simulations in PL/pgSQL.',
    url: 'https://github.com/aman-bhaskar-codes/sql-data-systems-projects',
    stars: 2, forks: 0, language: 'PLpgSQL',
    topics: ['postgresql', 'plpgsql', 'database-engineering'],
    updatedAt: '2025-01-01',
    category: 'sys'
  },
  {
    name: 'portfolio-website',
    description: 'Agentic portfolio — RAG-powered AI twin, visitor intelligence, GitHub knowledge sync. Next.js + Ollama.',
    url: 'https://github.com/aman-bhaskar-codes/portfolio-website',
    stars: 0, forks: 0, language: 'TypeScript',
    topics: ['portfolio', 'ai', 'rag', 'nextjs', 'ollama'],
    updatedAt: '2025-01-01',
    category: 'fs'
  },
]

export const FALLBACK_STATS = {
  followers: 2,
  following: 5,
  publicRepos: 6,
  avatar: 'https://avatars.githubusercontent.com/u/220306985?v=4',
  bio: 'Agentic AI Developer | Building autonomous AI systems, RAG pipelines, and production-grade LLM infrastructure.',
  location: 'Bijnor, Uttar Pradesh, India',
  joinedAt: '2024-01-01',
}

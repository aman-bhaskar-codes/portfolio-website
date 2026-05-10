'use client'
import { useEffect, useState } from 'react'

interface Repo {
  name: string
  description: string | null
  url: string
  stars: number
  forks: number
  language: string | null
  topics: string[]
  updatedAt: string
}

const LANG_COLORS: Record<string, string> = {
  Python:     '#3B82F6',
  TypeScript: '#10B981',
  PLpgSQL:    '#F59E0B',
  GDScript:   '#8B5CF6',
  JavaScript: '#EAB308',
}

const FEATURED = ['rag-research-assistant', 'llm-engineering-lab', 'sql-data-systems-projects', 'portfolio-website']

const FALLBACK_REPOS: Repo[] = [
  {
    name: 'rag-research-assistant',
    description: 'Production-grade RAG Research Assistant — FastAPI, pgvector, Redis, Ollama + Gemini. Hybrid retrieval with HyDE, BM25, RRF, and cross-encoder reranking.',
    url: 'https://github.com/aman-bhaskar-codes/rag-research-assistant',
    stars: 1, forks: 0, language: 'Python',
    topics: ['rag', 'fastapi', 'pgvector', 'ollama', 'gemini', 'redis'],
    updatedAt: '2025-01-01',
  },
  {
    name: 'llm-engineering-lab',
    description: 'Structured Extraction Intelligence Engine — unstructured docs to typed JSON. Multi-tier LLM routing, SSE streaming, ARQ workers.',
    url: 'https://github.com/aman-bhaskar-codes/llm-engineering-lab',
    stars: 2, forks: 0, language: 'Python',
    topics: ['llm', 'fastapi', 'pydantic', 'ollama', 'extraction'],
    updatedAt: '2025-01-01',
  },
  {
    name: 'sql-data-systems-projects',
    description: 'PostgreSQL engineering — university data systems, analytics queries, large-scale dataset simulations in PL/pgSQL.',
    url: 'https://github.com/aman-bhaskar-codes/sql-data-systems-projects',
    stars: 2, forks: 0, language: 'PLpgSQL',
    topics: ['postgresql', 'plpgsql', 'database-engineering'],
    updatedAt: '2025-01-01',
  },
  {
    name: 'portfolio-website',
    description: 'Agentic portfolio — RAG-powered AI twin, visitor intelligence, GitHub knowledge sync. Next.js + Ollama.',
    url: 'https://github.com/aman-bhaskar-codes/portfolio-website',
    stars: 0, forks: 0, language: 'TypeScript',
    topics: ['portfolio', 'ai', 'rag', 'nextjs', 'ollama'],
    updatedAt: '2025-01-01',
  },
]

export default function Projects() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/github')
      .then(r => r.json())
      .then(data => {
        const list: Repo[] = data.repos || FALLBACK_REPOS
        const sorted = [...list].sort((a, b) => {
          const aFeat = FEATURED.indexOf(a.name)
          const bFeat = FEATURED.indexOf(b.name)
          if (aFeat !== -1 && bFeat !== -1) return aFeat - bFeat
          if (aFeat !== -1) return -1
          if (bFeat !== -1) return 1
          return b.stars - a.stars
        })
        setRepos(sorted)
      })
      .catch(() => setRepos(FALLBACK_REPOS))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="projects" className="py-24 px-6 bg-bg-secondary/50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <div className="text-accent-primary font-mono text-sm mb-4">02. projects</div>
          <h2
            className="text-4xl font-bold text-text-primary"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Things I&apos;ve shipped.
          </h2>
          <p className="text-text-secondary mt-3 max-w-xl">
            All projects live on GitHub. All built to solve real problems, not just to learn a framework.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-52 bg-bg-card rounded-xl border border-bg-border animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {repos.map(repo => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-6 bg-bg-card rounded-xl border border-bg-border hover:border-accent-primary/40 hover:bg-bg-card/80 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="font-mono text-sm text-accent-primary font-medium group-hover:underline">
                      {repo.name}
                    </span>
                    {FEATURED.includes(repo.name) && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono bg-accent-primary/10 text-accent-primary rounded">
                        featured
                      </span>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>

                <p className="text-text-secondary text-sm leading-relaxed mb-4 line-clamp-3">
                  {repo.description || 'No description available.'}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {repo.topics.slice(0, 4).map(topic => (
                    <span key={topic} className="px-2 py-0.5 text-[10px] font-mono bg-bg-border/50 text-text-muted rounded">
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
                  {repo.language && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: LANG_COLORS[repo.language] || '#6366F1' }} />
                      {repo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1">★ {repo.stars}</span>
                  <span className="flex items-center gap-1">⑂ {repo.forks}</span>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <a
            href="https://github.com/aman-bhaskar-codes"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-mono text-text-secondary hover:text-accent-primary transition-colors"
          >
            View all on GitHub →
          </a>
        </div>
      </div>
    </section>
  )
}

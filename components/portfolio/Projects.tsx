'use client'
import { useEffect, useState } from 'react'
import { ScrollReveal } from './ScrollReveal'
import type { GitHubRepo } from '@/lib/github-agent'
import { FALLBACK_REPOS } from '@/lib/github-agent'

const FEATURED = ['rag-research-assistant', 'llm-engineering-lab', 'sql-data-systems-projects', 'portfolio-website', 'digital-twin-engine', 'visitor-intelligence']

export default function Projects() {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [filter, setFilter] = useState<'all' | 'ai' | 'fs' | 'sys'>('all')

  useEffect(() => {
    fetch('/api/github')
      .then(r => r.json())
      .then(data => {
        const list: GitHubRepo[] = data.repos || FALLBACK_REPOS
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
  }, [])

  const filteredRepos = repos.filter(repo => {
    if (filter === 'all') return true;
    return repo.category === filter;
  });

  return (
    <section id="projects" className="sec">
      <ScrollReveal className="flex justify-between items-end mb-[3.5rem]">
        <div>
          <p className="sec-label">Featured Works</p>
          <h2 className="sec-title" data-t="Featured Projects">
            Featured<br />Projects
          </h2>
        </div>
        <a 
          href="https://github.com/aman-bhaskar-codes" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white/30 no-underline text-[0.78rem] font-semibold tracking-[0.12em] uppercase border-b border-white/15 pb-[2px] hover:text-white hover:border-white transition-all"
        >
          All projects →
        </a>
      </ScrollReveal>

      <ScrollReveal className="flex gap-[0.4rem] mb-[2.8rem] flex-wrap">
        {[
          { id: 'all', label: 'All' },
          { id: 'ai', label: 'AI / Agentic' },
          { id: 'fs', label: 'Full-Stack' },
          { id: 'sys', label: 'Systems' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`
              bg-transparent border border-white/10 text-white/35 px-[1.4rem] py-[0.45rem]
              font-['Syne'] text-[0.72rem] font-semibold tracking-[0.12em] uppercase rounded-[2px]
              transition-all duration-250 hover:bg-white hover:border-white hover:text-black
              ${filter === tab.id ? 'bg-white border-white text-black' : ''}
            `}
          >
            {tab.label}
          </button>
        ))}
      </ScrollReveal>

      <ScrollReveal className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/5">
        {filteredRepos.slice(0, 6).map((repo, i) => (
          <a
            key={repo.name}
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="group relative overflow-hidden bg-black p-[2.8rem_2.4rem] border border-white/5 transition-colors duration-350 hover:bg-white/5 block"
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[110%] transition-transform duration-500 ease-out group-hover:translate-x-[110%]" />
            
            <p className="text-[0.65rem] tracking-[0.2em] text-white/20 mb-[2.2rem]">
              {(i + 1).toString().padStart(2, '0')}
            </p>
            <span className="inline-block text-[0.6rem] tracking-[0.15em] uppercase text-white/30 border border-white/10 px-[0.65rem] py-[0.18rem] rounded-[2px] mb-[1.4rem]">
              {repo.category === 'ai' ? 'AI / ML' : repo.category === 'fs' ? 'Full-Stack' : 'Systems'}
            </span>
            
            <h3 className="font-['Bebas_Neue'] text-[2.6rem] tracking-[0.02em] leading-none mb-[0.9rem] text-white">
              {repo.name.replace(/-/g, ' ')}
            </h3>
            
            <p className="text-[0.83rem] leading-[1.75] text-white/40 mb-[1.8rem] line-clamp-3">
              {repo.description || 'No description provided.'}
            </p>
            
            <div className="flex flex-wrap gap-[0.5rem]">
              {repo.topics.slice(0, 4).map(topic => (
                <span key={topic} className="text-[0.62rem] tracking-[0.1em] text-white/30 border-b border-white/10 pb-[1px]">
                  {topic}
                </span>
              ))}
            </div>
            
            <i className="absolute bottom-[2.4rem] right-[2.4rem] text-[1.4rem] text-white/15 not-italic transition-all duration-300 group-hover:text-white/65 group-hover:translate-x-[4px] group-hover:-translate-y-[4px]">
              ↗
            </i>
          </a>
        ))}
      </ScrollReveal>
    </section>
  )
}

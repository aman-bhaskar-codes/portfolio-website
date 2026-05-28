'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'

const CATEGORIES = [
  {
    id: 'ai-systems',
    label: '01',
    title: 'AI & Agentic Systems',
    description:
      'Multi-agent orchestration with LangGraph. 5-stage RAG pipelines with ColBERT reranking. Visitor intelligence that classifies your persona before you speak.',
    tags: ['LangGraph', 'RAG', 'Ollama', 'DSPy', 'LangFuse'],
    stat: '48 Python modules',
  },
  {
    id: 'full-stack',
    label: '02',
    title: 'Full-Stack Architecture',
    description:
      'Next.js 14 App Router meets FastAPI with 8 uvicorn workers. PostgreSQL + pgvector for episodic memory. Redis Stack for 10,000 concurrent sessions. All in Docker.',
    tags: ['Next.js 14', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
    stat: '22 Docker services',
  },
  {
    id: 'voice-3d',
    label: '03',
    title: 'Voice & 3D Interfaces',
    description:
      'WebSocket voice agent: speech-to-text → local LLM → text-to-speech. Three.js constellation of skills, explorable in 3D. PWA-ready for offline visits.',
    tags: ['Three.js', 'WebSocket', 'STT', 'TTS', 'PWA'],
    stat: '$0 cloud cost',
  },
]

export function FeaturedProjects() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15%' })

  return (
    <section
      id="projects"
      ref={ref}
      className="py-[var(--section)] max-w-[1400px] mx-auto px-6 md:px-10"
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-16 md:mb-24">
        <div>
          <span className="label text-text3 block mb-4">Featured Work</span>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="section-title"
          >
            What I've<br />
            <span className="text-accent">Built</span>
          </motion.h2>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
        >
          <Link
            href="/projects"
            className="font-mono text-[11px] tracking-[0.12em] uppercase text-text3
              hover:text-text1 transition-colors duration-300 flex items-center gap-2"
          >
            All works <span>→</span>
          </Link>
        </motion.div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border)]">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 60 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.8,
              delay: i * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="project-card bg-surface p-8 md:p-10 group"
          >
            {/* Card number */}
            <div className="flex items-start justify-between mb-8">
              <span className="font-mono text-[11px] text-text3 tracking-wider">
                {cat.label}
              </span>
              <span className="font-mono text-[10px] text-cyan tracking-wider
                opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {cat.stat}
              </span>
            </div>

            {/* Visual placeholder — replace with actual screenshots */}
            <div className="w-full aspect-[16/10] mb-8 bg-bg border border-[var(--border)]
              relative overflow-hidden rounded-sm">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border border-[var(--border)] rounded-full
                  flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-accent animate-ai-pulse" />
                </div>
              </div>
              {/* Gradient sweep on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent
                opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Title */}
            <h3 className="font-display text-xl md:text-2xl font-700 text-text1 mb-4
              leading-tight tracking-tight">
              {cat.title}
            </h3>

            {/* Description */}
            <p className="body-text text-sm leading-relaxed mb-6">
              {cat.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {cat.tags.map((tag) => (
                <span key={tag} className="tag-pill text-[10px]">{tag}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

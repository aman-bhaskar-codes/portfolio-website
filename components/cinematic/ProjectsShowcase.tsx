'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight } from 'lucide-react'
import { RevealText } from './RevealText'

gsap.registerPlugin(ScrollTrigger)

interface Project {
  index: string
  title: string
  description: string
  tags: string[]
  metrics: string
  accent: string
}

const PROJECTS: Project[] = [
  {
    index: '01',
    title: 'Digital Twin Engine',
    description:
      'Persona-adaptive AI that responds as Aman — with real opinions, honest uncertainty, and project-grounded answers. Not a chatbot.',
    tags: ['LangGraph', 'phi4-mini', 'DSPy', 'RAG'],
    metrics: '< 200ms TTFT · 5-stage ColBERT retrieval',
    accent: '#7c6df0',
  },
  {
    index: '02',
    title: '5-Stage RAG Pipeline',
    description:
      'HyDE → Dense → Sparse → RRF Fusion → ColBERT reranking. The most precise retrieval architecture in any portfolio on earth.',
    tags: ['Qdrant', 'BM25', 'ColBERT', 'nomic-embed'],
    metrics: 'Top-5 precision from 100k+ chunks',
    accent: '#f59e0b',
  },
  {
    index: '03',
    title: 'Visitor Intelligence',
    description:
      'Classifies every visitor into recruiter, engineer, founder, or manager before they type a word. Adapts the entire experience in real-time.',
    tags: ['IP Resolution', 'MaxMind', 'UTM Analysis', 'Persona ML'],
    metrics: '0.87 confidence on referrer signals',
    accent: '#06b6d4',
  },
  {
    index: '04',
    title: 'DSPy Self-Optimizer',
    description:
      'MIPROv2 runs every Sunday night. Real conversation data drives prompt evolution. Zero human intervention. The system improves weekly.',
    tags: ['DSPy', 'MIPROv2', 'Celery', 'Temporal'],
    metrics: 'Automated Sunday 1am optimization',
    accent: '#22c55e',
  },
]

function ProjectPanel({ project }: { project: Project }) {
  return (
    <article
      className="project-panel group relative flex w-[85vw] max-w-[620px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-border-subtle bg-surface p-8 transition-colors duration-300 md:h-[62vh] md:p-12"
      style={{ minHeight: 420 }}
    >
      {/* Giant index number */}
      <span
        className="pointer-events-none absolute -right-4 -top-10 select-none font-display text-[11rem] font-bold leading-none opacity-[0.06] transition-opacity duration-500 group-hover:opacity-[0.14] md:text-[15rem]"
        style={{ color: project.accent }}
        aria-hidden="true"
      >
        {project.index}
      </span>

      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-40 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${project.accent}, transparent)` }}
      />

      <div className="relative">
        <span className="font-mono text-xs tracking-[0.2em]" style={{ color: project.accent }}>
          {'/'}{project.index}
        </span>
        <h3 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl text-balance">
          {project.title}
        </h3>
        <p className="mt-5 max-w-md leading-relaxed text-foreground-muted">{project.description}</p>
      </div>

      <div className="relative mt-10 flex flex-col gap-5">
        <div
          className="inline-flex w-fit items-center rounded-md border px-3 py-1.5 font-mono text-xs"
          style={{ borderColor: `${project.accent}33`, color: project.accent, background: `${project.accent}0d` }}
        >
          {project.metrics}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border-subtle bg-overlay px-3 py-1 font-mono text-[0.68rem] tracking-wide text-foreground-faint"
              >
                {tag}
              </span>
            ))}
          </div>
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle transition-all duration-300 group-hover:rotate-45"
            style={{ color: project.accent }}
            aria-hidden="true"
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  )
}

export function ProjectsShowcase() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    if (prefersReduced || !isDesktop) return

    const ctx = gsap.context(() => {
      const getScroll = () => track.scrollWidth - window.innerWidth

      gsap.to(track, {
        x: () => -getScroll(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getScroll()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section id="projects" ref={sectionRef} className="relative overflow-hidden bg-surface/30 py-24 md:py-0">
      <div className="md:flex md:h-svh md:flex-col md:justify-center">
        <div className="mx-auto w-full max-w-6xl px-6 md:mb-12">
          <span className="mb-4 block font-mono text-xs uppercase tracking-[0.2em] text-accent">
            {'// 002 — Selected Work'}
          </span>
          <RevealText
            as="h2"
            className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-6xl"
          >
            Engineered systems, not features.
          </RevealText>
        </div>

        <div
          ref={trackRef}
          className="mt-12 flex flex-col gap-6 px-6 md:mt-0 md:w-max md:flex-row md:gap-8 md:pl-[max(1.5rem,calc((100vw-72rem)/2))] md:pr-24"
        >
          {PROJECTS.map((project) => (
            <ProjectPanel key={project.index} project={project} />
          ))}
        </div>
      </div>
    </section>
  )
}

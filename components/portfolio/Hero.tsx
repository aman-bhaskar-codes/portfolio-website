'use client'
import { useEffect, useState } from 'react'

const TYPED_STRINGS = [
  'Building RAG pipelines.',
  'Engineering LLM systems.',
  'Designing AI infrastructure.',
  'Shipping production AI.',
]

export default function Hero() {
  const [displayed, setDisplayed] = useState('')
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const phrase = TYPED_STRINGS[phraseIdx]
    const speed = deleting ? 40 : 80
    const delay = deleting && charIdx === 0
      ? 600
      : !deleting && charIdx === phrase.length
        ? 2000
        : speed

    const timer = setTimeout(() => {
      if (!deleting && charIdx < phrase.length) {
        setDisplayed(phrase.slice(0, charIdx + 1))
        setCharIdx(c => c + 1)
      } else if (!deleting && charIdx === phrase.length) {
        setDeleting(true)
      } else if (deleting && charIdx > 0) {
        setDisplayed(phrase.slice(0, charIdx - 1))
        setCharIdx(c => c - 1)
      } else {
        setDeleting(false)
        setPhraseIdx(i => (i + 1) % TYPED_STRINGS.length)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [charIdx, deleting, phraseIdx])

  return (
    <section
      id="hero"
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15) 0%, transparent 60%),
          linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 60px 60px, 60px 60px',
      }}
    >
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-secondary/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-primary/30 bg-accent-primary/5 text-accent-primary text-xs font-mono mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary animate-pulse" />
          Available for opportunities
        </div>

        <h1
          className="text-5xl md:text-7xl font-bold mb-4 tracking-tight text-text-primary"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
        >
          Aman Bhaskar
        </h1>

        <div className="h-10 flex items-center justify-center mb-6">
          <p className="text-xl md:text-2xl font-mono text-accent-primary">
            {displayed}
            <span className="animate-blink text-accent-primary ml-0.5">|</span>
          </p>
        </div>

        <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed mb-10">
          Agentic AI developer from India. I build{' '}
          <span className="text-text-primary">autonomous LLM systems</span>,{' '}
          <span className="text-text-primary">hybrid RAG pipelines</span>, and{' '}
          <span className="text-text-primary">production AI infrastructure</span> that actually ships.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#chat"
            className="px-6 py-3 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-xl font-mono text-sm transition-all hover:scale-105 hover:shadow-lg hover:shadow-accent-primary/25"
          >
            Ask my AI twin →
          </a>
          <a
            href="#projects"
            className="px-6 py-3 border border-bg-border hover:border-accent-primary/50 text-text-secondary hover:text-text-primary rounded-xl font-mono text-sm transition-all"
          >
            View projects
          </a>
        </div>

        <div className="mt-16 flex items-center justify-center gap-8 flex-wrap">
          {[
            { label: 'Projects shipped', value: '6+' },
            { label: 'RAG pipelines built', value: '3' },
            { label: 'Stack', value: 'Python + TS' },
            { label: 'Focus', value: 'Local-first AI' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold font-mono text-text-primary">{stat.value}</div>
              <div className="text-xs text-text-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-muted text-xs animate-bounce">
          <span>scroll</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </section>
  )
}

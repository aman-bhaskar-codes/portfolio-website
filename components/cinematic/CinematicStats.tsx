'use client'

import { useRef } from 'react'
import { useInView } from 'framer-motion'
import { useCountUp } from '@/lib/motion'
import { RevealText } from './RevealText'
import { FadeIn } from './FadeIn'

const STATS = [
  { value: 22, suffix: '', label: 'Docker services orchestrated', accent: 'var(--accent-primary)' },
  { value: 5, suffix: '', label: 'RAG pipeline stages', accent: 'var(--amber)' },
  { value: 100, suffix: '%', label: 'Local AI — zero API keys', accent: 'var(--cyan)' },
  { value: 200, suffix: 'ms', prefix: '<', label: 'Time to first token', accent: 'var(--green)' },
]

function StatBlock({ value, suffix, prefix, label, accent, index }: (typeof STATS)[number] & { prefix?: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const count = useCountUp(value, 1800, inView)

  return (
    <FadeIn delay={index * 0.1}>
      <div ref={ref} className="group relative border-l border-border-subtle pl-6 transition-colors">
        <div
          className="absolute left-[-1px] top-0 h-0 w-px transition-all duration-700 group-hover:h-full"
          style={{ background: accent, height: inView ? '100%' : 0, transitionDelay: `${index * 120}ms` }}
        />
        <div className="font-display text-5xl font-semibold tabular-nums tracking-tight text-foreground md:text-6xl">
          {prefix}
          {count}
          <span style={{ color: accent }}>{suffix}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{label}</p>
      </div>
    </FadeIn>
  )
}

export function CinematicStats() {
  return (
    <section id="architecture" className="relative py-28 md:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <span className="mb-4 block font-mono text-xs uppercase tracking-[0.2em] text-accent">
          {'// 001 — The System'}
        </span>
        <RevealText
          as="h2"
          className="mb-6 max-w-3xl font-display text-4xl font-semibold tracking-tight text-foreground md:text-6xl text-balance"
        >
          22 services. 48 modules. One command.
        </RevealText>
        <RevealText
          as="p"
          split="words"
          className="mb-16 max-w-xl leading-relaxed text-foreground-muted"
        >
          The most over-engineered portfolio on earth — by design. Every component
          justified, every millisecond measured.
        </RevealText>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <StatBlock key={stat.label} {...stat} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

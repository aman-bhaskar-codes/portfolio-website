'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'

function useCountUp(target: number, duration = 1500, decimals = 0) {
  const [count, setCount] = useState(0)
  const startedRef        = useRef(false)

  const start = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setCount(parseFloat((eased * target).toFixed(decimals)))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [target, duration, decimals])

  return { count, start }
}

const STATS = [
  { value: 4,   suffix: '+',  label: 'Architecture versions',  sub: 'of the Digital Twin OS',  decimals: 0, prefix: '' },
  { value: 53,  suffix: '',   label: 'Spec sections designed', sub: 'over 4 iterations',        decimals: 0, prefix: '' },
  { value: 22,  suffix: '',   label: 'Docker services',        sub: 'in production stack',      decimals: 0, prefix: '' },
  { value: 48,  suffix: '',   label: 'Python backend modules', sub: 'FastAPI + LangGraph',      decimals: 0, prefix: '' },
  { value: 0,   suffix: '',   label: 'Monthly cloud AI cost',  sub: '100% local via Ollama',    decimals: 0, prefix: '$' },
  { value: 140, suffix: 'ms', label: 'RAG pipeline latency',   sub: 'HyDE → Dense → ColBERT',  decimals: 0, prefix: '' },
]

type StatType = typeof STATS[0]

function StatItem({ stat }: { stat: StatType }) {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-5%' })
  const { count, start } = useCountUp(stat.value, 1400, stat.decimals)

  useEffect(() => {
    if (inView) {
      start()
    }
  }, [inView, start])

  return (
    <div
      ref={ref}
      className="p-6 md:p-8 border-r border-b border-[var(--border)] last:border-r-0
        hover:bg-surface transition-colors duration-300"
    >
      <div className="font-display text-[clamp(36px,5vw,72px)] leading-none
        tracking-tight text-text1 mb-3" style={{ fontWeight: 900 }}>
        {stat.prefix}{count}{stat.suffix}
      </div>
      <div className="font-mono text-[12px] text-text2 mb-1">{stat.label}</div>
      <div className="font-mono text-[10px] text-text3">{stat.sub}</div>
    </div>
  )
}

export function StatsSection() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })

  return (
    <section ref={ref} className="py-[clamp(80px,12vw,160px)] max-w-[1400px] mx-auto px-6 md:px-10">
      <div className="h-rule mb-12" />
      <span className="label text-text3 block mb-10">By the numbers</span>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-3 border-t border-l border-[var(--border)]"
      >
        {STATS.map((stat, i) => (
          <StatItem key={i} stat={stat} />
        ))}
      </motion.div>

      {/* Quote */}
      <motion.blockquote
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-16 max-w-3xl"
      >
        <p className="font-display text-2xl md:text-3xl text-text1 leading-snug
          tracking-tight mb-4" style={{ fontWeight: 800 }}>
          &ldquo;Not a portfolio. Not a chatbot. Not a demo.{' '}
          <span className="text-accent">A living intelligence</span> that advocates
          for its owner 24 hours a day, 7 days a week, to every visitor on earth.&rdquo;
        </p>
        <cite className="font-mono text-[11px] text-text3 not-italic">
          — AMAN BHASKAR, README.md
        </cite>
      </motion.blockquote>
    </section>
  )
}

'use client'

import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'

const TIMELINE = [
  {
    year: '2005',
    event: 'Born into it.',
    detail: 'January 18. Baraut, Uttar Pradesh, India.',
  },
  {
    year: '2020',
    event: 'First line of code.',
    detail: 'Python. Fell in love with the idea that logic can create anything.',
  },
  {
    year: '2022',
    event: 'Full-stack obsession.',
    detail: 'React, Node, databases. Building anything that would run.',
  },
  {
    year: '2023',
    event: 'AI goes local.',
    detail: 'Discovered Ollama, LangChain. Realized cloud AI is a tax. Started building locally.',
  },
  {
    year: '2024',
    event: 'Agentic systems.',
    detail: 'LangGraph. Multi-agent. RAG pipelines. This is where intelligence lives.',
  },
  {
    year: '2025',
    event: 'Digital Twin v4.',
    detail: '53 spec sections. 22 Docker services. $0 cloud bill. 4 architecture versions. Shipped.',
  },
]

export function AboutStory() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const xShift = useTransform(scrollYProgress, [0, 1], [0, -60])

  return (
    <section id="story" ref={ref} className="py-[var(--section)] overflow-hidden">

      {/* Large section header — bleeds off screen like Textura */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 mb-16 md:mb-24">
        <div className="h-rule mb-12" />
        <div className="flex items-start gap-8">
          <span className="label text-text3 mt-2 hidden md:block">/ Story</span>
          <div className="flex-1">
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6 }}
              className="font-mono text-[11px] text-text3 tracking-wider uppercase mb-6"
            >
              Who I am
            </motion.p>
            <motion.h2
              style={{ x: xShift }}
              className="section-title leading-[0.9] text-text1"
            >
              I'm 21.{' '}
              <span className="text-accent">I build</span>{' '}
              <br className="hidden md:block" />
              intelligence.
              <span className="text-text3"> Not websites.</span>
            </motion.h2>
          </div>
        </div>
      </div>

      {/* Story body */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="body-text mb-5">
            Most portfolios are graveyards. A list of projects nobody reads.
            A contact form nobody fills.
          </p>
          <p className="body-text mb-5">
            I built something different. A <em className="text-text1 not-italic font-400">
            living intelligence</em> that advocates for me 24 hours a day —
            classifying every visitor's intent before they speak, answering in
            my voice, and getting measurably smarter every Sunday night via
            DSPy self-optimization.
          </p>
          <p className="body-text">
            Not a demo. Not a chatbot. A Digital Twin OS — built on 4 versions
            of architectural thinking, 53 spec sections, and the firm belief
            that intelligence should cost $0 to run.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <div className="p-6 border border-[var(--border)] bg-surface">
            <div className="font-mono text-[10px] text-cyan tracking-wider uppercase mb-3">
              Current Status
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ai-pulse" />
              <span className="font-mono text-[13px] text-text1">
                Open to elite opportunities — remote, global
              </span>
            </div>
          </div>

          <div className="p-6 border border-[var(--border)] bg-surface">
            <div className="font-mono text-[10px] text-text3 tracking-wider uppercase mb-3">
              Core Belief
            </div>
            <blockquote className="font-display text-base font-700 text-text1 leading-snug">
              "Intelligence should be local, owned, and free from cloud tax."
            </blockquote>
          </div>

          <div className="p-6 border border-[var(--border)] bg-surface">
            <div className="font-mono text-[10px] text-text3 tracking-wider uppercase mb-3">
              Stack Philosophy
            </div>
            <p className="font-mono text-[12px] text-text2 leading-relaxed">
              Ollama for LLMs → Qdrant for vectors → LangGraph for orchestration →
              FastAPI for APIs → Next.js for the face → Docker for everything else.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Timeline */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="h-rule mb-12" />
        <p className="label text-text3 mb-10">Timeline</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-[var(--border)]">
          {TIMELINE.map((item, i) => (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.07 }}
              className="bg-surface p-6 group hover:bg-[#111] transition-colors duration-300"
            >
              <div className="font-mono text-[11px] text-accent mb-3">{item.year}</div>
              <div className="font-display text-sm font-700 text-text1 mb-2 leading-tight">
                {item.event}
              </div>
              <p className="font-body text-[12px] text-text3 leading-relaxed
                opacity-0 group-hover:opacity-100 max-h-0 group-hover:max-h-20
                overflow-hidden transition-all duration-300">
                {item.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

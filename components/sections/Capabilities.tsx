'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const CAPABILITIES = [
  {
    id: 'digital-twin',
    number: '01',
    title: 'Digital Twin Engine',
    short: 'Speaks in my voice. Knows my code.',
    description:
      'The final node in every LangGraph response. Adapts voice, framing, and vocabulary per visitor persona — recruiter sees impact metrics, engineer sees architecture tradeoffs. No chatbot language. No sycophancy. Pure Aman.',
    tags: ['LLM', 'Persona Injection', 'phi4-mini', 'Voice Engine'],
    accentColor: 'var(--accent)',
  },
  {
    id: 'rag',
    number: '02',
    title: '5-Stage RAG Pipeline',
    short: 'HyDE → Dense → Sparse → RRF → ColBERT.',
    description:
      'Standard chatbots grep. This pipeline finds the exact 5 chunks that answer your question. HyDE generates a hypothetical answer first. Dense + sparse retrieval in parallel. RRF fusion. ColBERT token-level reranking. Total: ~140ms.',
    tags: ['HyDE', 'Qdrant', 'BM25', 'ColBERT', 'RRF'],
    accentColor: 'var(--cyan)',
  },
  {
    id: 'visitor-intel',
    number: '03',
    title: 'Visitor Intelligence',
    short: 'Knows who you are before you speak.',
    description:
      'Referrer domain, IP company resolution, UTM source, scroll behavior — all weighted and fused into a persona within 1ms. Recruiter from Greenhouse? Your experience is different from an engineer from GitHub. Completely different.',
    tags: ['Persona Classifier', 'MaxMind', 'Signal Weighting', 'Context Injection'],
    accentColor: 'var(--accent)',
  },
  {
    id: 'memory',
    number: '04',
    title: '3-Tier Memory System',
    short: 'Remembers you. Gets smarter every visit.',
    description:
      'Redis working memory (2hr TTL). PostgreSQL episodic memory (permanent, per user). Qdrant semantic long-term memory (returning visitors). 10,000 concurrent sessions. Memory that merges anonymous → authenticated seamlessly.',
    tags: ['Redis Stack', 'pgvector', 'Qdrant', '10k concurrent'],
    accentColor: 'var(--cyan)',
  },
  {
    id: 'self-optimize',
    number: '05',
    title: 'Self-Optimization (DSPy)',
    short: 'Gets measurably better every Sunday.',
    description:
      'DSPy MIPROv2 runs every Sunday night. Real conversation data. Real engagement metrics. Prompts that don\'t convert get automatically rewritten. Zero human intervention. This portfolio improves in its sleep.',
    tags: ['DSPy', 'MIPROv2', 'RAGAS', 'LangFuse', 'Auto-eval'],
    accentColor: 'var(--accent)',
  },
  {
    id: 'voice',
    number: '06',
    title: 'Voice Agent',
    short: 'Talk to me. Literally.',
    description:
      'WebSocket voice sessions. Speech-to-text → local LLM routing → text-to-speech. The same Digital Twin Engine, same persona adaptation. 100% local. Whisper for STT. Custom TTS pipeline. No API keys.',
    tags: ['Whisper STT', 'WebSocket', 'TTS', 'llama3.2:3b'],
    accentColor: 'var(--cyan)',
  },
]

export function Capabilities() {
  const ref       = useRef<HTMLDivElement>(null)
  const inView    = useInView(ref, { once: true, margin: '-10%' })
  const [active, setActive] = useState<string | null>(null)

  return (
    <section id="capabilities" ref={ref}
      className="py-[var(--section)] bg-surface"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">

        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 md:mb-24">
          <div>
            <span className="label text-text3 block mb-4">/ Capabilities</span>
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="section-title"
            >
              What this<br />
              <span className="text-accent">intelligence</span>
              <br />can do
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="body-text self-end max-w-[400px]"
          >
            Six systems working in parallel. Each one production-grade,
            each one running locally. Together: a portfolio that outperforms
            every static page on Earth.
          </motion.p>
        </div>

        {/* Capability rows */}
        <div className="divide-y divide-[var(--border)]">
          {CAPABILITIES.map((cap, i) => (
            <motion.div
              key={cap.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.07 }}
              className="group"
            >
              <button
                className="w-full text-left py-6 md:py-8 flex items-start gap-6
                  hover:pl-3 transition-all duration-300"
                onClick={() => setActive(active === cap.id ? null : cap.id)}
              >
                <span className="font-mono text-[11px] text-text3 mt-1 min-w-[28px]">
                  {cap.number}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl md:text-2xl font-800 text-text1
                      group-hover:text-accent transition-colors duration-300 leading-tight">
                      {cap.title}
                    </h3>
                    <span className="font-mono text-[10px] text-text3
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      hidden md:block">
                      {cap.short}
                    </span>
                    <span className="font-mono text-text3 text-lg ml-4 transition-transform duration-300
                      group-hover:text-accent"
                      style={{ transform: active === cap.id ? 'rotate(45deg)' : 'rotate(0)' }}
                    >
                      +
                    </span>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {active === cap.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pb-8 pl-[46px] grid grid-cols-1 md:grid-cols-2 gap-8">
                      <p className="body-text">{cap.description}</p>
                      <div className="flex flex-wrap gap-2 content-start">
                        {cap.tags.map((tag) => (
                          <span key={tag}
                            className="tag-pill"
                            style={{
                              borderColor: `${cap.accentColor}33`,
                              color: cap.accentColor,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

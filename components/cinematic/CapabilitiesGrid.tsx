'use client'

import { motion } from 'framer-motion'
import { Brain, Network, Workflow, Database, Gauge, GitBranch } from 'lucide-react'
import { RevealText } from './RevealText'

const CAPABILITIES = [
  {
    icon: Brain,
    title: 'Agentic Architectures',
    description: 'LangGraph state machines, multi-agent swarms, planner-executor loops, and tool-calling orchestration that actually ships.',
    tools: ['LangGraph', 'Swarms', 'ReAct'],
  },
  {
    icon: Network,
    title: 'Retrieval Engineering',
    description: 'Five-stage RAG: HyDE expansion, hybrid dense + sparse search, RRF fusion, and ColBERT late-interaction reranking.',
    tools: ['Qdrant', 'ColBERT', 'BM25'],
  },
  {
    icon: Workflow,
    title: 'Self-Optimizing Systems',
    description: 'DSPy MIPROv2 pipelines that rewrite their own prompts weekly using real conversation data. Zero human intervention.',
    tools: ['DSPy', 'MIPROv2', 'Evals'],
  },
  {
    icon: Database,
    title: 'Local-First AI Infra',
    description: 'Ollama-served models, on-device embeddings, and a 22-service Docker topology that runs on zero monthly cloud cost.',
    tools: ['Ollama', 'Docker', 'Redis'],
  },
  {
    icon: Gauge,
    title: 'Latency Obsession',
    description: 'Sub-200ms time-to-first-token through streaming pipelines, warm model pools, and ruthless profiling.',
    tools: ['Streaming', 'Profiling', 'Caching'],
  },
  {
    icon: GitBranch,
    title: 'Full-Stack Delivery',
    description: 'Next.js, TypeScript, FastAPI, Prisma, CI/CD — the entire path from research notebook to production endpoint.',
    tools: ['Next.js', 'FastAPI', 'Prisma'],
  },
]

export function CapabilitiesGrid() {
  return (
    <section id="capabilities" className="relative py-28 md:py-36">
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-60" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <span className="mb-4 block font-mono text-xs uppercase tracking-[0.2em] text-accent">
          {'// 003 — Capabilities'}
        </span>
        <RevealText
          as="h2"
          className="mb-16 max-w-3xl font-display text-4xl font-semibold tracking-tight text-foreground md:text-6xl text-balance"
        >
          What I bring to the table.
        </RevealText>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: (i % 3) * 0.1 }}
              className="group relative bg-surface p-8 transition-colors duration-300 hover:bg-elevated"
            >
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-border-subtle bg-overlay text-accent transition-all duration-300 group-hover:border-accent/40 group-hover:shadow-[0_0_24px_var(--accent-glow)]">
                <cap.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mb-3 font-display text-xl font-semibold tracking-tight text-foreground">
                {cap.title}
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-foreground-muted">{cap.description}</p>
              <div className="flex flex-wrap gap-2">
                {cap.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full bg-overlay px-2.5 py-0.5 font-mono text-[0.65rem] tracking-wide text-foreground-faint"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

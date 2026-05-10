'use client'

const TIMELINE = [
  {
    period: '2024–present',
    title: 'Agentic AI Developer',
    desc: 'Building RAG systems, LLM pipelines, and autonomous AI infrastructure. Self-directed engineering in Python and TypeScript.',
    color: '#6366F1',
  },
  {
    period: '2024',
    title: 'RAG Research Assistant',
    desc: 'Built production-grade hybrid RAG system: FastAPI + pgvector + Redis + HyDE + cross-encoder reranking. Deployed on Google Cloud Run.',
    color: '#10B981',
  },
  {
    period: '2024',
    title: 'LLM Engineering Lab',
    desc: 'Structured extraction engine: multi-tier LLM routing (Simple/Advanced/Reasoning), SSE streaming, Tesseract OCR, ARQ workers.',
    color: '#6366F1',
  },
  {
    period: '2023–2024',
    title: 'SQL & Database Engineering',
    desc: 'PL/pgSQL database systems, university data models, analytics at scale. Solid relational foundation before AI work.',
    color: '#10B981',
  },
  {
    period: '2023',
    title: 'Game Development',
    desc: 'Built TMNT beat-em-up in Godot (GDScript). First serious programming project — learned systems thinking through game logic.',
    color: '#6366F1',
  },
]

export default function About() {
  return (
    <section id="about" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <div className="text-accent-primary font-mono text-sm mb-4">01. about</div>
            <h2
              className="text-4xl font-bold mb-6 text-text-primary"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Building AI systems
              <br />
              <span className="text-text-secondary">that actually work.</span>
            </h2>
            <div className="space-y-4 text-text-secondary leading-relaxed">
              <p>
                I&apos;m <span className="text-text-primary font-medium">Aman Bhaskar</span>, a self-taught agentic AI developer
                from Bijnor, Uttar Pradesh, India. I&apos;m 20 years old and I&apos;ve been obsessed with building
                AI systems that do real things — not toy demos.
              </p>
              <p>
                My focus is on the full AI stack: <span className="text-text-primary">RAG pipelines</span> that retrieve
                precisely, <span className="text-text-primary">LLM orchestration</span> that handles concurrency,
                and <span className="text-text-primary">production backends</span> that don&apos;t collapse under load.
              </p>
              <p>
                I build everything locally first — Ollama, local models, zero cloud spend during development.
                Then I deploy lean: Neon Serverless Postgres, Google Cloud Run, Docker.
                The philosophy is <em className="text-text-primary">production-grade from day one, cost-free until you need scale.</em>
              </p>
              <p>
                This portfolio itself is an agentic AI system. The chat below uses a RAG pipeline built from
                my GitHub repos and knowledge base. It knows my projects better than a static page ever could.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { key: 'location', val: 'Bijnor, UP, India' },
                { key: 'age', val: '20 (Jan 18, 2005)' },
                { key: 'focus', val: 'Agentic AI Systems' },
                { key: 'open to', val: 'Remote opportunities' },
              ].map(item => (
                <div key={item.key} className="flex gap-2">
                  <span className="font-mono text-xs text-accent-primary">{item.key}:</span>
                  <span className="font-mono text-xs text-text-secondary">{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-sm font-mono text-text-muted mb-2">{'// career timeline'}</div>
            {TIMELINE.map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: item.color }}
                  />
                  {i < TIMELINE.length - 1 && <div className="w-0.5 flex-1 bg-bg-border mt-1" />}
                </div>
                <div className="pb-4">
                  <div className="font-mono text-xs text-text-muted mb-1">{item.period}</div>
                  <div className="text-sm font-medium text-text-primary mb-1">{item.title}</div>
                  <div className="text-xs text-text-secondary leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

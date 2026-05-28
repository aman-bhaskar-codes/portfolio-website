'use client'

import { motion } from 'framer-motion'

const ITEMS = [
  { text: 'Next.js 14',      type: 'tech' },
  { text: 'FastAPI',         type: 'tech' },
  { text: 'LangGraph',       type: 'ai'   },
  { text: 'Qdrant',          type: 'data' },
  { text: 'Ollama',          type: 'ai'   },
  { text: 'Three.js',        type: 'viz'  },
  { text: 'PostgreSQL',      type: 'data' },
  { text: 'Docker',          type: 'infra'},
  { text: 'Redis Stack',     type: 'data' },
  { text: 'ColBERT',         type: 'ai'   },
  { text: 'DSPy MIPROv2',    type: 'ai'   },
  { text: 'Prometheus',      type: 'infra'},
  { text: 'TypeScript',      type: 'tech' },
  { text: 'Framer Motion',   type: 'viz'  },
  { text: 'Tailwind CSS',    type: 'tech' },
  { text: 'Temporal',        type: 'infra'},
  { text: 'pgvector',        type: 'data' },
  { text: 'LangFuse',        type: 'ai'   },
]

const COLOR_MAP: Record<string, string> = {
  tech:  'text-text2',
  ai:    'text-accent',
  data:  'text-cyan',
  viz:   'text-text2',
  infra: 'text-text3',
}

const SEPARATOR = '◆'

function MarqueeRow({ items, reverse = false }: { items: typeof ITEMS, reverse?: boolean }) {
  const doubled = [...items, ...items]
  return (
    <div className="overflow-hidden py-3 border-y border-[var(--border)]">
      <div
        className="marquee-track"
        style={{ animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-4 px-4">
            <span className={`font-mono text-[12px] tracking-[0.08em] uppercase ${COLOR_MAP[item.type]}`}>
              {item.text}
            </span>
            <span className="text-text3 text-[8px]">{SEPARATOR}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function MarqueeStrip() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className="my-4"
    >
      <MarqueeRow items={ITEMS} />
      <MarqueeRow items={[...ITEMS].reverse()} reverse />
    </motion.div>
  )
}

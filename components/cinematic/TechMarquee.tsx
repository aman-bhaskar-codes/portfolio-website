'use client'

const ROW_A = ['LangGraph', 'RAG Pipelines', 'DSPy', 'Multi-Agent Systems', 'ColBERT', 'Qdrant', 'Next.js', 'TypeScript']
const ROW_B = ['Ollama', 'Prompt Optimization', 'Vector Search', 'Persona ML', 'FastAPI', 'Docker', 'PostgreSQL', 'Redis']

function MarqueeRow({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const doubled = [...items, ...items]
  return (
    <div className="flex overflow-hidden">
      <div
        className={`flex w-max shrink-0 items-center gap-0 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="whitespace-nowrap px-6 font-display text-2xl font-medium tracking-tight text-foreground-faint transition-colors hover:text-foreground md:text-4xl">
              {item}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-accent/50" aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  )
}

export function TechMarquee() {
  return (
    <section
      aria-label="Technologies"
      className="relative border-y border-border-subtle bg-surface/40 py-8 md:py-10"
    >
      <div className="flex flex-col gap-6">
        <MarqueeRow items={ROW_A} />
        <MarqueeRow items={ROW_B} reverse />
      </div>
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--bg-void)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--bg-void)] to-transparent" />
    </section>
  )
}

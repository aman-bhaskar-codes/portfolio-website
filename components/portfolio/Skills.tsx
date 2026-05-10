'use client'

const SKILLS = [
  {
    category: 'AI / LLM Engineering',
    color: '#6366F1',
    items: [
      { name: 'RAG Pipelines', level: 90 },
      { name: 'Ollama (Local LLMs)', level: 88 },
      { name: 'Hybrid Retrieval (BM25+Vector)', level: 85 },
      { name: 'LangChain / LangGraph', level: 80 },
      { name: 'HyDE Query Expansion', level: 82 },
      { name: 'Cross-encoder Reranking', level: 78 },
      { name: 'Gemini API', level: 75 },
      { name: 'Pydantic Schema Validation', level: 88 },
    ],
  },
  {
    category: 'Backend & APIs',
    color: '#10B981',
    items: [
      { name: 'FastAPI + Uvicorn', level: 88 },
      { name: 'Python (async/await)', level: 85 },
      { name: 'SSE Streaming', level: 85 },
      { name: 'ARQ Background Workers', level: 75 },
      { name: 'Docker + Compose', level: 80 },
      { name: 'Google Cloud Run', level: 75 },
      { name: 'REST API Design', level: 82 },
      { name: 'JWT Auth', level: 78 },
    ],
  },
  {
    category: 'Databases & Storage',
    color: '#F59E0B',
    items: [
      { name: 'PostgreSQL + pgvector', level: 88 },
      { name: 'Neon Serverless Postgres', level: 82 },
      { name: 'Redis / Upstash Redis', level: 80 },
      { name: 'PL/pgSQL', level: 85 },
      { name: 'SQLAlchemy + Alembic', level: 78 },
      { name: 'Qdrant Vector DB', level: 72 },
      { name: 'Database Schema Design', level: 84 },
      { name: 'Query Optimization', level: 76 },
    ],
  },
  {
    category: 'Frontend',
    color: '#8B5CF6',
    items: [
      { name: 'Next.js 14/15', level: 82 },
      { name: 'TypeScript', level: 85 },
      { name: 'React + Zustand', level: 80 },
      { name: 'Tailwind CSS', level: 85 },
      { name: 'SSE Client (ReadableStream)', level: 82 },
      { name: 'Framer Motion', level: 72 },
      { name: 'React Markdown', level: 78 },
      { name: 'Three.js (basics)', level: 55 },
    ],
  },
]

export default function Skills() {
  return (
    <section id="skills" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <div className="text-accent-primary font-mono text-sm mb-4">03. skills</div>
          <h2
            className="text-4xl font-bold text-text-primary"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            What I work with.
          </h2>
          <p className="text-text-secondary mt-3 max-w-xl">
            Skills rated by actual production use, not tutorials. Everything here has been shipped.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SKILLS.map(category => (
            <div key={category.category} className="p-6 bg-bg-card rounded-xl border border-bg-border">
              <h3 className="font-mono text-sm font-medium mb-6" style={{ color: category.color }}>
                {category.category}
              </h3>
              <div className="space-y-3.5">
                {category.items.map(skill => (
                  <div key={skill.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-text-secondary">{skill.name}</span>
                      <span className="text-xs font-mono text-text-muted">{skill.level}%</span>
                    </div>
                    <div className="h-1 bg-bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${skill.level}%`,
                          background: `linear-gradient(90deg, ${category.color}88, ${category.color})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-bg-card rounded-xl border border-bg-border">
          <div className="font-mono text-xs text-text-muted mb-4">{'// also familiar with'}</div>
          <div className="flex flex-wrap gap-2">
            {[
              'GDScript', 'Godot Engine', 'Alembic', 'Tesseract OCR', 'Docling',
              'PyPDF', 'sentence-transformers', 'FastEmbed', 'Prometheus', 'uv',
              'ruff', 'GitHub Actions', 'HCL/Terraform', 'Google Artifact Registry',
            ].map(tech => (
              <span key={tech} className="px-2.5 py-1 text-xs font-mono bg-bg-border/50 text-text-muted rounded border border-bg-border/50">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

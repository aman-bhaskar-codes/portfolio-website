'use client'
import { useState } from 'react'

const SKILLS = {
  'AI/ML': { color: '#7c6df0', skills: ['LangGraph', 'RAG Pipeline', 'ColBERT', 'DSPy', 'Ollama', 'LangFuse'] },
  'Backend': { color: '#f59e0b', skills: ['FastAPI', 'PostgreSQL', 'Redis', 'Celery', 'Qdrant', 'pgvector'] },
  'Frontend': { color: '#06b6d4', skills: ['Next.js 14', 'React', 'Three.js', 'TypeScript', 'Tailwind'] },
  'DevOps': { color: '#22c55e', skills: ['Docker', 'Nginx', 'Cloudflare', 'Prometheus', 'Grafana'] },
}

export function SkillsConstellation() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  return (
    <section id="skills" style={{ padding: '100px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Section header */}
        <div style={{ marginBottom: 64 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.12em',
            color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: 12,
            display: 'block',
          }}>
            // 003 — Skills
          </span>
          <h2 style={{
            fontFamily: 'var(--font-clash)', fontWeight: 600,
            fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.025em',
            color: 'var(--text-primary)', marginBottom: 16,
          }}>
            The Stack Behind the Twin
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 480 }}>
            Every technology chosen deliberately. Every service justified. 100% local AI, zero cloud dependency.
          </p>
        </div>

        {/* Category grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
        }}>
          {Object.entries(SKILLS).map(([category, { color, skills }]) => (
            <div
              key={category}
              onMouseEnter={() => setActiveCategory(category)}
              onMouseLeave={() => setActiveCategory(null)}
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-xl)',
                border: `1px solid ${activeCategory === category ? `${color}44` : 'rgba(255,255,255,0.06)'}`,
                background: activeCategory === category ? `${color}08` : 'var(--bg-surface)',
                transition: 'border-color 0.2s, background 0.2s',
                cursor: 'default',
              }}
            >
              {/* Category header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                <span style={{
                  fontFamily: 'var(--font-clash)', fontWeight: 600,
                  fontSize: '0.9rem', color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}>
                  {category}
                </span>
              </div>

              {/* Skill chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {skills.map(skill => (
                  <span key={skill} style={{
                    padding: '5px 12px', borderRadius: 'var(--radius-full)',
                    background: activeCategory === category ? `${color}15` : 'var(--bg-overlay)',
                    border: `1px solid ${activeCategory === category ? `${color}33` : 'rgba(255,255,255,0.06)'}`,
                    fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                    color: activeCategory === category ? color : 'var(--text-secondary)',
                    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

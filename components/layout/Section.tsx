import { ReactNode } from 'react'

interface SectionProps {
  id?: string
  eyebrow?: string
  title: string
  subtitle?: string
  children: ReactNode
  accent?: boolean
}

export function Section({ id, eyebrow, title, subtitle, children, accent }: SectionProps) {
  return (
    <section
      id={id}
      style={{
        padding: '100px 0',
        position: 'relative',
        background: accent ? 'var(--bg-surface)' : 'transparent',
      }}
    >
      {accent && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(0deg, transparent, rgba(124,109,240,0.02), transparent)',
        }} />
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* Section header */}
        <div style={{ marginBottom: 64 }}>
          {eyebrow && (
            <span style={{
              display: 'block', marginBottom: 12,
              fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--accent-primary)',
            }}>
              {eyebrow}
            </span>
          )}
          <h2 style={{
            fontFamily: 'var(--font-clash)', fontWeight: 600,
            fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.025em',
            color: 'var(--text-primary)', marginBottom: subtitle ? 16 : 0,
          }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ color: 'var(--text-secondary)', maxWidth: 520, lineHeight: 1.7 }}>
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </section>
  )
}

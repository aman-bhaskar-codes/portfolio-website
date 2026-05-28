'use client';
import { projects } from '@/data/projects';

export default function Projects() {
  return (
    <section style={{ padding: '8rem 3rem' }} id="projects">
      <p style={{
        fontSize: '0.72rem', fontWeight: 600,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.28)', marginBottom: '3rem',
      }}>
        Featured Projects
      </p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1px',
        background: 'rgba(255,255,255,0.06)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        {projects.map((p) => (
          <a key={p.id} href={p.href} target="_blank" rel="noreferrer" className="project-card" style={{
            display: 'block',
            textDecoration: 'none',
            color: 'white',
          }}>
            <div style={{
              fontSize: '0.7rem', letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)',
              marginBottom: '1rem',
            }}>
              {p.id} — {p.tag}
            </div>
            <h3 style={{
              fontFamily: "var(--font-display-alt), 'Bebas Neue', sans-serif",
              fontSize: '2.6rem',
              lineHeight: 1,
              letterSpacing: '0.02em',
              marginBottom: '1.2rem',
            }}>
              {p.title}
            </h3>
            <p style={{
              fontSize: '0.87rem', color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.6, marginBottom: '2rem'
            }}>
              {p.desc}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {p.stack.map(s => (
                <span key={s} style={{
                  fontSize: '0.7rem', color: 'rgba(255,255,255,0.28)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.2rem 0.6rem', borderRadius: '100px'
                }}>
                  {s}
                </span>
              ))}
            </div>
            <div className="project-arrow">
              ↗
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

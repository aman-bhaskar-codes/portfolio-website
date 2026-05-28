'use client';

const SKILLS = [
  {
    title: 'Frontend',
    items: ['Next.js 14 / App Router', 'TypeScript', 'Three.js / WebGL', 'Tailwind CSS', 'Framer Motion / GSAP'],
  },
  {
    title: 'Backend / AI',
    items: ['FastAPI / 8 uvicorn workers', 'LangGraph / Multi-agent', 'Ollama / 100% local LLMs', 'DSPy / Self-optimization', 'Python / Node.js'],
  },
  {
    title: 'Infrastructure',
    items: ['PostgreSQL / pgvector', 'Redis Stack', 'Qdrant Vector DB', 'Docker / 22 services', 'Cloudflare / Nginx'],
  },
];

export default function Skills() {
  return (
    <section style={{ padding: '0 3rem 8rem' }} id="skills">
      {/* Header */}
      <div style={{ marginBottom: '3.5rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: '1.5rem' }}>
          What I use
        </p>
        <h2 style={{
          fontFamily: "var(--font-display-alt), 'Bebas Neue', sans-serif",
          fontSize: 'clamp(4.5rem, 8vw, 8.5rem)', lineHeight: 0.88,
        }}>
          Tech<br />Stack
        </h2>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1px',
        background: 'rgba(255,255,255,0.06)',
      }}>
        {SKILLS.map(({ title, items }) => (
          <div key={title} style={{
            background: 'var(--black, #000)',
            padding: '2.8rem 2.4rem',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              fontFamily: "var(--font-display-alt), 'Bebas Neue', sans-serif",
              fontSize: '2.4rem',
              letterSpacing: '0.04em',
              marginBottom: '1.8rem',
            }}>
              {title}
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {items.map((item) => (
                <li key={item} style={{
                  fontSize: '0.87rem',
                  color: 'rgba(255,255,255,0.42)',
                  padding: '0.65rem 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  letterSpacing: '0.04em',
                  transition: 'color 0.25s ease, padding-left 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.88)';
                  (e.currentTarget as HTMLElement).style.paddingLeft = '0.5rem';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.42)';
                  (e.currentTarget as HTMLElement).style.paddingLeft = '0';
                }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

'use client';

export default function Footer() {
  return (
    <footer style={{
      padding: '2rem var(--gutter)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      fontSize: '0.78rem',
      color: 'rgba(255,255,255,0.4)',
      letterSpacing: '0.04em'
    }}>
      <div>AMAN BHASKAR — Full-Stack Developer & AI Engineer</div>
      <a 
        href="https://github.com/aman-bhaskar-codes/portfolio-website" 
        target="_blank" 
        rel="noreferrer"
        style={{
          color: 'rgba(255,255,255,0.6)',
          textDecoration: 'none',
          transition: 'color 0.25s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
      >
        Source Code
      </a>
    </footer>
  );
}

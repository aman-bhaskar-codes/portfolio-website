'use client'
import { useEffect, useRef } from 'react'

export function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Particle constellation background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Stars
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      opacity: Math.random() * 0.5 + 0.2,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach(s => {
        s.x += s.vx; s.y += s.vy
        if (s.x < 0) s.x = canvas.width
        if (s.x > canvas.width) s.x = 0
        if (s.y < 0) s.y = canvas.height
        if (s.y > canvas.height) s.y = 0

        // Draw connection lines for nearby stars
        stars.forEach(s2 => {
          const d = Math.hypot(s.x - s2.x, s.y - s2.y)
          if (d < 120) {
            ctx.beginPath()
            ctx.moveTo(s.x, s.y)
            ctx.lineTo(s2.x, s2.y)
            ctx.strokeStyle = `rgba(124, 109, 240, ${(1 - d / 120) * 0.08})`
            ctx.stroke()
          }
        })

        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(240, 240, 245, ${s.opacity})`
        ctx.fill()
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <section style={{
      position: 'relative', minHeight: '100vh',
      display: 'flex', alignItems: 'center',
      overflow: 'hidden',
    }}>
      {/* Canvas background */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0, zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* Radial gradient spotlight */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(124,109,240,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 200, zIndex: 2,
        background: 'linear-gradient(to bottom, transparent, var(--bg-void))',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 3,
        maxWidth: 1200, margin: '0 auto',
        padding: '120px 24px 80px',
        width: '100%',
      }}>
        {/* Eyebrow label */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          marginBottom: 32,
          animation: 'fadeInUp 0.6s var(--ease-out-expo) both',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Agentic Portfolio OS v4 — Genesis Build
          </span>
        </div>

        {/* Main headline */}
        <h1 style={{
          fontFamily: 'var(--font-clash)',
          fontSize: 'clamp(3rem, 7vw, 6.5rem)',
          fontWeight: 600, lineHeight: 1.0,
          letterSpacing: '-0.035em',
          color: 'var(--text-primary)',
          marginBottom: 24,
          animation: 'fadeInUp 0.7s var(--ease-out-expo) 0.1s both',
        }}>
          Not a portfolio.{' '}
          <br />
          <span style={{
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--amber) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            A living twin.
          </span>
        </h1>

        {/* Sub-headline */}
        <p style={{
          maxWidth: 560, fontSize: '1.2rem', lineHeight: 1.7,
          color: 'var(--text-secondary)',
          marginBottom: 48,
          animation: 'fadeInUp 0.7s var(--ease-out-expo) 0.2s both',
        }}>
          Knows every commit I've made. Detects who's visiting before they speak.
          Adapts its voice in real-time. Gets measurably smarter every Sunday night.
        </p>

        {/* CTAs */}
        <div className="hero-ctas" style={{
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          animation: 'fadeInUp 0.7s var(--ease-out-expo) 0.3s both',
        }}>
          <a href="#chat" style={{
            padding: '14px 32px', borderRadius: 'var(--radius-full)',
            background: 'var(--accent-primary)', color: 'white',
            fontFamily: 'var(--font-instrument)', fontSize: '1rem', fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 0 40px var(--accent-glow)',
            transition: 'transform var(--duration-fast), box-shadow var(--duration-fast)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <span>Talk to Aman's Twin</span>
            <span style={{ fontSize: '1.1rem' }}>→</span>
          </a>

          <a href="#projects" style={{
            padding: '14px 32px', borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-instrument)', fontSize: '1rem', fontWeight: 500,
            textDecoration: 'none',
            transition: 'border-color var(--duration-fast), background var(--duration-fast)',
          }}>
            See Projects
          </a>
        </div>

        {/* Stats row */}
        <div className="hero-stats" style={{
          display: 'flex', gap: 48, marginTop: 80, flexWrap: 'wrap',
          animation: 'fadeInUp 0.7s var(--ease-out-expo) 0.4s both',
        }}>
          {[
            { value: '22', label: 'Docker Services', unit: '' },
            { value: '5', label: 'RAG Pipeline Stages', unit: '' },
            { value: '100%', label: 'Local AI', unit: '' },
            { value: '0', label: 'Monthly Cloud Cost', unit: '$' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontFamily: 'var(--font-clash)', fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                {stat.unit}{stat.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}

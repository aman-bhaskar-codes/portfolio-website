'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const NAV_ITEMS = [
  { label: 'Projects', href: '#projects' },
  { label: 'Skills',   href: '#skills' },
  { label: 'Chat',     href: '#chat' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: scrolled ? '12px 24px' : '20px 24px',
        transition: 'padding var(--duration-base) var(--ease-out-expo), background var(--duration-slow)',
        background: scrolled ? 'rgba(5,5,10,0.72)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
      }}
    >
      <nav style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo / Brand */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Animated logo mark */}
            <div style={{
              width: 32, height: 32, borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--amber))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px var(--accent-glow)',
            }}>
              <span style={{ fontFamily: 'var(--font-clash)', fontWeight: 700, fontSize: 14, color: 'white' }}>AB</span>
            </div>
            <span style={{
              fontFamily: 'var(--font-clash)',
              fontWeight: 600, fontSize: '1rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              aman bhaskar
            </span>
            {/* Live status dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6,
                borderRadius: '50%', background: 'var(--green)',
                boxShadow: '0 0 6px var(--green)',
                animation: 'pulse-dot 2s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--green)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>LIVE</span>
            </div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} className="nav-links">
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} style={{
              padding: '6px 16px', borderRadius: 'var(--radius-full)',
              color: activeSection === item.href ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-instrument)', fontSize: '0.875rem', fontWeight: 500,
              textDecoration: 'none',
              background: activeSection === item.href ? 'var(--bg-overlay)' : 'transparent',
              transition: 'color var(--duration-fast), background var(--duration-fast)',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = activeSection === item.href ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              {item.label}
            </Link>
          ))}

          {/* CTA */}
          <a
            href="#chat"
            style={{
              marginLeft: 8,
              padding: '7px 20px', borderRadius: 'var(--radius-full)',
              background: 'var(--accent-primary)',
              color: 'white', fontFamily: 'var(--font-instrument)',
              fontSize: '0.875rem', fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 0 20px var(--accent-glow)',
              transition: 'transform var(--duration-fast), box-shadow var(--duration-fast)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px var(--accent-glow)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px var(--accent-glow)'
            }}
          >
            Talk to my Twin ↗
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '1.5rem',
            cursor: 'pointer',
          }}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '16px 24px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }} className="nav-mobile-menu">
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{
              color: 'var(--text-primary)', fontFamily: 'var(--font-instrument)',
              fontSize: '1.1rem', textDecoration: 'none',
            }}>
              {item.label}
            </Link>
          ))}
          <a href="#chat" onClick={() => setMenuOpen(false)} style={{
            color: 'var(--accent-primary)', fontFamily: 'var(--font-instrument)',
            fontSize: '1.1rem', fontWeight: 600, textDecoration: 'none',
          }}>
            Talk to my Twin ↗
          </a>
        </div>
      )}

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
      `}</style>
    </header>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Works',        href: '#projects' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Story',        href: '#story' },
  { label: 'Chat',         href: '#chat' },
]

export function Navbar() {
  const [scrolled,   setScrolled]   = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [aiAlive,    setAiAlive]    = useState(true) // ping backend on mount

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Ping AI backend health
  useEffect(() => {
    fetch('/api/health')
      .then(r => setAiAlive(r.ok))
      .catch(() => setAiAlive(false))
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center
          transition-all duration-500
          ${scrolled
            ? 'bg-bg/80 backdrop-blur-md border-b border-[var(--border)]'
            : 'bg-transparent'
          }`}
      >
        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-8 h-8">
              <div className="absolute inset-0 border border-[var(--border)] rounded-sm
                group-hover:border-accent transition-colors duration-300" />
              <span className="font-display text-[11px] font-900 text-text1 tracking-wider">AB</span>
            </div>
            {/* AI alive indicator */}
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${aiAlive ? 'bg-cyan animate-ai-pulse' : 'bg-text3'}`} />
              <span className="font-mono text-[10px] text-text3 hidden md:block">
                {aiAlive ? 'TWIN ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-mono text-[11px] tracking-[0.12em] uppercase text-text3
                  hover:text-text1 transition-colors duration-300 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-accent
                  group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="#chat"
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-bg
                font-mono text-[11px] tracking-[0.1em] uppercase font-500
                hover:bg-accent/90 transition-all duration-200"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-bg animate-ai-pulse" />
              Talk to my Twin
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span className={`block w-6 h-px bg-text1 transition-all duration-300 origin-center
              ${menuOpen ? 'rotate-45 translate-y-[5px]' : ''}`} />
            <span className={`block w-6 h-px bg-text1 transition-all duration-300
              ${menuOpen ? 'opacity-0 -translate-x-2' : ''}`} />
            <span className={`block w-6 h-px bg-text1 transition-all duration-300 origin-center
              ${menuOpen ? '-rotate-45 -translate-y-[5px]' : ''}`} />
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-bg/95 backdrop-blur-lg flex flex-col
              items-center justify-center gap-8 md:hidden"
          >
            {NAV_LINKS.map((link, i) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="font-display text-4xl font-800 text-text1 hover:text-accent
                    transition-colors duration-300"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                href="#chat"
                onClick={() => setMenuOpen(false)}
                className="mt-4 flex items-center gap-2 px-6 py-3 bg-accent text-bg
                  font-mono text-sm tracking-wider"
              >
                Talk to my Twin
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

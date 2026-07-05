'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Magnetic } from './Magnetic'

const NAV_ITEMS = [
  { label: 'System', href: '#architecture' },
  { label: 'Projects', href: '#projects' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Twin', href: '#chat' },
]

export function CinematicNav() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(latest > 40)
    setHidden(latest > 600 && latest > prev && !menuOpen)
  })

  useEffect(() => {
    if (menuOpen) setHidden(false)
  }, [menuOpen])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: hidden ? -100 : 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: menuOpen ? 0 : 0 }}
      className={`fixed inset-x-0 top-0 z-[100] transition-[padding,background-color,backdrop-filter] duration-300 ${
        scrolled
          ? 'bg-void/70 py-3 backdrop-blur-xl border-b border-border-subtle'
          : 'bg-transparent py-5 border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-2.5 no-underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--amber)] shadow-[0_0_20px_var(--accent-glow)] transition-transform group-hover:rotate-12">
            <span className="font-display text-sm font-bold text-white">AB</span>
          </div>
          <span className="font-display text-base font-semibold tracking-tight text-foreground">
            aman bhaskar
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-positive shadow-[0_0_6px_var(--green)]" />
            <span className="font-mono text-[0.65rem] tracking-widest text-positive">LIVE</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <Magnetic strength={0.25} className="ml-2">
            <a
              href="#contact"
              className="inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-[0_0_20px_var(--accent-glow)] transition-shadow hover:shadow-[0_0_32px_var(--accent-glow)]"
            >
              Hire Me
            </a>
          </Magnetic>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle text-foreground md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-b border-border-subtle bg-elevated/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_ITEMS.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg px-3 py-3 text-lg font-medium text-foreground"
                >
                  {item.label}
                </motion.a>
              ))}
              <a
                href="#contact"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-full bg-accent px-5 py-3 text-center font-semibold text-white"
              >
                Hire Me
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

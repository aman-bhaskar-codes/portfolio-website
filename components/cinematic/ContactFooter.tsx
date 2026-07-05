'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, Github, Linkedin, Mail, Twitter } from 'lucide-react'
import { Magnetic } from './Magnetic'
import { RevealText } from './RevealText'

const SOCIALS = [
  { icon: Github, label: 'GitHub', href: 'https://github.com/aman-bhaskar-codes' },
  { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com/in/aman-bhaskar' },
  { icon: Twitter, label: 'Twitter', href: 'https://twitter.com/_aman_bhaskar' },
  { icon: Mail, label: 'Email', href: 'mailto:amanbhaskarcodes@gmail.com' },
]

export function ContactFooter() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end end'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [120, 0])

  return (
    <footer id="contact" ref={ref} className="relative overflow-hidden border-t border-border-subtle bg-surface/40">
      {/* Giant outline word drifting up */}
      <motion.div
        style={{ y }}
        className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 select-none whitespace-nowrap"
        aria-hidden="true"
      >
        <span className="text-stroke font-display text-[18vw] font-bold leading-none">
          AMAN BHASKAR
        </span>
      </motion.div>

      <div className="relative mx-auto max-w-6xl px-6 pb-40 pt-28 md:pb-56 md:pt-36">
        <span className="mb-4 block font-mono text-xs uppercase tracking-[0.2em] text-accent">
          {'// 005 — Contact'}
        </span>
        <RevealText
          as="h2"
          className="mb-8 max-w-4xl font-display text-5xl font-semibold tracking-tight text-foreground md:text-7xl text-balance"
        >
          {"Let's build something agentic."}
        </RevealText>
        <p className="mb-12 max-w-lg leading-relaxed text-foreground-muted text-pretty">
          Open to AI engineering roles, agentic system consulting, and interesting
          collaborations. The twin answers instantly — I answer within 24 hours.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Magnetic>
            <a
              href="mailto:amanbhaskarcodes@gmail.com"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 font-medium text-white shadow-[0_0_40px_var(--accent-glow)] transition-shadow hover:shadow-[0_0_64px_var(--accent-glow)]"
            >
              amanbhaskarcodes@gmail.com
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
          </Magnetic>
          <div className="flex items-center gap-2">
            {SOCIALS.map((social) => (
              <Magnetic key={social.label} strength={0.4}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border-subtle bg-surface text-foreground-muted transition-colors hover:border-accent/40 hover:text-foreground"
                >
                  <social.icon className="h-4.5 w-4.5" aria-hidden="true" />
                </a>
              </Magnetic>
            ))}
          </div>
        </div>

        <div className="mt-24 flex flex-col justify-between gap-4 border-t border-border-subtle pt-8 sm:flex-row sm:items-center">
          <p className="font-mono text-xs text-foreground-faint">
            {'© 2025 Aman Bhaskar · Built with Next.js, local AI, and too much ambition.'}
          </p>
          <p className="flex items-center gap-2 font-mono text-xs text-foreground-faint">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-positive" />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  )
}

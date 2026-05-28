'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'

const SOCIAL_LINKS = [
  { label: 'GitHub',    href: 'https://github.com/aman-bhaskar-codes',           handle: '@aman-bhaskar-codes' },
  { label: 'LinkedIn',  href: 'https://linkedin.com/in/aman-bhaskar-18jan2005/', handle: '/in/aman-bhaskar' },
  { label: 'X (Twitter)', href: 'https://x.com/_aman_bhaskar',                  handle: '@_aman_bhaskar' },
  { label: 'Instagram', href: 'https://instagram.com/mr.aman.bhaskar',           handle: '@mr.aman.bhaskar' },
  { label: 'Email',     href: 'mailto:amanbhaskarcodes@gmail.com',               handle: 'amanbhaskarcodes@gmail.com' },
]

export function ContactSection() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10%' })

  return (
    <section id="contact" ref={ref}
      className="py-[var(--section)] max-w-[1400px] mx-auto px-6 md:px-10"
    >
      <div className="h-rule mb-16" />

      {/* The giant "let's talk" — Textura-style */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-12 overflow-hidden"
      >
        <motion.h2
          initial={{ y: '60%', opacity: 0 }}
          animate={inView ? { y: '0%', opacity: 1 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-900 text-text1 leading-none tracking-tight"
          style={{ fontSize: 'clamp(48px, 12vw, 180px)' }}
        >
          let's
        </motion.h2>
        <motion.h2
          initial={{ y: '60%', opacity: 0 }}
          animate={inView ? { y: '0%', opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-900 leading-none tracking-tight"
          style={{
            fontSize: 'clamp(48px, 12vw, 180px)',
            color: 'transparent',
            WebkitTextStroke: '1px rgba(240,235,224,0.25)',
          }}
        >
          build
        </motion.h2>
        <motion.h2
          initial={{ y: '60%', opacity: 0 }}
          animate={inView ? { y: '0%', opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-900 text-accent leading-none tracking-tight"
          style={{ fontSize: 'clamp(48px, 12vw, 180px)' }}
        >
          something.
        </motion.h2>
      </motion.div>

      {/* CTA buttons + social grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16">
        {/* Primary CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col gap-4"
        >
          <p className="body-text mb-4">
            Open to senior full-stack and AI engineering roles, technical
            co-founder opportunities, and consulting work that needs someone
            who builds production-grade intelligence from scratch.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:amanbhaskarcodes@gmail.com"
              className="flex items-center justify-center gap-2 px-6 py-3.5
                bg-accent text-bg font-mono text-[12px] tracking-[0.1em] uppercase
                hover:bg-white transition-colors duration-200"
            >
              Send an email →
            </a>
            <a
              href="#chat"
              className="flex items-center justify-center gap-2 px-6 py-3.5
                border border-[var(--border)] text-text2 font-mono text-[12px]
                tracking-[0.1em] uppercase hover:border-text3 hover:text-text1
                transition-all duration-200"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-ai-pulse" />
              Chat with my Twin
            </a>
          </div>
        </motion.div>

        {/* Social links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="divide-y divide-[var(--border)]"
        >
          {SOCIAL_LINKS.map((link, i) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className="flex items-center justify-between py-3 group
                hover:pl-2 transition-all duration-300"
            >
              <span className="font-mono text-[11px] text-text3 tracking-wider uppercase
                group-hover:text-text2 transition-colors">
                {link.label}
              </span>
              <span className="font-mono text-[12px] text-text2 group-hover:text-accent
                transition-colors duration-300">
                {link.handle} →
              </span>
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

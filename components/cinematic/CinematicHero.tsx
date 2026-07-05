'use client'

import dynamic from 'next/dynamic'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { RevealText } from './RevealText'
import { Magnetic } from './Magnetic'

const Hero3D = dynamic(() => import('./Hero3D'), { ssr: false })

export function CinematicHero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 220])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1.25])
  const sceneOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.15])

  return (
    <section ref={ref} className="relative flex min-h-svh items-center overflow-hidden">
      {/* 3D scene */}
      <motion.div style={{ scale: sceneScale, opacity: sceneOpacity }} className="absolute inset-0">
        <Hero3D />
      </motion.div>

      {/* Vignette + fades */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 45%, transparent 30%, var(--bg-void) 100%)' }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-void))' }}
      />

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-28 pb-20"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 2.2 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/60 px-4 py-1.5 backdrop-blur-md"
        >
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-positive shadow-[0_0_8px_var(--green)]" />
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-foreground-muted">
            Agentic Portfolio OS — Online
          </span>
        </motion.div>

        {/* Headline */}
        <h1 className="mb-8 font-display text-[clamp(3.2rem,9vw,8rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-foreground text-balance">
          <RevealText as="span" split="lines" immediate delay={2.35} className="block">
            Not a portfolio.
          </RevealText>
          <RevealText as="span" split="lines" immediate delay={2.55} className="block">
            <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--amber)] bg-clip-text text-transparent">
              A living twin.
            </span>
          </RevealText>
        </h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 2.9 }}
          className="mb-12 max-w-xl text-lg leading-relaxed text-foreground-muted text-pretty"
        >
          I&apos;m Aman Bhaskar — an agentic AI engineer. This site knows every commit
          I&apos;ve made, detects who&apos;s visiting before they speak, and gets
          measurably smarter every Sunday night.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 3.1 }}
          className="flex flex-wrap items-center gap-4"
        >
          <Magnetic>
            <a
              href="#chat"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 font-medium text-white shadow-[0_0_40px_var(--accent-glow)] transition-shadow hover:shadow-[0_0_60px_var(--accent-glow)]"
            >
              Talk to my Twin
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="#projects"
              className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/50 px-8 py-3.5 font-medium text-foreground backdrop-blur-md transition-colors hover:border-accent/40"
            >
              Explore the System
            </a>
          </Magnetic>
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.25em] text-foreground-faint">scroll</span>
        <ArrowDown className="h-4 w-4 animate-scroll-hint text-foreground-faint" aria-hidden="true" />
      </motion.div>
    </section>
  )
}

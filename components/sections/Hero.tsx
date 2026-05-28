'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const TITLE_LINES = ['AMAN', 'BHASKAR']

const TYPING_PHRASES = [
  'A living intelligence.',
  'A self-optimizing digital twin.',
  'Not a portfolio. A presence.',
  'Running 24/7. Zero cloud cost.',
]

const TAGS = [
  'Agentic AI', 'LangGraph', 'RAG Pipelines', 'Local LLMs',
  'Full-Stack', 'Next.js 14', 'FastAPI', 'Digital Twin',
  'Zero Cloud Cost', 'Self-Optimizing',
]

function useTypingEffect(phrases: string[], speed = 55, pause = 1800) {
  const [text,    setText]    = useState('')
  const [phase,   setPhase]   = useState(0) // 0=typing, 1=pausing, 2=erasing
  const [phraseI, setPhraseI] = useState(0)

  useEffect(() => {
    const current = phrases[phraseI]
    let timeout: ReturnType<typeof setTimeout>

    if (phase === 0) {
      if (text.length < current.length) {
        timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), speed)
      } else {
        timeout = setTimeout(() => setPhase(1), pause)
      }
    } else if (phase === 1) {
      setPhase(2)
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(current.slice(0, text.length - 1)), speed / 2)
      } else {
        setPhase(0)
        setPhraseI((i) => (i + 1) % phrases.length)
      }
    }

    return () => clearTimeout(timeout)
  }, [text, phase, phraseI, phrases, speed, pause])

  return text
}

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY }  = useScroll()
  const yParallax    = useTransform(scrollY, [0, 600], [0, -120])
  const opacityFade  = useTransform(scrollY, [0, 400], [1, 0])
  const typedText    = useTypingEffect(TYPING_PHRASES)

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
  }

  const letterVariants = {
    hidden: { y: '110%', opacity: 0 },
    show: {
      y: '0%', opacity: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  }

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col justify-end pt-[var(--navbar-h)]
        overflow-hidden pb-16 md:pb-24"
    >
      {/* Mesh gradient background */}
      <div className="mesh-bg" />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px),
                            linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        }}
      />

      <motion.div
        className="relative z-10 max-w-[1400px] mx-auto w-full px-6 md:px-10"
        style={{ y: yParallax, opacity: opacityFade }}
      >
        {/* Greeting label */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 mb-8 md:mb-12"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-ai-pulse" />
          <span className="label text-text3">Welcome, human.</span>
          <span className="label text-accent">Digital Twin Active</span>
        </motion.div>

        {/* Giant Title — split letter animation */}
        {TITLE_LINES.map((line, lineIdx) => (
          <div key={line} className="clip-reveal mb-2">
            <motion.div
              className="flex"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {line.split('').map((char, charIdx) => (
                <motion.span
                  key={`${lineIdx}-${charIdx}`}
                  variants={letterVariants}
                  className="hero-title inline-block"
                  style={{
                    color: lineIdx === 1 && charIdx === 0 ? 'var(--accent)' : undefined,
                  }}
                >
                  {char}
                </motion.span>
              ))}
              {/* Outline echo — slightly offset */}
              {lineIdx === 0 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.6 }}
                  className="hero-title-outline inline-block ml-4 hidden lg:inline-block"
                  aria-hidden
                >
                  {line}
                </motion.span>
              )}
            </motion.div>
          </div>
        ))}

        {/* Body copy + typing effect */}
        <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 1.0 }}
          >
            <p className="body-text max-w-[480px] mb-4">
              I build systems that think, adapt, and advocate for their owners.
              My Digital Twin knows every commit, every tradeoff — and speaks
              in my voice. To every visitor. 24 hours a day.
            </p>

            {/* Typing effect line */}
            <div className="flex items-center gap-2 mt-6">
              <span className="font-mono text-[13px] text-cyan">{'>'}</span>
              <span className="font-mono text-[13px] text-text2">{typedText}</span>
              <span className="terminal-cursor" />
            </div>
          </motion.div>

          {/* CTA group */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 1.2 }}
            className="flex flex-col sm:flex-row md:flex-col lg:flex-row
              items-start gap-3"
          >
            <a
              href="#chat"
              className="flex items-center gap-2 px-6 py-3.5 bg-accent text-bg
                font-mono text-[12px] tracking-[0.1em] uppercase font-500
                hover:bg-white transition-colors duration-200 group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-bg animate-ai-pulse" />
              Talk to my Twin
              <span className="inline-block group-hover:translate-x-1 transition-transform duration-200">→</span>
            </a>
            <a
              href="#projects"
              className="flex items-center gap-2 px-6 py-3.5 border border-[var(--border)]
                text-text2 font-mono text-[12px] tracking-[0.1em] uppercase
                hover:border-text3 hover:text-text1 transition-all duration-200"
            >
              View my Work
            </a>
          </motion.div>
        </div>

        {/* Tags row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="flex flex-wrap gap-2 mt-12"
        >
          {TAGS.map((tag) => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.6 }}
          className="mt-16 flex items-center gap-3 text-text3"
        >
          <div className="flex flex-col gap-1 items-center">
            <div className="w-px h-12 bg-gradient-to-b from-text3 to-transparent" />
          </div>
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase rotate-0">
            Scroll to explore
          </span>
        </motion.div>
      </motion.div>

      {/* Large decorative year */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.03 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute right-0 bottom-0 font-display font-900 text-[30vw]
          text-text1 leading-none pointer-events-none select-none"
        aria-hidden
      >
        '05
      </motion.div>
    </section>
  )
}

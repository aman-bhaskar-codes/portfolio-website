'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { RevealText } from './RevealText'
import { FadeIn } from './FadeIn'

export function TwinChatSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0])

  return (
    <section id="chat" ref={ref} className="relative overflow-hidden py-28 md:py-36">
      {/* Ambient glow behind chat */}
      <motion.div
        style={{ opacity: glowOpacity }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      >
        <div
          className="h-full w-full"
          style={{
            background:
              'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(124,109,240,0.12) 0%, transparent 70%)',
          }}
        />
      </motion.div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <span className="mb-4 block font-mono text-xs uppercase tracking-[0.2em] text-accent">
            {'// 004 — Digital Twin'}
          </span>
          <RevealText
            as="h2"
            className="mx-auto mb-5 max-w-3xl font-display text-4xl font-semibold tracking-tight text-foreground md:text-6xl text-balance"
          >
            Talk to my digital self.
          </RevealText>
          <RevealText
            as="p"
            split="words"
            className="mx-auto max-w-xl leading-relaxed text-foreground-muted"
          >
            Not a FAQ bot. An AI that knows every commit, every tradeoff, and every
            opinion I have. Ask it anything.
          </RevealText>
        </div>

        <FadeIn delay={0.15} className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-border-subtle shadow-[0_0_80px_rgba(124,109,240,0.08)]">
            <ChatWindow />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

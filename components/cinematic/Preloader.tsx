'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BOOT_LINES = [
  'initializing digital twin',
  'loading rag pipeline',
  'resolving visitor persona',
  'agentic os online',
]

export function Preloader() {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [lineIndex, setLineIndex] = useState(0)

  useEffect(() => {
    let current = 0
    const interval = setInterval(() => {
      current += Math.random() * 14 + 6
      if (current >= 100) {
        current = 100
        clearInterval(interval)
        setTimeout(() => setDone(true), 450)
      }
      setProgress(Math.floor(current))
      setLineIndex(Math.min(Math.floor((current / 100) * BOOT_LINES.length), BOOT_LINES.length - 1))
    }, 180)
    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-void"
          exit={{ y: '-100%' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden="true"
        >
          <div className="flex w-full max-w-sm flex-col gap-6 px-8">
            <div className="flex items-end justify-between">
              <motion.span
                key={lineIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-xs uppercase tracking-[0.2em] text-foreground-muted"
              >
                {BOOT_LINES[lineIndex]}
              </motion.span>
              <span className="font-display text-5xl font-semibold tabular-nums text-foreground">
                {progress}
              </span>
            </div>
            <div className="h-px w-full overflow-hidden bg-overlay">
              <motion.div
                className="h-full bg-accent"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

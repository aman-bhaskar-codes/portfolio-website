'use client'

import { type ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'

const variants: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay },
  }),
}

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  amount?: number
}

export function FadeIn({ children, className, delay = 0, amount = 0.25 }: FadeInProps) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      custom={delay}
    >
      {children}
    </motion.div>
  )
}

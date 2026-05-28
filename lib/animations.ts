// Reusable Framer Motion variants — import these anywhere
import type { Variants } from 'framer-motion'

export const EASE_OUT = [0.16, 1, 0.3, 1] as const
export const EASE_IN_OUT = [0.87, 0, 0.13, 1] as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.8, ease: EASE_OUT },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.6, ease: EASE_OUT },
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
}

export const letterReveal: Variants = {
  hidden: { y: '110%', opacity: 0 },
  show: {
    y: '0%', opacity: 1,
    transition: { duration: 0.75, ease: EASE_OUT },
  },
}

export const slideInLeft: Variants = {
  hidden: { x: -60, opacity: 0 },
  show: {
    x: 0, opacity: 1,
    transition: { duration: 0.8, ease: EASE_OUT },
  },
}

export const scaleIn: Variants = {
  hidden: { scale: 0.92, opacity: 0 },
  show: {
    scale: 1, opacity: 1,
    transition: { duration: 0.7, ease: EASE_OUT },
  },
}

// Use with whileInView + viewport={{ once: true }}
export const VIEWPORT = { once: true, margin: '-15%' } as const

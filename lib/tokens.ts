export const tokens = {
  colors: {
    bg: '#050505',
    surface: '#0d0d0d',
    border: 'rgba(240,235,224,0.07)',
    text1: '#f0ebe0',
    text2: 'rgba(240,235,224,0.45)',
    accent: '#e8ff50ff',
    accentDim: 'rgba(232,255,80,0.12)',
    cyan: '#00e5ffff',
    cyanDim: 'rgba(0,229,255,0.08)',
  },
  fonts: {
    display: 'var(--font-unbounded)',
    body: 'var(--font-dm-sans)',
    mono: 'var(--font-ibm-mono)',
  },
  timing: {
    fast: 0.2,
    base: 0.4,
    slow: 0.8,
    xslow: 1.4,
  },
  ease: {
    out: [0.16, 1, 0.3, 1] as const,
    inOut: [0.87, 0, 0.13, 1] as const,
  },
}

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: tokens.ease.out },
  },
}

export const letterReveal = {
  hidden: { opacity: 0, y: '110%' },
  show: {
    opacity: 1,
    y: '0%',
    transition: { duration: 0.7, ease: tokens.ease.out },
  },
}

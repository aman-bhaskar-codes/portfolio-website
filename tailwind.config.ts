import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:       '#050505',
        surface:  '#0d0d0d',
        text1:    '#f0ebe0',
        text2:    'rgba(240,235,224,0.45)',
        text3:    'rgba(240,235,224,0.20)',
        accent:   '#e8ff50',
        cyan:     '#00e5ff',
      },
      fontFamily: {
        display: ['var(--font-unbounded)', 'Unbounded', 'sans-serif'],
        body:    ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
        mono:    ['var(--font-ibm-mono)', 'IBM Plex Mono', 'monospace'],
      },
      fontWeight: {
        '300': '300',
        '400': '400',
        '500': '500',
        '700': '700',
        '800': '800',
        '900': '900',
      },
      fontSize: {
        'hero':  ['clamp(64px,16vw,240px)', { lineHeight: '0.88', letterSpacing: '-0.04em' }],
        'section': ['clamp(32px,6vw,88px)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
      },
      spacing: {
        'navbar': '72px',
        'section': 'clamp(80px, 12vw, 160px)',
      },
      borderColor: {
        DEFAULT: 'rgba(240,235,224,0.07)',
      },
      animation: {
        'marquee': 'marquee-left 30s linear infinite',
        'ai-pulse': 'ai-pulse 2s ease-in-out infinite',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'marquee-left': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'ai-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.4', transform: 'scale(0.85)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config

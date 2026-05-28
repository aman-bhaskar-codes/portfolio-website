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
        void:     '#05050a',
        surface:  '#0d0d14',
        elevated: '#13131c',
        overlay:  '#1a1a26',
        accent: {
          DEFAULT: '#7c6df0',
          hover:   '#6b5de0',
          muted:   'rgba(124, 109, 240, 0.1)',
          glow:    'rgba(124, 109, 240, 0.2)',
        },
        amber: {
          DEFAULT: '#f59e0b',
          muted:   'rgba(245, 158, 11, 0.1)',
          glow:    'rgba(245, 158, 11, 0.2)',
        },
        neon: {
          green: '#22c55e',
          cyan:  '#06b6d4',
          red:   '#ef4444',
        },
      },
      fontFamily: {
        clash:      ['var(--font-clash)', 'sans-serif'],
        instrument: ['var(--font-instrument)', 'sans-serif'],
        mono:       ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
      },
      backdropBlur: { xl: '20px' },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config

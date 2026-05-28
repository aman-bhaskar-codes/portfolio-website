# ELITE PORTFOLIO — TEXTURA-GRADE BUILD GUIDE
### For: Aman Bhaskar · `aman-bhaskar-codes/portfolio-website`
### Inspired by: textura.agency (Awwwards Honorable Mention)

---

> **HOW TO USE THIS FILE**
> Paste the sections you need directly into your AI coding agent (Cursor, Claude Code, Windsurf, etc.) as a system prompt or inline instruction. Each section is self-contained and executable. Start with `§0 STACK SETUP` then work section by section.

---

## TABLE OF CONTENTS

```
§0  STACK SETUP .............. Dependencies, fonts, globals
§1  DESIGN SYSTEM ............ Tokens, palette, typography rules
§2  CURSOR SYSTEM ............ Magnetic custom cursor (full code)
§3  SMOOTH SCROLL ............ Lenis + GSAP ScrollTrigger setup
§4  ECHO TEXT EFFECT ......... The #1 signature of textura.agency
§5  HERO SECTION ............. Giant name + stagger char reveal
§6  MARQUEE TICKER ........... Infinite horizontal scroll strip
§7  FEATURED PROJECTS ........ Cards with scan-line hover
§8  STATS COUNTERS ........... Animated numbers on scroll entry
§9  STORY / ABOUT ............ Large editorial paragraph reveal
§10 SKILLS GRID .............. Three-column tech stack
§11 CONTACT CTA .............. Full-viewport "LET'S BUILD"
§12 PAGE TRANSITIONS ......... Overlay wipe between pages
§13 MOTION CHECKLIST ......... What makes it feel ALIVE
§14 FULL PROMPT .............. Drop-in agent prompt (copy-paste)
```

---

## §0 — STACK SETUP

### Install dependencies

```bash
npm install gsap @studio-freight/lenis split-type
# or
pnpm add gsap @studio-freight/lenis split-type
```

### globals.css — paste at top level

```css
/* ─── FONTS ─── */
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;500;600;700;800&display=swap');

/* ─── ROOT TOKENS ─── */
:root {
  --black:   #000000;
  --white:   #ffffff;
  --off:     #f5f1eb;        /* warm white for accents */
  --line:    rgba(255,255,255,0.08);
  --dim:     rgba(255,255,255,0.40);
  --dimmer:  rgba(255,255,255,0.15);
  --dimmest: rgba(255,255,255,0.06);

  /* TYPE SCALE */
  --display: clamp(13vw, 18vw, 22vw);   /* hero name */
  --h1:      clamp(4.5rem, 8vw, 8.5rem);/* section titles */
  --h2:      clamp(2.5rem, 4vw, 4rem);
  --body:    0.93rem;
  --small:   0.78rem;
  --micro:   0.7rem;

  /* SPACING */
  --gutter:  3rem;
  --section: 8rem;

  /* EASING */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:   cubic-bezier(0.83, 0, 0.17, 1);
  --ease-elastic:  cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ─── RESET ─── */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: auto; } /* Lenis handles scrolling */
body {
  background: var(--black);
  color: var(--white);
  font-family: 'Syne', sans-serif;
  overflow-x: hidden;
  cursor: none;
}

/* ─── GRAIN TEXTURE OVERLAY ─── */
body::before {
  content: '';
  position: fixed; inset: 0;
  z-index: 9000; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 180px 180px;
  opacity: 0.028;
  mix-blend-mode: overlay;
}

/* ─── SCROLLBAR ─── */
::-webkit-scrollbar { width: 2px; }
::-webkit-scrollbar-track { background: var(--black); }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); }

/* ─── SELECTION ─── */
::selection { background: white; color: black; }
```

---

## §1 — DESIGN SYSTEM

### Typography rules (strict — follow exactly)

```
DISPLAY FONT:   Bebas Neue
  → Hero name (AMAN BHASKAR)         → var(--display)
  → Section titles (FEATURED, etc.)  → var(--h1)
  → Project card titles              → 2.6rem
  → Contact CTA (LET'S BUILD)        → clamp(6rem, 15vw, 19rem)
  → ALL these have the ECHO EFFECT (see §4)

BODY FONT:      Syne
  → Nav links        → 0.78rem / weight 600 / tracking .12em / uppercase
  → Section labels   → 0.72rem / weight 600 / tracking .22em / uppercase / opacity 0.28
  → Body paragraph   → 0.93rem / weight 400 / line-height 1.75
  → Small text       → 0.78rem
  → Micro labels     → 0.7rem

COLOR RULES:
  → Background:       #000000 — always pure black, zero exceptions
  → Primary text:     #ffffff — full white
  → Secondary text:   rgba(255,255,255,0.40) — for descriptions
  → Tertiary text:    rgba(255,255,255,0.28) — for labels/metadata
  → Ghost text:       rgba(255,255,255,0.06) — for echo outlines
  → Borders:          rgba(255,255,255,0.08) — 1px lines
  → Card hover bg:    rgba(255,255,255,0.025) — barely visible shift
  → NO gradients. NO colors. Black and white only.
  → ONE exception: on active/hover states, background flips to #fff, text to #000

LETTER SPACING:
  → Display fonts:    -0.01em to -0.02em  (tight)
  → Nav/labels:       +0.12em to +0.22em  (very open)
  → Body:             0 to +0.04em        (natural)
```

---

## §2 — CURSOR SYSTEM

### Create `components/Cursor.tsx`

```tsx
'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Cursor() {
  const dot   = useRef<HTMLDivElement>(null);
  const ring  = useRef<HTMLDivElement>(null);
  const pos   = useRef({ x: 0, y: 0 });
  const ring_ = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      gsap.to(dot.current, {
        x: e.clientX, y: e.clientY,
        duration: 0.05, ease: 'none',
      });
    };

    const onEnterLink = () => {
      gsap.to(dot.current,  { scale: 0.4, duration: 0.25 });
      gsap.to(ring.current, { scale: 1.6, borderColor: 'rgba(255,255,255,0.75)', duration: 0.3 });
    };
    const onLeaveLink = () => {
      gsap.to(dot.current,  { scale: 1, duration: 0.25 });
      gsap.to(ring.current, { scale: 1, borderColor: 'rgba(255,255,255,0.35)', duration: 0.3 });
    };

    // Smooth ring follow
    const animate = () => {
      ring_.current.x += (pos.current.x - ring_.current.x) * 0.11;
      ring_.current.y += (pos.current.y - ring_.current.y) * 0.11;
      gsap.set(ring.current, { x: ring_.current.x, y: ring_.current.y });
      requestAnimationFrame(animate);
    };
    animate();

    document.addEventListener('mousemove', onMove);
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', onEnterLink);
      el.addEventListener('mouseleave', onLeaveLink);
    });

    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <>
      <div ref={dot} style={{
        position: 'fixed', width: 8, height: 8,
        background: 'white', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 9999,
        transform: 'translate(-50%, -50%)',
        mixBlendMode: 'difference',
        willChange: 'transform',
      }} />
      <div ref={ring} style={{
        position: 'fixed', width: 40, height: 40,
        border: '1px solid rgba(255,255,255,0.35)',
        borderRadius: '50%', pointerEvents: 'none',
        zIndex: 9998,
        transform: 'translate(-50%, -50%)',
        willChange: 'transform',
      }} />
    </>
  );
}
```

---

## §3 — SMOOTH SCROLL (Lenis)

### Create `components/SmoothScroll.tsx`

```tsx
'use client';
import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  return <>{children}</>;
}
```

### Wrap in `app/layout.tsx`

```tsx
import SmoothScroll from '@/components/SmoothScroll';
import Cursor from '@/components/Cursor';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Cursor />
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
```

---

## §4 — ECHO TEXT EFFECT ⚡ (TEXTURA'S SIGNATURE)

This is the **#1 most identifiable** thing about textura.agency. Every large heading has a ghost duplicate that sits slightly behind and below, visible only as a transparent outline stroke. On scroll, the ghost appears to "chase" the real text creating cinematic depth.

### CSS implementation (works on any element)

```css
/* Apply .echo class to any heading element */
.echo {
  position: relative;
  display: inline-block;
}

/* The ghost: same text, slightly offset, outline only */
.echo::after {
  content: attr(data-text);       /* Must set data-text="SAME TEXT" on the element */
  position: absolute;
  left: 0.04em;
  top: 0.04em;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  color: transparent;
  -webkit-text-stroke: 1px rgba(255,255,255,0.07);
  pointer-events: none;
  z-index: -1;
  /* On scroll, animate offset: */
  transition: transform 0.6s var(--ease-out-expo);
}

/* Scroll-amplified ghost (GSAP adds this) */
.echo.scrolling::after {
  transform: translate(0.08em, 0.06em);
}
```

### GSAP echo parallax on scroll

```tsx
// In your component, after GSAP init:
useEffect(() => {
  gsap.utils.toArray('.echo').forEach((el: any) => {
    gsap.to(el.querySelector('::after') /* won't work — use a real sibling */, {
      // Instead: use a real ghost element
    });
  });
}, []);
```

### Better: Real DOM ghost element (recommended)

```tsx
// components/EchoText.tsx
export function EchoText({
  children,
  tag: Tag = 'h1',
  className = '',
}: {
  children: string;
  tag?: keyof JSX.IntrinsicElements;
  className?: string;
}) {
  return (
    <div className={`echo-wrap ${className}`}>
      <Tag className="echo-real">{children}</Tag>
      <Tag className="echo-ghost" aria-hidden="true">{children}</Tag>
    </div>
  );
}
```

```css
/* EchoText.module.css */
.echo-wrap {
  position: relative;
  display: inline-block;
  overflow: visible;
}

.echo-real {
  position: relative;
  z-index: 1;
  color: white;
}

.echo-ghost {
  position: absolute;
  left: 0.04em;
  top: 0.04em;
  color: transparent;
  -webkit-text-stroke: 1px rgba(255,255,255,0.07);
  pointer-events: none;
  z-index: 0;
  /* Scrolls at a slightly different rate via GSAP parallax */
  will-change: transform;
}
```

```tsx
// Animate ghost on scroll (in parent component)
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

const ghostRef = useRef<HTMLElement[]>([]);

useEffect(() => {
  document.querySelectorAll('.echo-ghost').forEach((ghost) => {
    gsap.to(ghost, {
      y: '+=18',          // Ghost drifts 18px on scroll
      ease: 'none',
      scrollTrigger: {
        trigger: ghost.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,        // Higher = more lag = more dramatic drift
      },
    });
  });
}, []);
```

---

## §5 — HERO SECTION

### Visual spec
```
LAYOUT (flex column, justify: flex-end, min-height: 100vh)
│
├── .greeting   → "Hello world. I build things that think."
│                  font: Syne 0.82rem / weight 500 / tracking .18em
│                  color: rgba(255,255,255,0.4)
│                  animates: fadeInUp, delay 0.15s
│
├── .hname-wrap → overflow: hidden (clips the slide-up reveal)
│   └── AMAN    → Bebas Neue, clamp(13vw,18vw,22vw)
│                  animates: translateY(108%) → 0, delay 0.2s
│                  echo ghost: offset 0.04em
│
├── .hname-wrap
│   └── BHASKAR → same, delay 0.38s
│
├── .hero-sub   → max-width 460px, 0.93rem, color: rgba(255,255,255,0.4)
│                  animates: fadeInUp, delay 0.9s
│
└── .hero-cta   → flex row, gap 2rem
    ├── "Let's build →"    (primary, border-bottom full opacity)
    └── "Explore GitHub"   (secondary, border-bottom 60% opacity)
```

### Component code

```tsx
// components/Hero.tsx
'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import SplitType from 'split-type';

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stagger each character of the name
      const nameLines = gsap.utils.toArray<HTMLElement>('.hero-name-line');
      nameLines.forEach((line, i) => {
        const split = new SplitType(line, { types: 'chars' });
        gsap.from(split.chars, {
          yPercent: 110,
          duration: 1.0,
          ease: 'power4.out',
          stagger: 0.035,
          delay: 0.15 + i * 0.18,
        });
      });

      // Greeting + sub text
      gsap.from('.hero-greeting', { opacity: 0, y: 16, duration: 0.9, delay: 0.1 });
      gsap.from('.hero-sub',      { opacity: 0, y: 20, duration: 0.9, delay: 0.85 });
      gsap.from('.hero-cta',      { opacity: 0, y: 20, duration: 0.9, delay: 1.05 });

      // Ghost echo parallax
      gsap.to('.name-ghost', {
        y: 22,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 2,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} style={{
      minHeight: '100vh',
      padding: '0 var(--gutter) 5rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
    }}>
      <p className="hero-greeting" style={{
        fontSize: '0.82rem', fontWeight: 600,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.4)', marginBottom: '0.8rem',
      }}>
        Hello world. I build things that think.
      </p>

      {['AMAN', 'BHASKAR'].map((word) => (
        <div key={word} style={{ overflow: 'hidden', lineHeight: 0.88 }}>
          <div style={{ position: 'relative' }}>
            {/* Real text */}
            <h1 className="hero-name-line" style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'var(--display)',
              letterSpacing: '-0.01em',
              lineHeight: 0.88,
              position: 'relative', zIndex: 1,
            }}>
              {word}
            </h1>
            {/* Echo ghost */}
            <h1 className="name-ghost" aria-hidden="true" style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'var(--display)',
              letterSpacing: '-0.01em',
              lineHeight: 0.88,
              position: 'absolute',
              left: '0.04em', top: '0.04em',
              color: 'transparent',
              WebkitTextStroke: '1px rgba(255,255,255,0.07)',
              pointerEvents: 'none', zIndex: 0,
              willChange: 'transform',
            }}>
              {word}
            </h1>
          </div>
        </div>
      ))}

      <p className="hero-sub" style={{
        maxWidth: 460, fontSize: '0.93rem', lineHeight: 1.75,
        color: 'rgba(255,255,255,0.4)', marginTop: '2.2rem',
      }}>
        Full-Stack Developer &amp; AI Engineer building autonomous systems
        that don't just display code — they think, adapt, and advocate.
        Every project is living intelligence, not just an interface.
      </p>

      <div className="hero-cta" style={{ display: 'flex', gap: '2rem', marginTop: '1.8rem' }}>
        <a href="#contact" style={{
          color: 'white', textDecoration: 'none',
          fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.06em',
          borderBottom: '1px solid rgba(255,255,255,0.6)', paddingBottom: 3,
        }}>
          Let's build →
        </a>
        <a href="https://github.com/aman-bhaskar-codes" target="_blank" rel="noreferrer" style={{
          color: 'white', textDecoration: 'none',
          fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.06em',
          opacity: 0.65, borderBottom: '1px solid rgba(255,255,255,0.2)',
          paddingBottom: 3,
        }}>
          Explore GitHub
        </a>
      </div>
    </section>
  );
}
```

---

## §6 — MARQUEE TICKER

```tsx
// components/Marquee.tsx
'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const ITEMS = [
  { text: 'Next.js 14', dim: false },
  { text: 'FastAPI',    dim: true  },
  { text: 'LangGraph',  dim: false },
  { text: 'Three.js',   dim: true  },
  { text: 'Python',     dim: false },
  { text: 'Qdrant',     dim: true  },
  { text: 'Redis',      dim: false },
  { text: 'Docker',     dim: true  },
  { text: 'Ollama',     dim: false },
  { text: 'DSPy',       dim: true  },
  { text: 'ColBERT',    dim: false },
  { text: 'TypeScript', dim: true  },
  { text: 'RAG Pipeline', dim: false },
  { text: 'pgvector',   dim: true  },
];

export default function Marquee({ reverse = false }: { reverse?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current!;
    const width = track.scrollWidth / 2; // half because we duplicate

    gsap.to(track, {
      x: reverse ? `+=${width}` : `-=${width}`,
      duration: reverse ? 35 : 30,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize(
          reverse
            ? (x: number) => (parseFloat(x) % width)
            : (x: number) => (parseFloat(x) % -width)
        ),
      },
    });
  }, [reverse]);

  const all = [...ITEMS, ...ITEMS]; // duplicate for seamless loop

  return (
    <div style={{
      overflow: 'hidden',
      padding: '1.3rem 0',
      borderTop: '1px solid var(--line)',
      borderBottom: '1px solid var(--line)',
    }}>
      <div ref={trackRef} style={{ display: 'flex', width: 'max-content', willChange: 'transform' }}>
        {all.map((item, i) => (
          <span key={i} style={{
            fontSize: '0.75rem', fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            padding: '0 2rem', whiteSpace: 'nowrap',
            color: item.dim ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.65)',
          }}>
            {item.text}
            <span style={{ marginLeft: '2rem', color: 'rgba(255,255,255,0.12)' }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
```

---

## §7 — FEATURED PROJECTS GRID

### Card hover effects (CSS)

```css
/* The scan-line: a bright horizontal beam that sweeps across on hover */
.project-card {
  position: relative;
  overflow: hidden;
  background: var(--black);
  border: 1px solid var(--dimmest);
  padding: 2.8rem 2.4rem;
  transition: background 0.35s ease;
}

/* SCAN LINE — sweeps left to right on hover */
.project-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.5) 50%,
    transparent 100%
  );
  transform: translateX(-110%);
  transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}

.project-card:hover::before {
  transform: translateX(110%);
}

/* BOTTOM GRADIENT — subtle depth on hover */
.project-card::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 120px;
  background: linear-gradient(0deg, rgba(255,255,255,0.02), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.project-card:hover::after  { opacity: 1; }
.project-card:hover          { background: rgba(255,255,255,0.025); }

/* Arrow flies on hover */
.project-arrow {
  position: absolute;
  bottom: 2.4rem; right: 2.4rem;
  color: rgba(255,255,255,0.13);
  font-size: 1.4rem;
  transition: color 0.3s ease, transform 0.3s var(--ease-out-expo);
}
.project-card:hover .project-arrow {
  color: rgba(255,255,255,0.7);
  transform: translate(5px, -5px);
}
```

### Project data (put in `data/projects.ts`)

```ts
export const projects = [
  {
    id: '01',
    category: 'ai',
    tag: 'AI / Agentic',
    title: 'Agentic Portfolio OS',
    desc: 'A living autonomous intelligence that advocates 24/7. Knows every commit, every architectural tradeoff. Classifies every visitor before they say a word.',
    stack: ['LangGraph', 'RAG', 'Ollama', 'Next.js 14', 'FastAPI'],
    href: 'https://github.com/aman-bhaskar-codes/portfolio-website',
  },
  {
    id: '02',
    category: 'ai',
    tag: 'AI / ML',
    title: 'Digital Twin Engine',
    desc: 'Not a chatbot. A persona-adaptive voice engine that speaks as its owner — real opinions, honest uncertainty, zero sycophancy. Improves every week via DSPy MIPROv2.',
    stack: ['phi4-mini', 'DSPy', 'ColBERT', 'LangFuse'],
    href: 'https://github.com/aman-bhaskar-codes/portfolio-website',
  },
  {
    id: '03',
    category: 'systems',
    tag: 'Systems / ML',
    title: '5-Stage RAG Pipeline',
    desc: 'HyDE expansion → Dense + Sparse retrieval → RRF fusion → ColBERT token-level reranking. Finds the exact 5 chunks, not 20 vague neighbors — in under 140ms.',
    stack: ['Qdrant', 'BM25', 'pgvector', 'Python', 'nomic-embed'],
    href: 'https://github.com/aman-bhaskar-codes/portfolio-website',
  },
  {
    id: '04',
    category: 'systems',
    tag: 'Infrastructure',
    title: 'Zero-Cost AI Stack',
    desc: '22 Docker services. 100% local AI via Ollama. No cloud AI bill. Circuit breakers on every external call. Self-healing scheduled tasks. 5-tier graceful degradation.',
    stack: ['Docker', 'Nginx', 'Celery', 'Redis', 'Cloudflare'],
    href: 'https://github.com/aman-bhaskar-codes/portfolio-website',
  },
  {
    id: '05',
    category: 'ai',
    tag: 'AI / Security',
    title: 'Visitor Intelligence',
    desc: 'Classifies every visitor into a persona before they speak — from referrer URL, IP company resolution, UTM source, and scroll behavior. Adapts the entire UI before interaction.',
    stack: ['MaxMind', 'Prometheus', 'DuckDB', 'Umami'],
    href: 'https://github.com/aman-bhaskar-codes/portfolio-website',
  },
  {
    id: '06',
    category: 'fullstack',
    tag: 'Full-Stack',
    title: '3-Tier Memory System',
    desc: 'Working memory in Redis → episodic compression to pgvector → semantic long-term in Qdrant. 10k concurrent users. Per-user personalization. Pure zero-cost architecture.',
    stack: ['Redis Stack', 'PostgreSQL', 'Qdrant', 'TypeScript'],
    href: 'https://github.com/aman-bhaskar-codes/portfolio-website',
  },
];
```

---

## §8 — STATS COUNTERS

```tsx
// components/Stats.tsx
'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

const STATS = [
  { n: 20,  suffix: '+',  label: 'Projects Built'        },
  { n: 22,  suffix: '',   label: 'Docker Services'        },
  { n: 100, suffix: '%',  label: 'Local AI — Zero Cost'   },
  { n: 5,   suffix: '',   label: 'Years Coding'           },
];

function Counter({ n, suffix, label }: typeof STATS[0]) {
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: n,
      duration: 1.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: numRef.current,
        start: 'top 85%',
        once: true,
      },
      onUpdate() {
        if (numRef.current)
          numRef.current.textContent = Math.round(obj.val) + suffix;
      },
    });
  }, [n, suffix]);

  return (
    <div style={{
      background: 'var(--black)',
      padding: '3.5rem 2rem',
      textAlign: 'center',
      borderRight: '1px solid var(--dimmest)',
    }}>
      <span ref={numRef} style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 'clamp(3rem, 5vw, 6rem)',
        lineHeight: 1, display: 'block', marginBottom: '0.5rem',
      }}>
        0{suffix}
      </span>
      <span style={{
        fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.3)', display: 'block',
      }}>
        {label}
      </span>
    </div>
  );
}

export default function Stats() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      background: 'var(--dimmest)',
      gap: '1px',
      borderTop: '1px solid var(--line)',
      borderBottom: '1px solid var(--line)',
    }}>
      {STATS.map((s) => <Counter key={s.label} {...s} />)}
    </div>
  );
}
```

---

## §9 — ABOUT / STORY SECTION

### Large editorial paragraph (like textura's story)

The text should be big (clamp 1.35rem → 2.2rem), and individual words/lines should animate in on scroll using SplitType.

```tsx
// components/About.tsx
'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

export default function About() {
  const paraRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const split = new SplitType(paraRef.current!, { types: 'lines' });
    // Wrap each line in a clip container
    split.lines?.forEach((line) => {
      const wrapper = document.createElement('div');
      wrapper.style.overflow = 'hidden';
      line.parentNode!.insertBefore(wrapper, line);
      wrapper.appendChild(line);
    });

    gsap.from(split.lines, {
      yPercent: 105,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: paraRef.current,
        start: 'top 80%',
      },
    });
  }, []);

  return (
    <section style={{ padding: 'var(--section) var(--gutter)' }} id="about">
      <p style={{
        fontSize: '0.72rem', fontWeight: 600,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.28)', marginBottom: '3rem',
      }}>
        The story
      </p>
      <p ref={paraRef} style={{
        maxWidth: '900px',
        fontSize: 'clamp(1.35rem, 2.2vw, 2.2rem)',
        lineHeight: 1.55, fontWeight: 400,
        color: 'rgba(255,255,255,0.6)',
      }}>
        My journey started{' '}
        <strong style={{ color: 'white', fontWeight: 700 }}>
          obsessing over systems that think.
        </strong>{' '}
        Not just code that runs — but intelligence that{' '}
        <strong style={{ color: 'white', fontWeight: 700 }}>
          adapts, learns, and improves itself every week.
        </strong>{' '}
        I built a portfolio that classifies every visitor before they speak.
        A RAG pipeline that finds the exact answer in 140ms.
        A digital twin that speaks in my voice.{' '}
        <strong style={{ color: 'white', fontWeight: 700 }}>
          This is what I build:
        </strong>{' '}
        living systems, not demos.
      </p>
    </section>
  );
}
```

---

## §10 — SKILLS GRID

```tsx
// components/Skills.tsx
const SKILLS = [
  {
    title: 'Frontend',
    items: ['Next.js 14 / App Router', 'TypeScript', 'Three.js / WebGL', 'Tailwind CSS', 'Framer Motion / GSAP'],
  },
  {
    title: 'Backend / AI',
    items: ['FastAPI / 8 uvicorn workers', 'LangGraph / Multi-agent', 'Ollama / 100% local LLMs', 'DSPy / Self-optimization', 'Python / Node.js'],
  },
  {
    title: 'Infrastructure',
    items: ['PostgreSQL / pgvector', 'Redis Stack', 'Qdrant Vector DB', 'Docker / 22 services', 'Cloudflare / Nginx'],
  },
];

export default function Skills() {
  return (
    <section style={{ padding: '0 var(--gutter) var(--section)' }} id="skills">
      {/* Header */}
      <div style={{ marginBottom: '3.5rem' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: '1.5rem' }}>
          What I use
        </p>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'var(--h1)', lineHeight: 0.88,
        }}>
          Tech<br />Stack
        </h2>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1px',
        background: 'var(--dimmest)',
      }}>
        {SKILLS.map(({ title, items }) => (
          <div key={title} style={{
            background: 'var(--black)',
            padding: '2.8rem 2.4rem',
            border: '1px solid var(--dimmest)',
          }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '2.4rem',
              letterSpacing: '0.04em',
              marginBottom: '1.8rem',
            }}>
              {title}
            </div>
            <ul style={{ listStyle: 'none' }}>
              {items.map((item) => (
                <li key={item} style={{
                  fontSize: '0.87rem',
                  color: 'rgba(255,255,255,0.42)',
                  padding: '0.65rem 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  letterSpacing: '0.04em',
                  transition: 'color 0.25s ease, padding-left 0.25s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.88)';
                  (e.currentTarget as HTMLElement).style.paddingLeft = '0.5rem';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.42)';
                  (e.currentTarget as HTMLElement).style.paddingLeft = '0';
                }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## §11 — CONTACT CTA (Full Viewport)

```tsx
// components/ContactCTA.tsx
'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

export default function ContactCTA() {
  const headRef = useRef<HTMLHeadingElement>(null);
  const ghostRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Ghost drifts down as you scroll into the section
    gsap.to(ghostRef.current, {
      y: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: headRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2,
      },
    });
  }, []);

  const LINKS = [
    { label: 'GitHub',      href: 'https://github.com/aman-bhaskar-codes'                  },
    { label: 'LinkedIn',    href: 'https://www.linkedin.com/in/aman-bhaskar-18jan2005/'     },
    { label: 'Twitter / X', href: 'https://x.com/_aman_bhaskar'                            },
    { label: 'Instagram',   href: 'https://www.instagram.com/mr.aman.bhaskar/'             },
    { label: 'Email',       href: 'mailto:amanbhaskarcodes@gmail.com'                      },
  ];

  return (
    <section id="contact" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '4rem var(--gutter)',
      borderTop: '1px solid var(--line)',
    }}>
      <p style={{
        fontSize: '0.72rem', fontWeight: 600,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.28)', marginBottom: '2rem',
      }}>
        Let's connect
      </p>

      {/* Giant heading with echo ghost */}
      <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
        <h2 ref={headRef} style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(5rem, 14vw, 18rem)',
          lineHeight: 0.85,
          letterSpacing: '-0.01em',
          position: 'relative', zIndex: 1,
        }}>
          LET'S<br />BUILD
        </h2>
        {/* Echo ghost */}
        <h2 ref={ghostRef} aria-hidden="true" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(5rem, 14vw, 18rem)',
          lineHeight: 0.85,
          letterSpacing: '-0.01em',
          position: 'absolute',
          left: '0.04em', top: '0.04em',
          width: '100%',
          color: 'transparent',
          WebkitTextStroke: '1px rgba(255,255,255,0.05)',
          pointerEvents: 'none', zIndex: 0,
          willChange: 'transform',
        }}>
          LET'S<br />BUILD
        </h2>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {LINKS.map(({ label, href }) => (
          <a key={label} href={href} target="_blank" rel="noreferrer" style={{
            color: 'rgba(255,255,255,0.35)',
            textDecoration: 'none',
            fontSize: '0.78rem', fontWeight: 600,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            transition: 'color 0.25s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            {label}
          </a>
        ))}
      </div>

      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', letterSpacing: '0.08em' }}>
        amanbhaskarcodes@gmail.com
      </p>
    </section>
  );
}
```

---

## §12 — PAGE TRANSITIONS (Overlay Wipe)

This adds the black overlay wipe that slides in/out between route changes — very textura.

```tsx
// components/PageTransition.tsx
'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const overlay = overlayRef.current!;
    const tl = gsap.timeline();

    // Slide in then out
    tl.fromTo(overlay,
      { scaleY: 1, transformOrigin: 'top' },
      { scaleY: 0, duration: 0.7, ease: 'power4.inOut', transformOrigin: 'top' }
    );
  }, [pathname]);

  return (
    <>
      {/* Overlay */}
      <div ref={overlayRef} style={{
        position: 'fixed', inset: 0,
        background: 'black',
        zIndex: 8000,
        transformOrigin: 'top',
        pointerEvents: 'none',
      }} />
      {children}
    </>
  );
}
```

---

## §13 — MOTION CHECKLIST ✦

Everything that makes textura feel ALIVE. Implement ALL of these:

```
LOAD SEQUENCE (in order, first 1.5 seconds)
  [0.0s] Black screen — nothing
  [0.15s] Greeting line fades up
  [0.20s] "AMAN" characters slide up from below (staggered per char)
  [0.38s] "BHASKAR" slides up
  [0.85s] Subtitle paragraph fades up
  [1.05s] CTA links fade up
  [1.20s] Nav links fade in (from y: -10)
  ← Total: 1.5s cinematic reveal

SCROLL ANIMATIONS
  • Marquee: constant left-scroll via GSAP ticker (infinite)
  • Section titles: SplitType chars slide up as section enters viewport
  • About paragraph: SplitType lines clip-reveal staggered
  • Stats: count up on first viewport entry (once: true)
  • Echo ghost: scrub parallax on scroll (y drifts +20px on downscroll)
  • Project cards: stagger fade-in when grid enters viewport
  • Skills list items: stagger down the list on entry

HOVER STATES
  • Project cards: scan-line beam sweeps header + arrow translates ↗
  • Nav links: opacity 0.65 → 1.0
  • Skill list items: color brightens + indent left by 0.5rem
  • CTA links: color 0.35 → 1.0
  • Contact links: same

CURSOR
  • Dot: 8px white circle, mix-blend-mode: difference, instant (no lag)
  • Ring: 40px outline circle, follows with 0.11 lerp (smooth trail)
  • On hover link: dot shrinks to 3px, ring expands to 64px + brightens
  • Cursor hidden on mobile

CONTINUOUS
  • Grain texture: static, always on (CSS background-image)
  • Marquee: runs forever, never stops
  • Scrollbar: 2px white, always visible on right edge
```

---

## §14 — FULL AGENT PROMPT (copy-paste into Cursor / Claude Code)

> Drop this entire block as a system prompt or first message to your coding agent.

---

```
You are building an elite portfolio website for AMAN BHASKAR, a Full-Stack Developer & AI Engineer.
The design is inspired by textura.agency (Awwwards Honorable Mention) — a pure black luxury aesthetic with white typography.

TECH STACK:
- Next.js 14 (App Router)
- TypeScript
- GSAP + ScrollTrigger
- Lenis (smooth scroll)
- SplitType (text animation)
- Tailwind CSS (utility only — not for design)

DESIGN RULES (non-negotiable):
1. Background is ALWAYS #000000 — pure black. No exceptions.
2. Text is white only. No colors. No gradients. Black and white only.
3. Display font: "Bebas Neue" (Google Fonts) — for all large headings
4. Body font: "Syne" (Google Fonts) — for all body, nav, labels
5. EVERY large heading has an ECHO GHOST:
   - A second identical DOM element positioned absolute, left: 0.04em, top: 0.04em
   - Color: transparent, -webkit-text-stroke: 1px rgba(255,255,255,0.07)
   - GSAP scrub parallax: as user scrolls, ghost drifts +20px on y-axis
6. Nav: 4 text links only. No logo. mix-blend-mode: difference.
7. Custom cursor: white 8px dot (mix-blend-mode: difference) + 40px ring with 0.11 lerp
8. Grain overlay: SVG noise texture at 2.8% opacity, always on
9. Border separator: 1px solid rgba(255,255,255,0.08) — between all sections
10. Card grid: gap: 1px, background: rgba(255,255,255,0.06) — the 1px lines are the card borders

SECTION ORDER:
1. Hero — "AMAN BHASKAR" at clamp(13vw,18vw,22vw), stagger char reveal on load
2. Marquee — infinite tech stack ticker (GSAP)
3. Featured Projects — 3-col grid, 6 cards, category tab filter
4. Stats — 4 animated counters (20+ projects, 22 Docker, 100% local AI, 5 yrs)
5. About/Story — large editorial paragraph, SplitType line reveal on scroll
6. Tech Stack — 3-col skills grid (Frontend / Backend AI / Infrastructure)
7. Contact CTA — full-viewport "LET'S BUILD" with echo ghost + social links
8. Footer — 1 line: name / role / GitHub source link

CONTENT — use EXACTLY this data:
- Name: AMAN BHASKAR
- Role: Full-Stack Developer & AI Engineer
- Greeting: "Hello world. I build things that think."
- Bio: "Full-Stack Developer & AI Engineer building autonomous systems that don't just display code — they think, adapt, and advocate. Every project is living intelligence, not just an interface."
- GitHub: https://github.com/aman-bhaskar-codes
- LinkedIn: https://www.linkedin.com/in/aman-bhaskar-18jan2005/
- Twitter/X: https://x.com/_aman_bhaskar
- Instagram: https://www.instagram.com/mr.aman.bhaskar/
- Email: amanbhaskarcodes@gmail.com

ANIMATIONS — implement ALL:
- Load: greeting (0.15s) → AMAN chars (0.20s, staggered) → BHASKAR (0.38s) → sub (0.85s) → CTA (1.05s)
- Scroll: SplitType char/line reveal on all section titles and about paragraph
- Echo ghost: GSAP scrub parallax, y += 20 on scroll, scrub: 2
- Stats: GSAP count-up, ScrollTrigger once: true
- Cards: stagger fade-in + translateY when grid enters viewport
- Marquee: GSAP infinite ticker, duration 30s
- Cursor: dot instant, ring lerp 0.11 per frame in rAF loop
- Page transition: GSAP scaleY overlay wipe on route change

FILE STRUCTURE:
app/
  layout.tsx       (SmoothScroll + Cursor wrapper)
  page.tsx         (compose all sections)
components/
  Cursor.tsx
  SmoothScroll.tsx
  Hero.tsx
  Marquee.tsx
  Projects.tsx
  Stats.tsx
  About.tsx
  Skills.tsx
  ContactCTA.tsx
  Footer.tsx
  PageTransition.tsx
data/
  projects.ts
styles/
  globals.css

Build it section by section. Start with globals.css + layout.tsx + Cursor.tsx. Then Hero. Then the rest in order. Ask me before moving to the next section.
```

---

## QUICK REFERENCE — Colors at a glance

```
#000000                      → page background (always)
#ffffff                      → primary text
rgba(255,255,255,0.65)       → bright secondary text
rgba(255,255,255,0.40)       → body text / descriptions
rgba(255,255,255,0.28)       → section labels / metadata
rgba(255,255,255,0.15)       → dimmer accents
rgba(255,255,255,0.08)       → section dividers / borders
rgba(255,255,255,0.06)       → grid gap background (gives 1px lines)
rgba(255,255,255,0.07)       → echo ghost text-stroke
rgba(255,255,255,0.025)      → card hover background
rgba(255,255,255,0.028)      → grain texture opacity
```

---

*Built from: deep analysis of textura.agency (https://textura.agency) + aman-bhaskar-codes/portfolio-website*
*This file: PORTFOLIO_ELITE_BUILD.md*

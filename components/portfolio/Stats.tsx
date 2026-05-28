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
      background: 'var(--black, #000)',
      padding: '3.5rem 2rem',
      textAlign: 'center',
    }}>
      <span ref={numRef} style={{
        fontFamily: "var(--font-display-alt), 'Bebas Neue', sans-serif",
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

export function Stats() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      background: 'rgba(255,255,255,0.06)',
      gap: '1px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      {STATS.map((s) => <Counter key={s.label} {...s} />)}
    </div>
  );
}

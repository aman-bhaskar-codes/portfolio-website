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

    gsap.from(split.lines || [], {
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
    <section style={{ padding: '8rem 3rem' }} id="about">
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

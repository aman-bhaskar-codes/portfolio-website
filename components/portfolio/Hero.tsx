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
      padding: '0 3rem 5rem',
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
              fontFamily: "var(--font-display-alt), 'Bebas Neue', sans-serif",
              fontSize: 'clamp(13vw, 18vw, 22vw)',
              letterSpacing: '-0.01em',
              lineHeight: 0.88,
              position: 'relative', zIndex: 1,
            }}>
              {word}
            </h1>
            {/* Echo ghost */}
            <h1 className="name-ghost" aria-hidden="true" style={{
              fontFamily: "var(--font-display-alt), 'Bebas Neue', sans-serif",
              fontSize: 'clamp(13vw, 18vw, 22vw)',
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

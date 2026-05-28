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
      padding: '4rem 3rem',
      borderTop: '1px solid rgba(255,255,255,0.08)',
    }}>
      <p style={{
        fontSize: '0.72rem', fontWeight: 600,
        letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.28)', marginBottom: '2rem',
      }}>
        Let's connect
      </p>

      {/* Giant heading with echo ghost */}
      <div style={{ position: 'relative', marginBottom: '2.5rem', overflow: 'hidden' }}>
        <h2 ref={headRef} style={{
          fontFamily: "var(--font-display-alt), 'Bebas Neue', sans-serif",
          fontSize: 'clamp(5rem, 14vw, 18rem)',
          lineHeight: 0.85,
          letterSpacing: '-0.01em',
          position: 'relative', zIndex: 1,
        }}>
          LET'S<br />BUILD
        </h2>
        {/* Echo ghost */}
        <h2 ref={ghostRef} aria-hidden="true" style={{
          fontFamily: "var(--font-display-alt), 'Bebas Neue', sans-serif",
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

'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import gsap from 'gsap';

export default function Navigation() {
  useEffect(() => {
    gsap.from('.nav-link', {
      opacity: 0,
      y: -10,
      duration: 0.8,
      stagger: 0.1,
      delay: 1.20,
      ease: 'power3.out'
    });
  }, []);

  const links = [
    { label: 'PROJECTS', href: '#projects' },
    { label: 'ABOUT', href: '#about' },
    { label: 'SKILLS', href: '#skills' },
    { label: 'CONTACT', href: '#contact' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      padding: '2.5rem var(--gutter)',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '3rem',
      zIndex: 8000,
      mixBlendMode: 'difference',
    }}>
      {links.map((link) => (
        <Link 
          key={link.label} 
          href={link.href}
          className="nav-link"
          style={{
            color: 'white',
            textDecoration: 'none',
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: 0.65,
            transition: 'opacity 0.25s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.65')}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

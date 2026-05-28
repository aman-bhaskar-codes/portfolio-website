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

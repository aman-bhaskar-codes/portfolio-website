'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const dot   = useRef<HTMLDivElement>(null);
  const ring  = useRef<HTMLDivElement>(null);
  const pos   = useRef({ x: 0, y: 0 });
  const ring_ = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Only run on desktop/non-touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

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

    const animate = () => {
      ring_.current.x += (pos.current.x - ring_.current.x) * 0.11;
      ring_.current.y += (pos.current.y - ring_.current.y) * 0.11;
      gsap.set(ring.current, { x: ring_.current.x, y: ring_.current.y });
      requestAnimationFrame(animate);
    };
    animate();

    document.addEventListener('mousemove', onMove);
    const elements = document.querySelectorAll('a, button');
    elements.forEach(el => {
      el.addEventListener('mouseenter', onEnterLink);
      el.addEventListener('mouseleave', onLeaveLink);
    });

    return () => {
      document.removeEventListener('mousemove', onMove);
      elements.forEach(el => {
        el.removeEventListener('mouseenter', onEnterLink);
        el.removeEventListener('mouseleave', onLeaveLink);
      });
    };
  }, []);

  return (
    <>
      <div ref={dot} className="hidden md:block" style={{
        position: 'fixed', width: 8, height: 8,
        background: 'white', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 9999,
        transform: 'translate(-50%, -50%)',
        mixBlendMode: 'difference',
        willChange: 'transform',
      }} />
      <div ref={ring} className="hidden md:block" style={{
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

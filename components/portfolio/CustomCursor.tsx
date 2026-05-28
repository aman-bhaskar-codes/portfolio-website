'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const dot   = useRef<HTMLDivElement>(null);
  const ring  = useRef<HTMLDivElement>(null);
  const pos   = useRef({ x: 0, y: 0 });
  const ring_ = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      gsap.to(dot.current, {
        x: e.clientX, y: e.clientY,
        xPercent: -50, yPercent: -50,
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
      gsap.set(ring.current, { x: ring_.current.x, y: ring_.current.y, xPercent: -50, yPercent: -50 });
      requestAnimationFrame(animate);
    };
    animate();

    document.addEventListener('mousemove', onMove);
    
    // Support dynamically added elements by observing DOM or polling if necessary
    // A simpler approach is to attach the listeners initially, but since we are in Next.js,
    // we should re-attach when elements appear. For now, doing it initially as the spec had.
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
      <div ref={dot} style={{
        position: 'fixed', width: 8, height: 8, top: 0, left: 0,
        background: 'white', borderRadius: '50%',
        pointerEvents: 'none', zIndex: 9999,
        mixBlendMode: 'difference',
        willChange: 'transform',
      }} />
      <div ref={ring} style={{
        position: 'fixed', width: 40, height: 40, top: 0, left: 0,
        border: '1px solid rgba(255,255,255,0.35)',
        borderRadius: '50%', pointerEvents: 'none',
        zIndex: 9998,
        willChange: 'transform',
      }} />
    </>
  );
}

'use client'
import { useEffect, useRef } from 'react'

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf: number
    let tx = 0, ty = 0, cx = 0, cy = 0

    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY }
    window.addEventListener('mousemove', onMove)

    const animate = () => {
      cx += (tx - cx) * 0.08
      cy += (ty - cy) * 0.08
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${cx - 200}px, ${cy - 200}px)`
      }
      raf = requestAnimationFrame(animate)
    }
    animate()

    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [])

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed', zIndex: 0,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,109,240,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', top: 0, left: 0,
        willChange: 'transform',
      }}
    />
  )
}

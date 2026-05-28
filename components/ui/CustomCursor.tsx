'use client'

import { useEffect, useRef, useCallback } from 'react'

export function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const posRef  = useRef({ x: -100, y: -100 })
  const ringPos = useRef({ x: -100, y: -100 })
  const visible = useRef(false)

  const show = useCallback(() => {
    if (visible.current) return
    visible.current = true
    if (dotRef.current)  dotRef.current.style.opacity  = '1'
    if (ringRef.current) ringRef.current.style.opacity = '1'
  }, [])

  const hide = useCallback(() => {
    visible.current = false
    if (dotRef.current)  dotRef.current.style.opacity  = '0'
    if (ringRef.current) ringRef.current.style.opacity = '0'
  }, [])

  useEffect(() => {
    // Skip custom cursor on touch devices
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      document.documentElement.style.cursor = 'auto'
      return
    }

    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const onMove = (e: MouseEvent) => {
      show()
      posRef.current = { x: e.clientX, y: e.clientY }
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`
    }

    const onLeave = () => hide()
    const onEnter = () => show()

    // Use event delegation for hover state — works with dynamically rendered elements
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('a, button, [data-cursor], input, textarea, select')) {
        document.body.classList.add('cursor-hover')
      }
    }
    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('a, button, [data-cursor], input, textarea, select')) {
        document.body.classList.remove('cursor-hover')
      }
    }

    // Lerp ring to dot position
    let rafId: number
    const lerp = () => {
      ringPos.current.x += (posRef.current.x - ringPos.current.x) * 0.12
      ringPos.current.y += (posRef.current.y - ringPos.current.y) * 0.12
      ring.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px) translate(-50%, -50%)`
      rafId = requestAnimationFrame(lerp)
    }
    rafId = requestAnimationFrame(lerp)

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)
    document.addEventListener('mouseover', onMouseOver)
    document.addEventListener('mouseout', onMouseOut)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      document.removeEventListener('mouseover', onMouseOver)
      document.removeEventListener('mouseout', onMouseOut)
      cancelAnimationFrame(rafId)
    }
  }, [show, hide])

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  style={{ opacity: 0 }} />
      <div ref={ringRef} className="cursor-ring" style={{ opacity: 0 }} />
    </>
  )
}

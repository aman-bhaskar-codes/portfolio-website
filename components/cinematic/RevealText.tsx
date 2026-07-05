'use client'

import { useRef, useEffect, type ElementType, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SplitType from 'split-type'

gsap.registerPlugin(ScrollTrigger)

interface RevealTextProps {
  children: ReactNode
  as?: ElementType
  className?: string
  /** 'lines' for headline masks, 'words' for paragraph drift */
  split?: 'lines' | 'words'
  delay?: number
  /** if true, plays immediately instead of on scroll */
  immediate?: boolean
}

export function RevealText({
  children,
  as: Tag = 'div',
  className,
  split = 'lines',
  delay = 0,
  immediate = false,
}: RevealTextProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const splitInstance = new SplitType(el as HTMLElement, {
      types: split === 'lines' ? 'lines' : 'words',
      tagName: 'span',
    })

    const targets = split === 'lines' ? splitInstance.lines : splitInstance.words
    if (!targets || targets.length === 0) return

    if (split === 'lines') {
      targets.forEach(line => {
        const wrapper = document.createElement('span')
        wrapper.style.display = 'block'
        wrapper.style.overflow = 'hidden'
        line.parentNode?.insertBefore(wrapper, line)
        wrapper.appendChild(line)
      })
    }

    gsap.set(targets, {
      yPercent: split === 'lines' ? 110 : 0,
      opacity: split === 'lines' ? 1 : 0,
      y: split === 'words' ? 24 : undefined,
    })

    const tween = gsap.to(targets, {
      yPercent: 0,
      y: 0,
      opacity: 1,
      duration: split === 'lines' ? 1.1 : 0.7,
      stagger: split === 'lines' ? 0.09 : 0.02,
      ease: 'power4.out',
      delay,
      ...(immediate
        ? {}
        : {
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              once: true,
            },
          }),
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
      splitInstance.revert()
    }
  }, [split, delay, immediate])

  return (
    // @ts-expect-error dynamic tag ref
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}

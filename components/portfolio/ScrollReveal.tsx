"use client";

import { useScrollReveal } from "@/lib/motion";
import { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}

export function ScrollReveal({ children, className = "", delay = 0, threshold = 0.08 }: ScrollRevealProps) {
  const { ref, isInView } = useScrollReveal(threshold);

  return (
    <div
      ref={ref}
      className={`rv ${isInView ? 'on' : ''} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

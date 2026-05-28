"use client";

import { useCountUp, useScrollReveal } from "@/lib/motion";

interface StatItemProps {
  end: number;
  label: string;
  suffix?: string;
  delay?: number;
}

function StatItem({ end, label, suffix = "", delay = 0 }: StatItemProps) {
  const { ref, isInView } = useScrollReveal(0.5);
  const count = useCountUp(end, 1600, isInView);

  return (
    <div 
      ref={ref}
      className={`bg-black py-14 px-8 text-center rv ${isInView ? 'on' : ''}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      <span className="font-['Bebas_Neue'] text-[clamp(3rem,5vw,6rem)] leading-none block mb-2">
        {count}{suffix}
      </span>
      <span className="text-[0.7rem] tracking-[0.2em] uppercase text-white/30 block">
        {label}
      </span>
    </div>
  );
}

export function Stats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-[1px] bg-white/5 border-t border-b border-white/10">
      <StatItem end={20} suffix="+" label="Projects Built" delay={0} />
      <StatItem end={22} label="Docker Services" delay={0.1} />
      <StatItem end={100} suffix="%" label="Local AI — Zero Cost" delay={0.2} />
      <StatItem end={5} label="Years Coding" delay={0.3} />
    </div>
  );
}

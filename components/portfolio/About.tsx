import { ScrollReveal } from './ScrollReveal'

export default function About() {
  return (
    <section id="about" className="sec">
      <ScrollReveal>
        <p className="sec-label">The story</p>
      </ScrollReveal>
      <ScrollReveal delay={0.15}>
        <p className="max-w-[880px] text-[clamp(1.35rem,2.2vw,2.2rem)] leading-[1.55] font-normal text-white/60">
          My journey started <strong className="text-white font-bold">obsessing over systems that think.</strong> Not just code that runs — but intelligence that <strong className="text-white font-bold">adapts, learns, and improves itself every single week.</strong> I built a portfolio that classifies every visitor before they say a word. A RAG pipeline that finds the exact answer in 140ms. A digital twin that speaks in my voice with real opinions and honest uncertainty. <strong className="text-white font-bold">This is what I build:</strong> living systems, not demos. Autonomous intelligence, not chatbots.
        </p>
      </ScrollReveal>
    </section>
  )
}

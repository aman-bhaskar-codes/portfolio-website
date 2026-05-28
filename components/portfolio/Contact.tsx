import { ScrollReveal } from './ScrollReveal'

export default function Contact() {
  return (
    <>
      <section id="contact" className="min-h-screen flex flex-col justify-center items-center text-center py-[4rem] px-[3rem] border-t border-white/10">
        <div>
          <ScrollReveal>
            <p className="sec-label">Let's connect</p>
          </ScrollReveal>
          <ScrollReveal>
            <h2 className="font-['Bebas_Neue'] text-[clamp(6rem,15vw,19rem)] leading-[0.85] tracking-[-0.01em] relative mb-[2.5rem] after:content-[attr(data-t)] after:absolute after:left-0 after:top-[0.04em] after:w-full after:text-transparent after:[-webkit-text-stroke:1px_rgba(255,255,255,0.05)] after:pointer-events-none text-white" data-t="LET'S BUILD">
              LET'S<br/>BUILD
            </h2>
          </ScrollReveal>
        </div>
        <ScrollReveal delay={0.15} className="flex justify-center gap-[2.5rem] flex-wrap mb-[1.5rem]">
          <a href="https://github.com/aman-bhaskar-codes" target="_blank" rel="noreferrer" className="text-white/35 no-underline text-[0.78rem] font-semibold tracking-[0.15em] uppercase transition-colors hover:text-white">GitHub</a>
          <a href="https://www.linkedin.com/in/aman-bhaskar-18jan2005/" target="_blank" rel="noreferrer" className="text-white/35 no-underline text-[0.78rem] font-semibold tracking-[0.15em] uppercase transition-colors hover:text-white">LinkedIn</a>
          <a href="https://x.com/_aman_bhaskar" target="_blank" rel="noreferrer" className="text-white/35 no-underline text-[0.78rem] font-semibold tracking-[0.15em] uppercase transition-colors hover:text-white">Twitter / X</a>
          <a href="https://www.instagram.com/mr.aman.bhaskar/" target="_blank" rel="noreferrer" className="text-white/35 no-underline text-[0.78rem] font-semibold tracking-[0.15em] uppercase transition-colors hover:text-white">Instagram</a>
          <a href="mailto:amanbhaskarcodes@gmail.com" className="text-white/35 no-underline text-[0.78rem] font-semibold tracking-[0.15em] uppercase transition-colors hover:text-white">Email</a>
        </ScrollReveal>
        <ScrollReveal delay={0.25}>
          <p className="text-[0.8rem] tracking-[0.08em] mt-[0.5rem] text-white/20">
            amanbhaskarcodes@gmail.com
          </p>
        </ScrollReveal>
      </section>

      <footer className="px-[3rem] py-[1.8rem] flex justify-between items-center border-t border-white/10 text-[0.7rem] text-white/20 tracking-[0.08em] flex-col md:flex-row gap-3 text-center">
        <span>© 2026 AMAN BHASKAR</span>
        <span className="tracking-[0.05em]">Full-Stack Developer & AI Engineer</span>
        <a href="https://github.com/aman-bhaskar-codes/portfolio-website" target="_blank" rel="noreferrer" className="text-white/25 no-underline transition-colors hover:text-white/60">
          Source on GitHub
        </a>
      </footer>
    </>
  )
}

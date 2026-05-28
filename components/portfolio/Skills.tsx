import { ScrollReveal } from './ScrollReveal'

export default function Skills() {
  return (
    <>
      <section id="skills" className="sec-sm">
        <ScrollReveal className="flex justify-between items-end mb-[3.5rem]">
          <div>
            <p className="sec-label">What I use</p>
            <h2 className="sec-title" data-t="Tech Stack">
              Tech<br />Stack
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/5 mt-[3.5rem]">
          <div className="bg-black p-[2.8rem_2.4rem] border border-white/5">
            <div className="font-['Bebas_Neue'] text-[2.4rem] tracking-[0.04em] mb-[1.8rem]">Frontend</div>
            <ul className="list-none">
              {['Next.js 14 / App Router', 'TypeScript', 'Three.js / WebGL', 'Tailwind CSS', 'Framer Motion / GSAP'].map(s => (
                <li key={s} className="text-[0.87rem] text-white/40 py-[0.65rem] border-b border-white/5 tracking-[0.04em] transition-all duration-250 hover:text-white/90 hover:pl-[0.5rem]">{s}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-black p-[2.8rem_2.4rem] border border-white/5">
            <div className="font-['Bebas_Neue'] text-[2.4rem] tracking-[0.04em] mb-[1.8rem]">Backend / AI</div>
            <ul className="list-none">
              {['FastAPI / 8 uvicorn workers', 'LangGraph / Multi-agent', 'Ollama / 100% local LLMs', 'DSPy / Self-optimization', 'Python / Node.js'].map(s => (
                <li key={s} className="text-[0.87rem] text-white/40 py-[0.65rem] border-b border-white/5 tracking-[0.04em] transition-all duration-250 hover:text-white/90 hover:pl-[0.5rem]">{s}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-black p-[2.8rem_2.4rem] border border-white/5">
            <div className="font-['Bebas_Neue'] text-[2.4rem] tracking-[0.04em] mb-[1.8rem]">Infrastructure</div>
            <ul className="list-none">
              {['PostgreSQL / pgvector', 'Redis Stack', 'Qdrant Vector DB', 'Docker / 22 services', 'Cloudflare / Nginx'].map(s => (
                <li key={s} className="text-[0.87rem] text-white/40 py-[0.65rem] border-b border-white/5 tracking-[0.04em] transition-all duration-250 hover:text-white/90 hover:pl-[0.5rem]">{s}</li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </section>

      <ScrollReveal className="py-[4rem] px-[3rem] border-t border-b border-white/10" delay={0.15}>
        <p className="sec-label">Technologies & Platforms</p>
        <div className="flex gap-[3rem] flex-wrap items-center mt-[2rem]">
          {['llama3.2:3b', 'phi4-mini', 'qwen2.5', 'nomic-embed', 'ColBERT', 'LangFuse', 'Prometheus', 'Grafana', 'Temporal', 'Docling'].map(b => (
            <span key={b} className="text-[0.78rem] font-semibold tracking-[0.12em] uppercase text-white/20 transition-colors duration-300 hover:text-white/70">
              {b}
            </span>
          ))}
        </div>
      </ScrollReveal>
    </>
  )
}

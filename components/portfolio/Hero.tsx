export default function Hero() {
  return (
    <section className="min-h-screen px-6 pb-16 md:px-12 md:pb-20 flex flex-col justify-end">
      <p className="text-[0.82rem] font-medium tracking-[0.18em] uppercase text-white/40 mb-3 opacity-0 animate-[fuIn_0.9s_ease_0.15s_forwards]">
        Hello world. I build things that think.
      </p>
      
      <div>
        <div className="overflow-hidden leading-[0.88]">
          <span 
            className="font-['Bebas_Neue'] text-[clamp(17vw,22vw,28vw)] md:text-[clamp(13vw,18vw,22vw)] tracking-[-0.01em] block relative translate-y-[108%] animate-[slideUp_0.9s_cubic-bezier(0.16,1,0.3,1)_forwards] [animation-delay:0.2s] after:content-[attr(data-t)] after:absolute after:left-[0.04em] after:top-[0.04em] after:text-transparent after:[-webkit-text-stroke:1px_rgba(255,255,255,0.07)] after:pointer-events-none"
            data-t="AMAN"
          >
            AMAN
          </span>
        </div>
        <div className="overflow-hidden leading-[0.88]">
          <span 
            className="font-['Bebas_Neue'] text-[clamp(17vw,22vw,28vw)] md:text-[clamp(13vw,18vw,22vw)] tracking-[-0.01em] block relative translate-y-[108%] animate-[slideUp_0.9s_cubic-bezier(0.16,1,0.3,1)_forwards] [animation-delay:0.38s] after:content-[attr(data-t)] after:absolute after:left-[0.04em] after:top-[0.04em] after:text-transparent after:[-webkit-text-stroke:1px_rgba(255,255,255,0.07)] after:pointer-events-none"
            data-t="BHASKAR"
          >
            BHASKAR
          </span>
        </div>
      </div>
      
      <p className="max-w-[460px] text-[0.93rem] leading-[1.75] text-white/40 mt-[2.2rem] opacity-0 animate-[fuIn_1s_ease_0.9s_forwards]">
        Full-Stack Developer & AI Engineer building autonomous systems that don't just display code — they think, adapt, and advocate. Every project is a living intelligence, not just an interface.
      </p>
      
      <div className="flex gap-8 mt-[1.8rem] opacity-0 animate-[fuIn_1s_ease_1.1s_forwards]">
        <a 
          href="#contact" 
          className="text-white no-underline text-[0.83rem] font-semibold tracking-[0.06em] pb-[3px] border-b border-white/60 hover:border-white opacity-100 transition-all"
        >
          Let's build →
        </a>
        <a 
          href="https://github.com/aman-bhaskar-codes" 
          target="_blank"
          rel="noreferrer"
          className="text-white no-underline text-[0.83rem] font-semibold tracking-[0.06em] pb-[3px] border-b border-white/20 hover:border-white opacity-75 hover:opacity-100 transition-all"
        >
          Explore GitHub
        </a>
      </div>
    </section>
  )
}

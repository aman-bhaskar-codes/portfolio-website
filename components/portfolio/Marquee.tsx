"use client";

const techs = [
  { t: 'Next.js 14', hi: true },
  { t: 'FastAPI', hi: false },
  { t: 'LangGraph', hi: true },
  { t: 'Three.js', hi: false },
  { t: 'Python', hi: true },
  { t: 'Qdrant', hi: false },
  { t: 'Redis', hi: true },
  { t: 'PostgreSQL', hi: false },
  { t: 'Docker', hi: true },
  { t: 'Ollama', hi: false },
  { t: 'DSPy', hi: true },
  { t: 'ColBERT', hi: false },
  { t: 'TypeScript', hi: true },
  { t: 'RAG Pipeline', hi: false },
  { t: 'Nginx', hi: true }
];

export function Marquee() {
  // Duplicate array 4 times for infinite scrolling effect
  const items = [...techs, ...techs, ...techs, ...techs];

  return (
    <div className="mq-wrap">
      <div className="mq-track">
        {items.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className={`mq-item ${item.hi ? 'hi' : ''}`}>{item.t}</span>
            <span className="mq-sep">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

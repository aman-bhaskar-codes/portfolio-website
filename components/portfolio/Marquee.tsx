'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const ITEMS = [
  { text: 'Next.js 14', dim: false },
  { text: 'FastAPI',    dim: true  },
  { text: 'LangGraph',  dim: false },
  { text: 'Three.js',   dim: true  },
  { text: 'Python',     dim: false },
  { text: 'Qdrant',     dim: true  },
  { text: 'Redis',      dim: false },
  { text: 'Docker',     dim: true  },
  { text: 'Ollama',     dim: false },
  { text: 'DSPy',       dim: true  },
  { text: 'ColBERT',    dim: false },
  { text: 'TypeScript', dim: true  },
  { text: 'RAG Pipeline', dim: false },
  { text: 'pgvector',   dim: true  },
];

export function Marquee({ reverse = false }: { reverse?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current!;
    const width = track.scrollWidth / 2; // half because we duplicate

    gsap.to(track, {
      x: reverse ? `+=${width}` : `-=${width}`,
      duration: reverse ? 35 : 30,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize(
          reverse
            ? (x: string | number) => (parseFloat(String(x)) % width)
            : (x: string | number) => (parseFloat(String(x)) % -width)
        ),
      },
    });
  }, [reverse]);

  const all = [...ITEMS, ...ITEMS]; // duplicate for seamless loop

  return (
    <div style={{
      overflow: 'hidden',
      padding: '1.3rem 0',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div ref={trackRef} style={{ display: 'flex', width: 'max-content', willChange: 'transform' }}>
        {all.map((item, i) => (
          <span key={i} style={{
            fontSize: '0.75rem', fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            padding: '0 2rem', whiteSpace: 'nowrap',
            color: item.dim ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.65)',
          }}>
            {item.text}
            <span style={{ marginLeft: '2rem', color: 'rgba(255,255,255,0.12)' }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

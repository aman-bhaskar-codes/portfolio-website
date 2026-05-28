// Central data store — single source of truth for all sections

export const OWNER = {
  name:       'Aman Bhaskar',
  title:      'Full-Stack Developer & AI Engineer',
  born:       '2005-01-18',
  location:   'Baraut, Uttar Pradesh, India',
  available:  true,
  email:      'amanbhaskarcodes@gmail.com',
  github:     'https://github.com/aman-bhaskar-codes',
  linkedin:   'https://linkedin.com/in/aman-bhaskar-18jan2005/',
  twitter:    'https://x.com/_aman_bhaskar',
  instagram:  'https://instagram.com/mr.aman.bhaskar',
}

export const PROJECTS = [
  {
    id: 'agentic-portfolio',
    title: 'Agentic Portfolio OS',
    subtitle: 'Digital Twin v4 — GENESIS BUILD',
    description:
      'A fully autonomous, self-aware intelligence layer. 5-stage RAG with ColBERT. Visitor persona classification. Digital Twin voice engine. $0 cloud cost. 100% Ollama.',
    tags: ['LangGraph', 'RAG', 'Next.js 14', 'FastAPI', 'Ollama', 'Three.js'],
    stats: {
      versions: 4,
      services: 22,
      modules:  48,
      cloudCost: '$0',
    },
    status: 'Production',
    year: '2025',
  },
  // Add your other projects here
]

export const SKILLS = {
  frontend:  ['Next.js 14', 'React', 'TypeScript', 'Tailwind CSS', 'Three.js', 'Framer Motion'],
  backend:   ['FastAPI', 'Python 3.12', 'Node.js', 'WebSocket'],
  ai:        ['LangGraph', 'LangChain', 'Ollama', 'DSPy', 'ColBERT', 'RAG', 'LangFuse'],
  data:      ['Qdrant', 'PostgreSQL', 'pgvector', 'Redis Stack', 'BM25'],
  infra:     ['Docker', 'Docker Compose', 'Nginx', 'Cloudflare', 'Prometheus', 'Grafana', 'Temporal', 'Celery'],
  llms:      ['llama3.2:3b', 'phi4-mini', 'qwen2.5:3b', 'nomic-embed-text', 'mxbai-rerank-large', 'llava:7b'],
}

export const CAPABILITIES = [
  'Digital Twin Engine — phi4-mini, Persona Adaptation, Voice Engine',
  '5-Stage RAG — HyDE → Dense → Sparse → RRF → ColBERT',
  'Visitor Intelligence — Persona Classifier, IP Resolution, Signal Weighting',
  '3-Tier Memory — Redis Working, PostgreSQL Episodic, Qdrant Long-Term',
  'DSPy Self-Optimization — MIPROv2, weekly auto-prompt improvement',
  'Voice Agent — STT/TTS WebSocket, 100% local pipeline',
]

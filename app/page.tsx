import { HeroSection }          from '@/components/sections/Hero'
import { Section }              from '@/components/layout/Section'
import { ProjectCard, Project } from '@/components/projects/ProjectCard'
import { ChatWindow }           from '@/components/chat/ChatWindow'
import { SkillsConstellation }  from '@/components/skills/SkillsConstellation'
import { SystemStatus }         from '@/components/system/SystemStatus'
import { Navbar }               from '@/components/nav/Navbar'

const PROJECTS: Project[] = [
  {
    title: 'Digital Twin Engine',
    description: 'Persona-adaptive AI that responds as Aman — with real opinions, honest uncertainty, and project-grounded answers. Not a chatbot.',
    tags: ['LangGraph', 'phi4-mini', 'DSPy', 'RAG'],
    status: 'live',
    metrics: '< 200ms TTFT · 5-stage ColBERT retrieval',
    accent: '#7c6df0',
  },
  {
    title: '5-Stage RAG Pipeline',
    description: 'HyDE → Dense → Sparse → RRF Fusion → ColBERT reranking. The most precise retrieval architecture in any portfolio on earth.',
    tags: ['Qdrant', 'BM25', 'ColBERT', 'nomic-embed'],
    status: 'live',
    metrics: 'Top-5 precision from 100k+ chunks',
    accent: '#f59e0b',
  },
  {
    title: 'Visitor Intelligence Pipeline',
    description: 'Classifies every visitor into recruiter/engineer/founder/manager before they type a word. Adapts the entire experience in real-time.',
    tags: ['IP Resolution', 'MaxMind', 'UTM Analysis', 'Persona ML'],
    status: 'live',
    metrics: '0.87 confidence on referrer signals',
    accent: '#06b6d4',
  },
  {
    title: 'DSPy Self-Optimizer',
    description: 'MIPROv2 runs every Sunday night. Real conversation data drives prompt evolution. Zero human intervention. System improves weekly.',
    tags: ['DSPy', 'MIPROv2', 'Celery', 'Temporal'],
    status: 'live',
    metrics: 'Automated Sunday 1am optimization',
    accent: '#22c55e',
  },
]

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />

        {/* Architecture Overview */}
        <Section
          id="architecture"
          eyebrow="// 002 — Architecture"
          title="22 services. 48 Python modules. One command."
          subtitle="The most over-engineered portfolio on earth — by design. Every component justified."
          accent
        >
          <SystemStatus />
          {/* Architecture diagram goes here — Three.js constellation or SVG */}
        </Section>

        {/* Projects */}
        <Section
          id="projects"
          eyebrow="// 003 — Projects"
          title="What I've Built"
          subtitle="Engineered systems, not just implemented features."
        >
          <div className="projects-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {PROJECTS.map(project => (
              <ProjectCard key={project.title} {...project} />
            ))}
          </div>
        </Section>

        {/* Skills */}
        <SkillsConstellation />

        {/* Chat */}
        <Section
          id="chat"
          eyebrow="// 006 — Digital Twin"
          title="Talk to my digital self."
          subtitle="Not a FAQ bot. An AI that knows every commit, every tradeoff, every opinion I have. Ask it anything."
          accent
        >
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <ChatWindow />
          </div>
        </Section>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '48px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
            © 2025 Aman Bhaskar · amanbhaskarcodes@gmail.com
            · Built with Next.js 14, Local AI, and too much ambition.
          </p>
        </div>
      </footer>
    </>
  )
}

'use client'

const LINKS = [
  {
    label: 'GitHub',
    href: 'https://github.com/aman-bhaskar-codes',
    desc: 'Source code + project history',
    iconPath: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z',
    fill: true,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/aman-bhaskar-18jan2005/',
    desc: 'Professional profile',
    iconPath: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    fill: true,
  },
  {
    label: 'Email',
    href: 'mailto:amanbhaskarcodes@gmail.com',
    desc: 'amanbhaskarcodes@gmail.com',
    iconPath: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    fill: false,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/mr.aman.bhaskar/',
    desc: '@mr.aman.bhaskar',
    iconPath: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
    fill: true,
  },
]

export default function Contact() {
  return (
    <section id="contact" className="py-24 px-6 bg-bg-secondary/30">
      <div className="max-w-4xl mx-auto text-center">
        <div className="text-accent-primary font-mono text-sm mb-4">05. contact</div>
        <h2
          className="text-4xl font-bold text-text-primary mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Let&apos;s build together.
        </h2>
        <p className="text-text-secondary max-w-xl mx-auto mb-12 leading-relaxed">
          Open to remote opportunities in AI engineering, LLM infrastructure, and full-stack development.
          Response within 24 hours.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
          {LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('mailto') ? undefined : '_blank'}
              rel={link.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
              className="flex items-center gap-3 p-4 bg-bg-card rounded-xl border border-bg-border hover:border-accent-primary/40 hover:bg-bg-card/80 transition-all group text-left"
            >
              <div className="text-text-muted group-hover:text-accent-primary transition-colors">
                <svg className="w-5 h-5" fill={link.fill ? 'currentColor' : 'none'} stroke={link.fill ? 'none' : 'currentColor'} strokeWidth={link.fill ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d={link.iconPath} fillRule={link.fill ? 'evenodd' : undefined} clipRule={link.fill ? 'evenodd' : undefined} />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-text-primary">{link.label}</div>
                <div className="text-xs text-text-muted font-mono">{link.desc}</div>
              </div>
            </a>
          ))}
        </div>

        <div className="text-text-muted font-mono text-xs">
          Built with Next.js · Ollama · RAG · Zero cloud spend
          <br />
          <span className="text-text-muted/60">© 2025 Aman Bhaskar</span>
        </div>
      </div>
    </section>
  )
}

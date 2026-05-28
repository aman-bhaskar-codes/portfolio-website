'use client'

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-8 max-w-[1400px]
      mx-auto px-6 md:px-10"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center
        justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <span className="font-display text-xs font-800 text-text1 tracking-wider">AB</span>
          <div className="h-3 w-px bg-[var(--border)]" />
          <span className="font-mono text-[10px] text-text3">
            © {new Date().getFullYear()} Aman Bhaskar
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-ai-pulse" />
            <span className="font-mono text-[10px] text-text3">Digital Twin Online</span>
          </div>
          <div className="h-3 w-px bg-[var(--border)]" />
          <span className="font-mono text-[10px] text-text3">100% local AI · $0 cloud cost</span>
          <div className="h-3 w-px bg-[var(--border)]" />
          <span className="font-mono text-[10px] text-text3">Built with ❤️ in India</span>
        </div>
      </div>
    </footer>
  )
}

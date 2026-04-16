export default function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`bg-[var(--glass-soft)] border border-[var(--border-soft)] rounded-[var(--radius-xl)] p-6 hover:bg-[var(--glass-strong)] transition-all duration-300 ${className}`}>
            {children}
        </div>
    );
}

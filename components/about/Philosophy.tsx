"use client";

import { motion } from "framer-motion";

const principles = [
    {
        title: "Deterministic by Default",
        desc: "Every system should produce predictable, reproducible outputs. Stochastic elements are isolated and controlled.",
    },
    {
        title: "Observable & Debuggable",
        desc: "If you can't trace it, you can't trust it. Full observability from prompt to response, every layer logged.",
    },
    {
        title: "Self-Healing Architecture",
        desc: "Systems degrade gracefully and recover autonomously. Fallbacks aren't optional — they're first-class citizens.",
    },
];

export default function Philosophy() {
    return (
        <section className="py-32 px-6 relative overflow-hidden">
            <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-purple-900/10 blur-[140px] rounded-full pointer-events-none" />

            <div className="max-w-5xl mx-auto space-y-16 relative z-10">
                <div className="text-center space-y-6">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">
                        // Mindset
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                        Engineering Philosophy
                    </h2>
                    <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed font-light">
                        I believe AI systems should be deterministic, observable,
                        self-healing, and production-safe. Innovation without stability
                        is fragile. My focus is building systems that scale,
                        not demos that break.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {principles.map((p, i) => (
                        <motion.div
                            key={p.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                            className="p-8 rounded-[var(--radius-xl)] bg-[var(--glass)] border border-[var(--border-soft)] space-y-4 hover:border-[var(--accent-core)] transition-colors duration-500"
                        >
                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-mono font-bold text-sm">
                                {String(i + 1).padStart(2, "0")}
                            </div>
                            <h3 className="text-lg font-bold text-white">{p.title}</h3>
                            <p className="text-sm text-neutral-400 leading-relaxed">{p.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}


"use client";

import { motion } from "framer-motion";

const milestones = [
    {
        year: "2021",
        title: "10th — UP Board",
        text: "Completed high school education. First exposure to programming and computational thinking.",
    },
    {
        year: "2023",
        title: "12th — UP Board",
        text: "Completed intermediate education. Deepened focus on mathematics and logical reasoning. Self-taught web development fundamentals.",
    },
    {
        year: "2025",
        title: "B.Tech CSE — AKTU University",
        text: "Began Computer Science & Engineering at AKTU. Focused specialization in AI systems, LLM engineering, and autonomous architectures.",
    },
    {
        year: "2025+",
        title: "Architect Phase",
        text: "Building production-grade agentic AI systems, graph-aware RAG pipelines, multi-agent orchestration, and intelligent memory architectures.",
    },
];

export default function Timeline() {
    return (
        <section className="py-32 px-6 relative">
            <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-4xl mx-auto space-y-16 relative z-10">
                <div className="text-center space-y-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">
                        // Academic Journey
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                        Timeline
                    </h2>
                </div>

                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[23px] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--accent-core)]/40 via-white/10 to-transparent" />

                    <div className="space-y-12">
                        {milestones.map((item, i) => (
                            <motion.div
                                key={item.year}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-8 items-start group"
                            >
                                {/* Dot */}
                                <div className="relative shrink-0">
                                    <div className="w-[10px] h-[10px] rounded-full bg-[var(--accent-core)] mt-2 ring-4 ring-[var(--accent-core)]/10 group-hover:ring-[var(--accent-core)]/30 transition-all" />
                                </div>

                                <div className="space-y-2 pb-2">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-mono font-bold text-[var(--text-core-primary)]">{item.year}</span>
                                        <span className="text-xs font-mono text-[var(--text-core-muted)] uppercase tracking-wider">{item.title}</span>
                                    </div>
                                    <p className="text-neutral-400 leading-relaxed">{item.text}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

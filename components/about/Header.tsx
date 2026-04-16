
"use client";

import { motion } from "framer-motion";

export default function AboutHeader() {
    return (
        <section className="pt-40 pb-24 relative overflow-hidden">
            {/* Background atmosphere */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/10 blur-[160px] rounded-full pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10 px-6">
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block text-xs font-mono uppercase tracking-[0.5em] text-accent"
                >
                    // Identity
                </motion.span>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.8 }}
                    className="text-6xl md:text-8xl font-black tracking-tighter text-white"
                >
                    Aman <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">Bhaskar</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.8 }}
                    className="text-lg md:text-xl text-accent/80 font-semibold tracking-wide"
                >
                    Autonomous Systems Architect
                </motion.p>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.8 }}
                    className="text-sm md:text-base text-neutral-500 font-medium tracking-wider uppercase"
                >
                    Agentic AI & LLM Infrastructure Engineer
                </motion.p>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.8 }}
                    className="text-base md:text-lg text-neutral-400 font-light leading-relaxed max-w-2xl mx-auto"
                >
                    Autonomous Systems Architect focused on designing intelligent, self-evolving AI infrastructures powered by graph-aware retrieval, memory systems, and multi-agent orchestration. Currently pursuing B.Tech CSE at AKTU University (2025–2029).
                </motion.p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-center gap-8 pt-8"
                >
                    {[
                        { label: "Focus", value: "Autonomous AI" },
                        { label: "Program", value: "B.Tech CSE" },
                        { label: "Approach", value: "Systems Architect" },
                    ].map((item) => (
                        <div key={item.label} className="text-center">
                            <p className="text-sm font-bold text-white">{item.value}</p>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 mt-1">{item.label}</p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

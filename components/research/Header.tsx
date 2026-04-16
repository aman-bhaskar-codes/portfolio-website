"use client";

import { motion } from "framer-motion";

export default function ResearchHeader() {
    return (
        <section className="pt-40 pb-24 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-900/15 blur-[160px] rounded-full pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10 px-6">
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block text-xs font-mono uppercase tracking-[0.5em] text-accent"
                >
                    // Thought Leadership
                </motion.span>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.8 }}
                    className="text-6xl md:text-8xl font-black tracking-tighter text-white"
                >
                    Research{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                        & Notes
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-xl md:text-2xl text-neutral-400 font-light leading-relaxed max-w-2xl mx-auto"
                >
                    Technical explorations into RAG systems, agentic architectures,
                    and scalable AI infrastructure.
                </motion.p>
            </div>
        </section>
    );
}

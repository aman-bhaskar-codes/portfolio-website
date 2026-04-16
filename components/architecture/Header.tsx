"use client";

import { motion } from "framer-motion";

export default function ArchitectureHeader() {
    return (
        <section className="pt-40 pb-24 relative overflow-hidden">
            {/* Background grid + glow */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-purple-900/15 blur-[160px] rounded-full pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10 px-6">
                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block text-xs font-mono uppercase tracking-[0.5em] text-accent"
                >
                    // Systems Engineering
                </motion.span>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.8 }}
                    className="text-6xl md:text-8xl font-black tracking-tighter text-white"
                >
                    System{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        Architecture
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-xl md:text-2xl text-neutral-400 font-light leading-relaxed max-w-2xl mx-auto"
                >
                    A production-grade AI-native portfolio platform built with modular,
                    scalable, and observable infrastructure.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-panel border border-white/10"
                >
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                        All Systems Operational
                    </span>
                </motion.div>
            </div>
        </section>
    );
}

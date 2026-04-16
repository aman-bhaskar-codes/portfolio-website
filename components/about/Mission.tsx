
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Mission() {
    return (
        <section className="py-40 px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-accent/5 to-transparent pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center relative z-10 space-y-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">
                        // Current Focus
                    </span>
                    <h2 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight">
                        What I&apos;m Building
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                        {[
                            "Digital Twin Architectures",
                            "Autonomous Multi-Agent Systems",
                            "Graph-Based RAG Pipelines",
                            "Intelligent AI Memory Systems",
                        ].map((focus, i) => (
                            <motion.div
                                key={focus}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 + i * 0.08 }}
                                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.03] border border-white/5"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                <span className="text-sm text-neutral-300 font-medium">{focus}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row justify-center gap-6"
                >
                    <Link
                        href="/projects"
                        className="group px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 justify-center shadow-xl shadow-white/10"
                    >
                        See My Work
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                        href="/twin"
                        className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-medium text-lg hover:bg-white/10 transition-all flex items-center gap-2 justify-center"
                    >
                        Talk to My AI Twin
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

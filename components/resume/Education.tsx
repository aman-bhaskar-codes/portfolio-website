"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

export default function Education() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="space-y-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">// Education</span>
                    <h2 className="text-4xl font-bold tracking-tight text-white">Academic Foundation</h2>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="p-8 rounded-3xl bg-white/[0.02] border border-white/5"
                >
                    <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                            <GraduationCap className="text-accent" size={22} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white">Computer Science & Engineering</h3>
                            <p className="text-xs font-mono text-accent/70">B.Tech · 2022 – 2026</p>
                            <p className="text-sm text-neutral-400 leading-relaxed">
                                Core focus on algorithms, data structures, operating systems,
                                and distributed computing. Self-directed specialization in
                                AI/ML systems, NLP, and production software engineering.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

"use client";

import { motion } from "framer-motion";

export default function SystemOverview() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="max-w-3xl space-y-6">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">
                        // Overview
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                        High-Level Overview
                    </h2>
                    <p className="text-lg text-neutral-400 leading-relaxed font-light">
                        The platform integrates advanced RAG pipelines, incremental GitHub
                        synchronization, persistent memory, voice interaction layers,
                        and containerized deployment infrastructure. Each module is
                        independently scalable and production-safe.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                    {[
                        { num: "7", label: "Core Modules" },
                        { num: "21", label: "API Routes" },
                        { num: "<200ms", label: "Avg Latency" },
                        { num: "99.9%", label: "Uptime Target" },
                    ].map((stat) => (
                        <div key={stat.label} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                            <p className="text-3xl font-black text-white">{stat.num}</p>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mt-2">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

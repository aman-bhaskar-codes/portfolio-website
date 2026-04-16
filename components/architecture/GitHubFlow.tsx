"use client";

import { motion } from "framer-motion";
import { GitBranch, RefreshCw, FileCode, Database } from "lucide-react";

const flowSteps = [
    { icon: GitBranch, title: "Detect Updates", desc: "Compare pushed_at timestamps against last sync to identify modified repositories." },
    { icon: FileCode, title: "Selective Ingestion", desc: "Re-ingest only changed projects, avoiding full index rebuilds." },
    { icon: RefreshCw, title: "Summarize & Embed", desc: "Generate AI summaries and vector embeddings for new/updated code." },
    { icon: Database, title: "Update RAG Index", desc: "Upsert into ProjectKnowledge store, keeping the vector index fresh." },
];

export default function GitHubFlow() {
    return (
        <section className="py-32 px-6">
            <div className="max-w-6xl mx-auto space-y-16">
                <div className="max-w-3xl space-y-6">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">
                        // Data Pipeline
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                        Incremental GitHub Sync
                    </h2>
                    <p className="text-lg text-neutral-400 font-light leading-relaxed">
                        The system detects repository updates via pushed_at timestamps,
                        selectively re-ingests modified projects, re-generates summaries,
                        and refreshes RAG knowledge without rebuilding the entire index.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    {flowSteps.map((step, i) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="flex-1 relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4"
                        >
                            {/* Step number */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                    <step.icon className="text-accent" size={18} />
                                </div>
                                <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-wider">Step {i + 1}</span>
                            </div>
                            <h3 className="font-bold text-white text-sm">{step.title}</h3>
                            <p className="text-xs text-neutral-500 leading-relaxed">{step.desc}</p>

                            {/* Arrow connector (not on last) */}
                            {i < flowSteps.length - 1 && (
                                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-neutral-700 text-lg">→</div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

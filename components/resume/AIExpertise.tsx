"use client";

import { motion } from "framer-motion";
import { Brain, Cpu, Shield, Layers } from "lucide-react";

const domains = [
    {
        icon: Brain,
        title: "Advanced RAG Systems",
        desc: "Self-healing retrieval pipelines with caching, threshold filtering, context compression, and anti-hallucination guards.",
    },
    {
        icon: Cpu,
        title: "Agentic AI Platforms",
        desc: "Multi-step reasoning agents with tool use, safety guardrails, and autonomous decision-making capabilities.",
    },
    {
        icon: Layers,
        title: "Memory-Aware AI",
        desc: "3-tier memory architecture (session, episodic, knowledge) enabling context-aware, personalized AI interactions.",
    },
    {
        icon: Shield,
        title: "Production AI Safety",
        desc: "Anti-hallucination prompting, confidence scoring, rate limiting, observability, and graceful degradation patterns.",
    },
];

export default function AIExpertise() {
    return (
        <section className="py-24 px-6 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-900/10 blur-[140px] rounded-full pointer-events-none" />

            <div className="max-w-5xl mx-auto space-y-12 relative z-10">
                <div className="space-y-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">// Specialization</span>
                    <h2 className="text-4xl font-bold tracking-tight text-white">AI & Agentic Systems Expertise</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {domains.map((d, i) => (
                        <motion.div
                            key={d.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-accent/20 transition-all duration-500"
                        >
                            <div className="flex items-start gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                                    <d.icon className="text-accent" size={22} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-white">{d.title}</h3>
                                    <p className="text-sm text-neutral-400 leading-relaxed">{d.desc}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

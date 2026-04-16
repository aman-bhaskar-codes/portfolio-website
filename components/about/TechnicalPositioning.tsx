
"use client";

import { motion } from "framer-motion";
import { Brain, Server, Workflow, Zap } from "lucide-react";

const pillars = [
    {
        icon: Brain,
        title: "Autonomous AI Systems",
        desc: "Self-evolving agents with structured reasoning, tool use, memory persistence, and reflection-based learning loops.",
    },
    {
        icon: Server,
        title: "Graph-Aware RAG Engine",
        desc: "Multi-hop retrieval architectures with semantic chunking, context compression, and architectural knowledge weighting.",
    },
    {
        icon: Workflow,
        title: "Multi-Agent Orchestration",
        desc: "Coordinated agent pipelines with memory-driven reasoning, policy evaluation, and multi-model decision cascades.",
    },
    {
        icon: Zap,
        title: "Scalable AI Infrastructure",
        desc: "Production backends with streaming inference, containerized deployment, and low-latency vector retrieval.",
    },
];

export default function TechnicalPositioning() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-6xl mx-auto space-y-16">
                <div className="max-w-3xl space-y-6">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">
                        // Architecture
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                        Systems I Design
                    </h2>
                    <p className="text-lg text-neutral-400 leading-relaxed font-light">
                        I design intelligent AI infrastructures built around autonomous agent orchestration,
                        graph-aware retrieval, memory-driven reasoning, and scalable backend architectures.
                        Every system prioritizes architectural integrity and long-term evolution.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pillars.map((pillar, i) => (
                        <motion.div
                            key={pillar.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-accent/20 transition-all duration-500"
                        >
                            <div className="flex items-start gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                                    <pillar.icon className="text-accent" size={22} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-white">{pillar.title}</h3>
                                    <p className="text-sm text-neutral-400 leading-relaxed">{pillar.desc}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

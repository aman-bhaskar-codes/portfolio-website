"use client";

import { motion } from "framer-motion";
import { Monitor, Server, Brain, Database, Zap, Shield } from "lucide-react";

const layers = [
    {
        icon: Monitor,
        title: "Frontend",
        tech: "Next.js 16 + React 19",
        desc: "Server Components, Turbopack, 3D via R3F",
        color: "from-blue-500/20 to-blue-600/5",
    },
    {
        icon: Server,
        title: "API Layer",
        tech: "Next.js Route Handlers",
        desc: "RAG Engine, Auth, Analytics, Rate Limiting",
        color: "from-purple-500/20 to-purple-600/5",
    },
    {
        icon: Brain,
        title: "AI Layer",
        tech: "Ollama + Qwen 2.5",
        desc: "Local inference, embeddings, context fusion",
        color: "from-pink-500/20 to-pink-600/5",
    },
    {
        icon: Database,
        title: "Data Layer",
        tech: "PostgreSQL + pgvector",
        desc: "Relational data, vector indices, sessions",
        color: "from-green-500/20 to-green-600/5",
    },
    {
        icon: Zap,
        title: "Sync Layer",
        tech: "GitHub API + Cron",
        desc: "Incremental ingestion, code summarization",
        color: "from-yellow-500/20 to-yellow-600/5",
    },
    {
        icon: Shield,
        title: "Infrastructure",
        tech: "Docker + Nginx + SSL",
        desc: "Containerized, reverse-proxied, auto-deployed",
        color: "from-cyan-500/20 to-cyan-600/5",
    },
];

export default function ArchitectureDiagram() {
    return (
        <section className="py-32 px-6 relative overflow-hidden">
            <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-purple-900/10 blur-[140px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-16 relative z-10">
                <div className="text-center space-y-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">
                        // Infrastructure
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                        Architecture Diagram
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {layers.map((layer, i) => (
                        <motion.div
                            key={layer.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-accent/20 transition-all duration-500 overflow-hidden"
                        >
                            {/* Gradient background on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${layer.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="relative z-10 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                    <layer.icon className="text-accent" size={22} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{layer.title}</h3>
                                    <p className="text-xs font-mono text-accent/70 mt-1">{layer.tech}</p>
                                </div>
                                <p className="text-sm text-neutral-400 leading-relaxed">{layer.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Connection hint */}
                <div className="text-center">
                    <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">
                        ↕ All layers communicate via typed API contracts ↕
                    </p>
                </div>
            </div>
        </section>
    );
}

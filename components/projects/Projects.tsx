"use client";

import { motion } from "framer-motion";

const PROJECTS = [
    {
        title: "RepoMind",
        category: "Autonomous Agentic Architecture",
        description: "Multi-agent system designed to explore, analyze, and optimize large-scale GitHub repositories locally.",
        tags: ["typescript", "ollama", "agents"]
    },
    {
        title: "CogniBase",
        category: "Knowledge Synthesis Engine",
        description: "Distributed knowledge synthesis engine that uses RAG to provide persistent brains for documentation.",
        tags: ["prisma", "pgvector", "redis"]
    },
    {
        title: "LuxuryAI",
        category: "Premium Identity Platform",
        description: "A world-class digital identity platform focusing on high-end visuals and local LLM orchestration.",
        tags: ["react-three-fiber", "framer-motion", "luxury"]
    }
];

export default function Projects() {
    return (
        <section id="projects" className="py-60 relative overflow-hidden bg-bg-base/50">
            <div className="product-container">
                <div className="mb-32">
                    <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-accent mb-8 block font-semibold">
                        The Portfolios
                    </span>
                    <h2 className="text-7xl md:text-9xl font-extrabold tracking-tighter text-white">
                        Curated <br />
                        <span className="text-white/10 italic">Prototypes.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {PROJECTS.map((project, i) => (
                        <motion.div
                            key={project.title}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.8 }}
                            className="luxury-card group relative overflow-hidden h-full flex flex-col"
                        >
                            {/* Card Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                            <div className="mb-12 aspect-video bg-black/40 rounded-2xl border border-white/5 overflow-hidden relative group-hover:border-accent/20 transition-all duration-500 shadow-inner">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent group-hover:opacity-100 transition-opacity opacity-0" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-mono text-neutral-600 tracking-[0.4em] uppercase font-bold">Preview_Synthesizing...</span>
                                </div>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div>
                                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent mb-3 font-semibold">{project.category}</p>
                                    <h3 className="text-4xl font-bold tracking-tighter text-white group-hover:text-accent transition-colors duration-500">{project.title}</h3>
                                </div>

                                <p className="text-lg text-neutral-400 font-light leading-relaxed">
                                    {project.description}
                                </p>

                                <div className="flex gap-2 flex-wrap pt-6 mt-auto">
                                    {project.tags.map(tag => (
                                        <span key={tag} className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-bold">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

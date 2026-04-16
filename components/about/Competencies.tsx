
"use client";

import { motion } from "framer-motion";

const skillLayers = [
    {
        category: "AI & LLM Engineering",
        icon: "🧠",
        skills: [
            "Agentic AI Architecture",
            "LLM Pipeline Engineering",
            "Graph-aware Retrieval (RAG)",
            "Multi-Model Orchestration",
            "Tool-Calling Agents",
            "Reflection & Self-Evaluation Loops",
            "LangChain / LangGraph / CrewAI",
        ],
    },
    {
        category: "Backend Engineering",
        icon: "⚙️",
        skills: [
            "Python / FastAPI",
            "Async API Design",
            "Streaming Architectures",
            "Vector Databases (pgvector)",
            "PostgreSQL",
            "REST API Design",
        ],
    },
    {
        category: "Frontend Engineering",
        icon: "🎨",
        skills: [
            "React / Next.js",
            "Three.js (R3F)",
            "Framer Motion",
            "Modern UI Systems",
            "Interactive 3D Interfaces",
            "TypeScript",
        ],
    },
    {
        category: "Infrastructure & DevOps",
        icon: "☁️",
        skills: [
            "Docker",
            "AWS (Deployment)",
            "Linux Systems",
            "Background Job Queues",
            "Containerized AI Deployment",
            "Ollama Local Model Hosting",
        ],
    },
];

export default function Competencies() {
    return (
        <section className="py-32 px-6">
            <div className="max-w-7xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">
                        // Skill Architecture
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                        Technical Stack
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {skillLayers.map((layer, i) => (
                        <motion.div
                            key={layer.category}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent/20 hover:bg-white/[0.04] transition-all duration-300"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-2xl">{layer.icon}</span>
                                <h3 className="text-lg font-bold text-white tracking-tight">{layer.category}</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {layer.skills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="text-xs font-mono px-3 py-1.5 rounded-full bg-white/[0.04] text-neutral-300 border border-white/5 group-hover:border-accent/10 transition-colors"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

"use client";

import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";

const experiences = [
    {
        role: "AI Systems Architect",
        period: "2024 – Present",
        type: "Independent",
        points: [
            "Architected full AI-native portfolio platform with self-healing RAG, voice agents, and real-time analytics.",
            "Built production-grade GitHub auto-sync pipeline with incremental ingestion and code summarization.",
            "Designed memory-aware AI assistant with 3-tier memory architecture and anti-hallucination guards.",
        ],
    },
    {
        role: "Full-Stack AI Engineer",
        period: "2023 – 2024",
        type: "Projects",
        points: [
            "Developed production RAG pipelines with parallel vector retrieval and context compression.",
            "Implemented agentic AI systems with tool use, multi-step reasoning, and safety guardrails.",
            "Built real-time streaming inference endpoints with sub-100ms first-byte latency.",
        ],
    },
    {
        role: "Software Engineer",
        period: "2022 – 2023",
        type: "Foundations",
        points: [
            "Mastered full-stack development with TypeScript, React, Next.js, and PostgreSQL.",
            "Built containerized applications with Docker, CI/CD pipelines, and automated testing.",
            "Developed RESTful APIs with authentication, rate limiting, and observability infrastructure.",
        ],
    },
];

export default function Experience() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="space-y-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">// Experience</span>
                    <h2 className="text-4xl font-bold tracking-tight text-white">Professional Journey</h2>
                </div>

                <div className="space-y-6">
                    {experiences.map((exp, i) => (
                        <motion.div
                            key={exp.role}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-accent/15 transition-colors duration-500"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                        <Briefcase className="text-accent" size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{exp.role}</h3>
                                        <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-wider">{exp.type}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-accent/70">{exp.period}</span>
                            </div>

                            <ul className="space-y-2 ml-13">
                                {exp.points.map((point, j) => (
                                    <li key={j} className="flex gap-3 text-sm text-neutral-400 leading-relaxed">
                                        <span className="text-accent/40 mt-1 shrink-0">▸</span>
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

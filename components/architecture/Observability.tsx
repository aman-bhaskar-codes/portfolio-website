"use client";

import { motion } from "framer-motion";
import { Activity, ShieldCheck, Timer, BarChart3 } from "lucide-react";

const metrics = [
    {
        icon: BarChart3,
        title: "RAG Confidence Logging",
        desc: "Every retrieval scores confidence, enabling continuous pipeline tuning.",
    },
    {
        icon: Timer,
        title: "Latency Tracking",
        desc: "Model inference, embedding generation, and total request latency are measured per-query.",
    },
    {
        icon: ShieldCheck,
        title: "Anti-Hallucination Guards",
        desc: "System prompts enforce grounded responses. Unknown queries get honest 'I don't know' fallbacks.",
    },
    {
        icon: Activity,
        title: "Health & Rate Limiting",
        desc: "Endpoint health checks, IP-based rate limiting, and timeout protections ensure production reliability.",
    },
];

export default function Observability() {
    return (
        <section className="py-32 px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-accent/5 to-transparent pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-16 relative z-10">
                <div className="text-center space-y-6">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">
                        // Reliability
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                        Observability & Safety
                    </h2>
                    <p className="text-lg text-neutral-400 max-w-2xl mx-auto font-light leading-relaxed">
                        Production AI systems require more than just working code.
                        They need observability, guardrails, and graceful degradation.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {metrics.map((m, i) => (
                        <motion.div
                            key={m.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-accent/20 transition-all duration-500"
                        >
                            <div className="flex items-start gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                                    <m.icon className="text-accent" size={22} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-white">{m.title}</h3>
                                    <p className="text-sm text-neutral-400 leading-relaxed">{m.desc}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

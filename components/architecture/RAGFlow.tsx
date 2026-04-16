"use client";

import { motion } from "framer-motion";

const steps = [
    { num: "01", title: "Intent Detection", desc: "Classify user query as greeting, technical, project-specific, or memory-related." },
    { num: "02", title: "Query Embedding", desc: "Generate vector embedding with caching layer to avoid redundant computations." },
    { num: "03", title: "Parallel Vector Retrieval", desc: "Search ProjectKnowledge and Memory stores concurrently for maximum recall." },
    { num: "04", title: "Similarity Threshold Filter", desc: "Discard low-confidence chunks below configurable cosine similarity threshold." },
    { num: "05", title: "Self-Healing Retry", desc: "Automatic retry with exponential backoff on embedding or retrieval failures." },
    { num: "06", title: "Context Compression", desc: "Deduplicate and rank retrieved chunks by relevance, trim to token budget." },
    { num: "07", title: "Anti-Hallucination Guard", desc: "System prompt enforces grounded responses; unknown queries get honest fallback." },
    { num: "08", title: "Streaming Response", desc: "Token-by-token streaming via Server-Sent Events for sub-100ms first-byte." },
];

export default function RAGFlow() {
    return (
        <section className="py-32 px-6 relative">
            <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-16 relative z-10">
                <div className="max-w-3xl space-y-6">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">
                        // Core Pipeline
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                        Advanced RAG Pipeline
                    </h2>
                    <p className="text-lg text-neutral-400 font-light leading-relaxed">
                        An 8-stage retrieval-augmented generation pipeline with self-healing,
                        caching, and anti-hallucination safeguards.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.num}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -15 : 15 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.06 }}
                            className="flex gap-5 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent/15 transition-colors duration-300"
                        >
                            <span className="text-2xl font-black text-accent/30 shrink-0 font-mono">{step.num}</span>
                            <div>
                                <h3 className="font-bold text-white text-sm">{step.title}</h3>
                                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

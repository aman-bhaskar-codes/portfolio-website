"use client";

import { motion } from "framer-motion";

const categories = [
    {
        label: "Languages",
        items: ["TypeScript", "Python", "Go", "SQL"],
    },
    {
        label: "Frontend",
        items: ["Next.js 16", "React 19", "Three.js", "Framer Motion"],
    },
    {
        label: "Backend",
        items: ["Node.js", "FastAPI", "Prisma ORM", "REST / Streaming"],
    },
    {
        label: "AI / ML",
        items: ["Ollama", "Qwen 2.5", "nomic-embed", "LangChain"],
    },
    {
        label: "Data",
        items: ["PostgreSQL", "pgvector", "Redis", "ChromaDB"],
    },
    {
        label: "DevOps",
        items: ["Docker", "Nginx", "GitHub Actions", "Linux VPS"],
    },
];

export default function TechStack() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-5xl mx-auto space-y-12">
                <div className="space-y-4">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">// Stack</span>
                    <h2 className="text-4xl font-bold tracking-tight text-white">Technical Arsenal</h2>
                </div>

                <div className="space-y-3">
                    {categories.map((cat, i) => (
                        <motion.div
                            key={cat.label}
                            initial={{ opacity: 0, x: -15 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.06 }}
                            className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent/15 transition-colors"
                        >
                            <span className="w-24 shrink-0 text-xs font-mono font-bold text-accent uppercase tracking-wider">
                                {cat.label}
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {cat.items.map((item) => (
                                    <span
                                        key={item}
                                        className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/5 text-xs font-mono text-neutral-400"
                                    >
                                        {item}
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

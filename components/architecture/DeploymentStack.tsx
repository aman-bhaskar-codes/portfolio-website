"use client";

import { motion } from "framer-motion";

const stack = [
    { layer: "Application", items: ["Next.js 16", "React 19", "TypeScript 5"] },
    { layer: "AI / ML", items: ["Ollama", "Qwen 2.5:1.5b", "nomic-embed-text"] },
    { layer: "Database", items: ["PostgreSQL 16", "pgvector", "Prisma ORM"] },
    { layer: "Auth", items: ["NextAuth v5", "GitHub OAuth", "JWT Sessions"] },
    { layer: "DevOps", items: ["Docker Compose", "Nginx Reverse Proxy", "Let's Encrypt SSL"] },
    { layer: "CI / CD", items: ["GitHub Actions", "Auto Deploy", "Health Checks"] },
];

export default function DeploymentStack() {
    return (
        <section className="py-32 px-6">
            <div className="max-w-6xl mx-auto space-y-16">
                <div className="max-w-3xl space-y-6">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">
                        // Production Stack
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                        Deployment Infrastructure
                    </h2>
                    <p className="text-lg text-neutral-400 font-light leading-relaxed">
                        Containerized, reverse-proxied, SSL-secured, and auto-deployed.
                        Every layer is production-hardened.
                    </p>
                </div>

                <div className="space-y-3">
                    {stack.map((row, i) => (
                        <motion.div
                            key={row.layer}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.06 }}
                            className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent/15 transition-colors"
                        >
                            <span className="w-28 shrink-0 text-xs font-mono font-bold text-accent uppercase tracking-wider">
                                {row.layer}
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {row.items.map((item) => (
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

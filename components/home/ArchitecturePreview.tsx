"use client";

import Link from "next/link";
import { Cpu, Globe, Database, Shield } from "lucide-react";
import { motion } from "framer-motion";
import {
    useScrollReveal,
    fadeUp,
    staggerContainer,
    staggerChild,
    springs,
    ease,
} from "@/lib/motion";

const features = [
    { icon: Cpu, label: "Hybrid RAG", desc: "Local + Cloud Inference" },
    { icon: Globe, label: "Edge Compute", desc: "Global Distribution" },
    { icon: Database, label: "Vector Store", desc: "Semantic Memory" },
    { icon: Shield, label: "Hardened API", desc: "Rate-Limited & Secure" },
];

export default function ArchitecturePreview() {
    const { ref, isInView } = useScrollReveal(0.15);

    return (
        <section className="py-32 relative overflow-hidden bg-bg-base/50" ref={ref}>
            {/* Background Glow */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none"
                animate={
                    isInView
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.8 }
                }
                transition={{ duration: 1.5 }}
            />

            <div className="product-container max-w-6xl mx-auto text-center space-y-16 relative z-10">
                {/* Header */}
                <motion.div
                    className="space-y-6"
                    variants={fadeUp}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">
                        // System Architecture
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
                        Built on Production-Grade <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                            Intelligent Infrastructure
                        </span>
                    </h2>
                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto font-light">
                        A modular cognitive architecture integrating real-time vector
                        retrieval, autonomous agents, and self-healing data pipelines.
                    </p>
                </motion.div>

                {/* Feature Cards */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-6"
                    variants={staggerContainer(0.12)}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    {features.map((item, i) => (
                        <motion.div
                            key={i}
                            variants={staggerChild}
                            whileHover={{ y: -8, scale: 1.03 }}
                            transition={springs.smooth}
                            className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-colors text-center space-y-4 group cursor-default"
                        >
                            <motion.div
                                className="w-12 h-12 mx-auto rounded-2xl bg-white/5 flex items-center justify-center"
                                whileHover={{ rotate: 15, scale: 1.1 }}
                                transition={springs.magnetic}
                            >
                                <item.icon className="text-purple-400" size={24} />
                            </motion.div>
                            <div>
                                <h3 className="font-bold text-white">{item.label}</h3>
                                <p className="text-xs text-neutral-500 mt-1">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        transition={springs.snappy}
                        className="inline-block"
                    >
                        <Link
                            href="/architecture"
                            className="inline-flex items-center justify-center px-8 py-4 bg-neutral-900 border border-white/10 rounded-full font-mono text-sm hover:border-purple-500/50 hover:bg-purple-900/10 transition-all duration-300"
                        >
                            VIEW_FULL_SCHEMATICS_v4.0
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

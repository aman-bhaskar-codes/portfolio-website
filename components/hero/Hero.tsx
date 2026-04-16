"use client";

import { Canvas } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useSettingsStore } from "@/store/useSettings";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
    ssr: false,
});

/* ── Staggered Letter Animation ── */
function AnimatedTitle({ text, className }: { text: string; className?: string }) {
    return (
        <span className={className}>
            {text.split("").map((char, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 40, rotateX: -40, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                    transition={{
                        delay: 0.3 + i * 0.04,
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{ display: "inline-block", transformOrigin: "bottom" }}
                >
                    {char === " " ? "\u00A0" : char}
                </motion.span>
            ))}
        </span>
    );
}

/* ── Status Badges ── */
function StatusBar() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex items-center gap-4 flex-wrap"
        >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                <span className="status-online" />
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                    3 Ollama models active
                </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-indigo)]" />
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                    LangGraph Orchestration
                </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)]" />
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                    Hybrid RAG
                </span>
            </div>
        </motion.div>
    );
}


export default function Hero() {
    const threeDIntensity = useSettingsStore((s) => s.threeDIntensity);
    const show3D = threeDIntensity !== "off";

    return (
        <section className="relative min-h-screen flex items-center pt-32 overflow-hidden">
            {/* 🌌 Background Atmosphere */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-accent/5 blur-[120px] rounded-full" />
            </div>

            <div className="product-container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-10 text-left">
                    <div className="space-y-6">
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block text-[10px] font-mono uppercase tracking-[0.5em] text-[var(--accent-indigo)] font-semibold"
                        >
                            Identity_v3.0 // Senior_AI_Architect
                        </motion.span>

                        <h1 className="text-5xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter leading-[0.9] text-white">
                            <AnimatedTitle text="Aman" />
                            <br />
                            <span className="text-luxury italic">
                                <AnimatedTitle text="Bhaskar." />
                            </span>
                        </h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="text-xl md:text-2xl text-neutral-400 font-light max-w-xl leading-relaxed"
                        >
                            Architecting cognitive platforms that bridge the gap
                            between human intent and autonomous execution.
                        </motion.p>
                    </div>

                    {/* Status badges */}
                    <StatusBar />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                        className="flex flex-wrap gap-5"
                    >
                        <button className="group relative px-10 py-5 bg-[var(--accent-indigo)] text-white font-bold rounded-full hover:scale-105 transition-all text-sm active:scale-95 shadow-2xl shadow-[var(--accent-indigo)]/20 overflow-hidden">
                            <span className="relative z-10">Explore Architecture</span>
                            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <button className="px-10 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-full hover:bg-white/10 hover:border-white/20 transition-all text-sm active:scale-95 backdrop-blur-md">
                            Launch Assistant
                        </button>
                    </motion.div>
                </div>

                <div className={`hidden lg:block h-[600px] relative transition-opacity duration-500 ${show3D ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {show3D && (
                        <Canvas>
                            <HeroScene />
                        </Canvas>
                    )}
                </div>

            </div>
        </section>
    );
}

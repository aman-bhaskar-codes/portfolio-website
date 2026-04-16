"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import {
    fadeUpLarge,
    charStagger,
    staggerContainer,
    staggerChild,
    springs,
    ease,
    useLowPower,
} from "@/lib/motion";

// Dynamically load the heavy 3D scene
const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
    ssr: false,
});

/** Animated text — each character fades up independently */
function AnimatedChars({ text, className }: { text: string; className?: string }) {
    return (
        <span className={className}>
            {text.split("").map((char, i) => (
                <motion.span
                    key={i}
                    custom={i}
                    variants={charStagger}
                    initial="hidden"
                    animate="visible"
                    className="inline-block"
                    style={{ whiteSpace: char === " " ? "pre" : undefined }}
                >
                    {char}
                </motion.span>
            ))}
        </span>
    );
}

export default function Hero() {
    const lowPower = useLowPower();
    const [canRender3D, setCanRender3D] = useState(false);

    useEffect(() => {
        const cores = navigator.hardwareConcurrency || 2;
        setCanRender3D(cores >= 4);
    }, []);

    return (
        <section className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden">
            {/* 🌌 Background Atmosphere */}
            <div className="absolute inset-0 -z-10">
                {canRender3D && !lowPower ? (
                    <Canvas>
                        <HeroScene />
                    </Canvas>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/20 via-bg-base to-indigo-900/15" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-bg-base/80 via-transparent to-bg-base pointer-events-none" />
            </div>

            <div className="product-container relative z-10 text-center space-y-12 max-w-5xl mx-auto px-6">

                {/* Identity Tag */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, ease: ease.luxuryOut }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-white/10"
                >
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                        System_v4.0 :: Online
                    </span>
                </motion.div>

                {/* Main Heading — Character-level stagger */}
                <div className="space-y-6">
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white leading-[0.9]">
                        <AnimatedChars text="Aman" />
                        <br />
                        {/* Made brighter and removed dot */}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-accent italic pr-4">
                            <AnimatedChars text="Bhaskar" />
                        </span>
                    </h1>

                    {/* Welcome Script */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5, duration: 1 }}
                        className="text-lg md:text-xl font-serif italic text-purple-200/80 tracking-wide mb-4"
                    >
                        ~ Welcome to my digital portfolio ~
                    </motion.div>

                    {/* Subtitle — word-by-word reveal */}
                    <motion.div
                        className="flex flex-wrap justify-center gap-x-2 text-xl md:text-2xl text-neutral-400 font-light max-w-2xl mx-auto leading-relaxed"
                        variants={staggerContainer(0.04)}
                        initial="hidden"
                        animate="visible"
                    >
                        {"AI-Native Engineer architecting autonomous systems, advanced RAG pipelines, and production-grade intelligence."
                            .split(" ")
                            .map((word, i) => (
                                <motion.span key={i} variants={staggerChild}>
                                    {word}
                                </motion.span>
                            ))}
                    </motion.div>
                </div>

                {/* CTA Buttons — spring from bottom with stagger */}
                <motion.div
                    className="flex flex-col sm:flex-row justify-center gap-6 relative z-20"
                    variants={staggerContainer(0.12)}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={staggerChild}>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={springs.snappy}
                        >
                            <Link
                                href="/projects"
                                className="group px-8 py-4 bg-white text-black rounded-full font-bold text-lg transition-all flex items-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                            >
                                Explore Works
                                <ArrowRight
                                    size={20}
                                    className="group-hover:translate-x-1 transition-transform"
                                />
                            </Link>
                        </motion.div>
                    </motion.div>

                    <motion.div variants={staggerChild}>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={springs.snappy}
                        >
                            <Link
                                href="/ai"
                                className="group px-8 py-4 glass-panel border border-white/10 rounded-full font-medium text-lg text-white hover:bg-white/10 transition-all flex items-center gap-2"
                            >
                                <Terminal size={20} className="text-accent" />
                                Talk to AI
                            </Link>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

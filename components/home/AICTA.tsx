"use client";

import Link from "next/link";
import { Sparkles, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import {
    useScrollReveal,
    fadeUp,
    fadeUpLarge,
    staggerContainer,
    staggerChild,
    springs,
} from "@/lib/motion";

export default function AICTA() {
    const { ref, isInView } = useScrollReveal(0.2);

    return (
        <section className="py-40 relative overflow-hidden" id="identity" ref={ref}>
            <div className="absolute inset-0 bg-gradient-to-t from-accent/5 to-transparent pointer-events-none" />

            <motion.div
                className="product-container max-w-4xl mx-auto text-center relative z-10 space-y-12"
                variants={staggerContainer(0.15)}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
            >
                {/* Glowing Icon */}
                <motion.div variants={staggerChild}>
                    <motion.div
                        className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shadow-[0_0_60px_-10px_rgba(129,140,248,0.5)]"
                        animate={
                            isInView
                                ? {
                                    boxShadow: [
                                        "0 0 60px -10px rgba(129,140,248,0.3)",
                                        "0 0 80px -10px rgba(129,140,248,0.6)",
                                        "0 0 60px -10px rgba(129,140,248,0.3)",
                                    ],
                                }
                                : {}
                        }
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Sparkles className="text-white w-10 h-10" />
                    </motion.div>
                </motion.div>

                {/* Heading */}
                <motion.div className="space-y-6" variants={staggerChild}>
                    <h2 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight">
                        Ask My AI <br />
                        <span className="text-neutral-500">Anything.</span>
                    </h2>

                    <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                        This entire portfolio is indexed in a vector database. My digital
                        twin can walk you through architecture decisions, code
                        implementation, and professional history.
                    </p>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                    className="flex flex-col sm:flex-row justify-center gap-6"
                    variants={staggerChild}
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        transition={springs.snappy}
                    >
                        <Link
                            href="/ai"
                            className="px-10 py-5 bg-white text-black rounded-full font-bold text-lg transition-transform flex items-center gap-3 justify-center shadow-xl shadow-white/10"
                        >
                            <Terminal size={20} />
                            Start Session
                        </Link>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        transition={springs.snappy}
                    >
                        <Link
                            href="/about"
                            className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-full font-medium text-lg hover:bg-white/10 transition-all flex items-center gap-3 justify-center"
                        >
                            Read Human Bio
                        </Link>
                    </motion.div>
                </motion.div>
            </motion.div>
        </section>
    );
}

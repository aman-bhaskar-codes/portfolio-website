"use client";

import { motion } from "framer-motion";
import {
    useScrollReveal,
    useCountUp,
    fadeUp,
    staggerContainer,
    staggerChild,
    ease,
} from "@/lib/motion";

const stats = [
    { value: 98, suffix: "%", label: "RAG Accuracy" },
    { value: 50, prefix: "<", suffix: "ms", label: "Inference Latency" },
    { value: 100, suffix: "+", label: "Systems Deployed" },
];

function StatCounter({
    value,
    suffix = "",
    prefix = "",
    label,
    inView,
}: {
    value: number;
    suffix?: string;
    prefix?: string;
    label: string;
    inView: boolean;
}) {
    const count = useCountUp(value, 2000, inView);

    return (
        <motion.div className="space-y-2" variants={staggerChild}>
            <h3 className="text-4xl font-black text-white">
                {prefix}
                {count}
                <span className="text-accent text-2xl">{suffix}</span>
            </h3>
            <p className="text-sm font-mono uppercase tracking-widest text-neutral-500">
                {label}
            </p>
        </motion.div>
    );
}

export default function Positioning() {
    const { ref, isInView } = useScrollReveal(0.2);

    return (
        <section className="py-32 bg-bg-base relative overflow-hidden" ref={ref}>
            {/* Subtle Grid Background */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />

            <div className="product-container max-w-4xl mx-auto text-center space-y-12 relative z-10">
                <motion.h2
                    className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight"
                    variants={fadeUp}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    Architecting{" "}
                    <span className="text-accent">Intelligent Systems</span>{" "}
                    <br />
                    for the Autonomous Age.
                </motion.h2>

                <motion.p
                    className="text-xl text-neutral-400 leading-relaxed font-light"
                    variants={fadeUp}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    transition={{ delay: 0.15 }}
                >
                    I don&apos;t just build user interfaces. I engineer cognitive
                    architectures that bridge the gap between human intent and machine
                    execution. From hybrid RAG pipelines to voice-native agents, every
                    system is optimized for scale, latency, and real-world reliability.
                </motion.p>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/5"
                    variants={staggerContainer(0.15)}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    {stats.map((stat) => (
                        <StatCounter
                            key={stat.label}
                            value={stat.value}
                            suffix={stat.suffix}
                            prefix={stat.prefix}
                            label={stat.label}
                            inView={isInView}
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

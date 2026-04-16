"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useScrollReveal, fadeUp, staggerContainer } from "@/lib/motion";

interface SectionProps {
    id?: string;
    children: ReactNode;
    className?: string;
    /** Full viewport height for cinematic pacing */
    fullscreen?: boolean;
    /** Enable staggered children animation */
    stagger?: boolean;
    /** Custom stagger delay between children */
    staggerDelay?: number;
}

export default function Section({
    children,
    id,
    className = "",
    fullscreen = false,
    stagger = false,
    staggerDelay = 0.1,
}: SectionProps) {
    const { ref, isInView } = useScrollReveal(0.1);

    const heightClass = fullscreen
        ? "min-h-screen flex items-center justify-center"
        : "py-40";

    const variants = stagger ? staggerContainer(staggerDelay) : fadeUp;

    return (
        <motion.section
            ref={ref}
            id={id}
            className={`relative overflow-hidden border-t border-border ${heightClass} ${className}`}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={variants}
        >
            {children}
        </motion.section>
    );
}

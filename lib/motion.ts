/**
 * Motion Primitives — Cinematic AI Platform Motion System
 *
 * Central motion configuration used across all components.
 * Hooks, variants, springs, and performance detection.
 */

"use client";

import { useEffect, useState, useRef } from "react";
import {
    useScroll,
    useTransform,
    useInView,
    useSpring,
    type MotionValue,
} from "framer-motion";

/* ─────────────────────────────────────────────
   1. SPRING PRESETS
   ───────────────────────────────────────────── */

export const springs = {
    /** Smooth, controlled — default for most UI */
    smooth: { type: "spring" as const, damping: 30, stiffness: 200, mass: 0.8 },

    /** Snappy response — buttons, toggles */
    snappy: { type: "spring" as const, damping: 25, stiffness: 400, mass: 0.5 },

    /** Magnetic feel — hover effects, icons */
    magnetic: { type: "spring" as const, damping: 15, stiffness: 200, mass: 0.3 },

    /** Cinematic entrance — page-level reveals */
    cinematic: { type: "spring" as const, damping: 40, stiffness: 100, mass: 1.2 },

    /** Gentle float — ambient background motion */
    gentle: { type: "spring" as const, damping: 50, stiffness: 60, mass: 2 },
};

/* ─────────────────────────────────────────────
   2. EASE CURVES
   ───────────────────────────────────────────── */

export const ease = {
    /** Premium out — page transitions, reveals */
    luxuryOut: [0.16, 1, 0.3, 1] as [number, number, number, number],

    /** Smooth in-out — general animations */
    smooth: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],

    /** Aggressive out — typography reveals */
    aggressive: [0.33, 1, 0.68, 1] as [number, number, number, number],
};

/* ─────────────────────────────────────────────
   3. ANIMATION VARIANTS
   ───────────────────────────────────────────── */

/** Fade up — standard section/element reveal */
export const fadeUp = {
    hidden: { opacity: 0, y: 60 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: ease.luxuryOut },
    },
};

/** Fade up large — cinematic hero-level reveals */
export const fadeUpLarge = {
    hidden: { opacity: 0, y: 80 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 1, ease: ease.aggressive },
    },
};

/** Scale fade — cards, panels */
export const scaleFade = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.7, ease: ease.luxuryOut },
    },
};

/** Stagger container — orchestrates child reveals */
export const staggerContainer = (staggerDelay = 0.1) => ({
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
        },
    },
});

/** Stagger child — used inside stagger containers */
export const staggerChild = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: ease.luxuryOut },
    },
};

/** Character stagger for typography */
export const charStagger = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.03,
            duration: 0.5,
            ease: ease.aggressive,
        },
    }),
};

/* ─────────────────────────────────────────────
   4. HOOKS
   ───────────────────────────────────────────── */

/**
 * useScrollReveal — triggers animation when element enters viewport.
 * Returns a ref and a boolean.
 */
export function useScrollReveal(threshold = 0.15) {
    const ref = useRef(null);
    const isInView = useInView(ref, {
        once: true,
        amount: threshold,
    });
    return { ref, isInView };
}

/**
 * useParallax — depth-based scroll movement.
 * Returns a MotionValue for the `y` style property.
 */
export function useParallax(
    range: [number, number] = [-100, 100]
): MotionValue<number> {
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], range);
    return useSpring(y, { damping: 50, stiffness: 100 });
}

/**
 * useElementParallax — parallax relative to a specific element.
 */
export function useElementParallax(
    range: [number, number] = [-50, 50]
) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });
    const y = useTransform(scrollYProgress, [0, 1], range);
    const smoothY = useSpring(y, { damping: 50, stiffness: 100 });
    return { ref, y: smoothY };
}

/**
 * useLowPower — detects low-power devices.
 * Returns true on devices with < 4 CPU cores or reduced-motion preference.
 */
export function useLowPower(): boolean {
    const [lowPower, setLowPower] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const cores = navigator.hardwareConcurrency || 2;
        const prefersReduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        setLowPower(cores < 4 || prefersReduced);
    }, []);

    return lowPower;
}

/**
 * useCountUp — animates a number from 0 to target when triggered.
 */
export function useCountUp(target: number, duration = 2000, start = false) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!start) return;

        let startTime: number;
        let frame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));

            if (progress < 1) {
                frame = requestAnimationFrame(animate);
            }
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [start, target, duration]);

    return count;
}

/* ─────────────────────────────────────────────
   5. MAGNETIC HOVER PROPS
   ───────────────────────────────────────────── */

/** Magnetic hover config for interactive elements */
export const magneticHover = {
    whileHover: { scale: 1.15, rotate: 8 },
    whileTap: { scale: 0.95 },
    transition: springs.magnetic,
};

/** Subtle lift for cards */
export const cardHover = {
    whileHover: { y: -8, scale: 1.02 },
    transition: springs.smooth,
};

"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorGlow() {
    const [visible, setVisible] = useState(false);

    const mouseX = useMotionValue(-200);
    const mouseY = useMotionValue(-200);

    // Smooth spring-based tracking
    const x = useSpring(mouseX, { damping: 25, stiffness: 200, mass: 0.5 });
    const y = useSpring(mouseY, { damping: 25, stiffness: 200, mass: 0.5 });

    useEffect(() => {
        // Only show on desktop with pointer
        const mq = window.matchMedia("(pointer: fine)");
        if (!mq.matches) return;

        // Respect reduced motion
        const rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (rmq.matches) return;

        setVisible(true);

        const handler = (e: MouseEvent) => {
            mouseX.set(e.clientX - 96);
            mouseY.set(e.clientY - 96);
        };

        window.addEventListener("mousemove", handler, { passive: true });
        return () => window.removeEventListener("mousemove", handler);
    }, [mouseX, mouseY]);

    // Secondary core springs
    const coreX = useSpring(mouseX, { damping: 20, stiffness: 300, mass: 0.3 });
    const coreY = useSpring(mouseY, { damping: 20, stiffness: 300, mass: 0.3 });

    if (!visible) return null;

    return (
        <>
            {/* Primary glow — larger, softer */}
            <motion.div
                className="fixed pointer-events-none z-[9999] w-48 h-48 rounded-full"
                style={{
                    x,
                    y,
                    background:
                        "radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(99,102,241,0.04) 40%, transparent 70%)",
                    filter: "blur(24px)",
                }}
            />

            {/* Secondary core — tighter, brighter center */}
            <motion.div
                className="fixed pointer-events-none z-[9999] w-24 h-24 rounded-full"
                style={{
                    x: coreX,
                    y: coreY,
                    marginLeft: 48,
                    marginTop: 48,
                    background:
                        "radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 60%)",
                    filter: "blur(12px)",
                }}
            />
        </>
    );
}

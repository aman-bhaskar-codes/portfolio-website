"use client";

import { useCognitive } from "@/lib/state/cognitiveStore";
import { motion } from "framer-motion";

export default function UniverseOverlay() {
    const { state } = useCognitive();

    return (
        <div className="pointer-events-none absolute inset-0 z-10 font-sans">
            {/* Top Left Title */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute top-10 left-10 text-white"
            >
                <h1 className="text-2xl font-light tracking-tight">
                    Cognitive Universe
                </h1>
                <p className="text-sm text-[var(--text-core-muted)] mt-1 font-light">
                    Live visualization of distributed reasoning
                </p>
            </motion.div>

            {/* Metrics Panel - Pointer Events Auto so user can interact if needed */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="pointer-events-auto absolute top-10 right-10 w-64 p-6 rounded-[var(--radius-xl)] backdrop-blur-md bg-black/40 border border-[var(--border-soft)]"
            >
                <Metric label="Reward Health" value={(state.reward * 100).toFixed(1) + "%"} color="text-emerald-400" />
                <Metric label="Active Twin" value={state.activeTwin || "Idle"} color="text-yellow-400 capitalize" />
                <Metric label="Autonomy Level" value={state.autonomyMode} color="text-purple-400 capitalize" />
            </motion.div>

            {/* Bottom Tagline */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                className="absolute bottom-10 w-full text-center text-[var(--text-core-muted)] text-sm tracking-widest uppercase font-mono"
            >
                Autonomous • Reinforcement-Aligned • Swarm Cognition
            </motion.div>
        </div>
    );
}

function Metric({ label, value, color = "text-white" }: { label: string, value: string | number, color?: string }) {
    return (
        <div className="mb-4 last:mb-0">
            <p className="text-xs uppercase tracking-widest text-[var(--text-core-muted)] font-mono">{label}</p>
            <p className={`text-xl font-light tracking-tight mt-1 ${color}`}>{value}</p>
        </div>
    );
}

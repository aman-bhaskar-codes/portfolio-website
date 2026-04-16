"use client";
import { motion } from "framer-motion";

export default function TwinCoreOrb({ status }: { status: "idle" | "running" | "complete" }) {
    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex justify-center py-20 relative z-10"
        >
            <motion.div
                animate={{
                    boxShadow: status === "running"
                        ? [
                            "0 0 40px rgba(124,58,237,0.3)",
                            "0 0 100px rgba(124,58,237,0.8)",
                            "0 0 40px rgba(124,58,237,0.3)"
                        ]
                        : [
                            "0 0 40px rgba(124,58,237,0.2)",
                            "0 0 60px rgba(124,58,237,0.4)",
                            "0 0 40px rgba(124,58,237,0.2)"
                        ],
                    scale: status === "running" ? [1, 1.05, 1] : 1
                }}
                transition={{ repeat: Infinity, duration: status === "running" ? 2 : 4 }}
                className={`
                    w-40 h-40
                    rounded-full
                    bg-purple-600/10
                    backdrop-blur-xl
                    border border-purple-500/30
                    flex items-center justify-center
                    relative
                `}
            >
                {/* Inner Core */}
                <div className="w-24 h-24 rounded-full bg-purple-500/10 blur-xl absolute" />

                <div className="text-center">
                    <span className="text-lg font-semibold tracking-widest text-purple-200/80 uppercase block">
                        {status === "running" ? "Architecting" : "Digital Twin"}
                    </span>
                    <span className="text-[9px] font-mono tracking-[0.3em] text-purple-400/50 uppercase mt-1 block">
                        Autonomous Systems Architect
                    </span>
                </div>

                {/* Orbiting Ring */}
                {status === "running" && (
                    <motion.div
                        className="absolute inset-[-10px] rounded-full border-t border-purple-400/50"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                )}
            </motion.div>
        </motion.div>
    );
}

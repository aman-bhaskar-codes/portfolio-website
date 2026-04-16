"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useSettingsStore } from "@/store/useSettings";

export default function SettingsPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const {
        theme, setTheme,
        motion: motionEnabled, setMotion,
        verbosity: aiVerbosity, setVerbosity: setAiVerbosity,
        threeDIntensity, setThreeDIntensity
    } = useSettingsStore();

    return (
        <>
            {/* ⚙️ Floating Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-8 right-8 z-[100] w-10 h-10 glass-panel rounded-full flex items-center justify-center hover:rotate-90 transition-all active:scale-95"
            >
                <span className="text-xs">⚙️</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-[400px] bg-[#121218]/90 backdrop-blur-3xl border-l border-white/5 z-[100] shadow-3xl p-12 flex flex-col overflow-y-auto"
                        >
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold tracking-tighter mb-2 text-white">SYSTEM_SETTINGS</h2>
                                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Aman Identity Configuration v1.0</p>
                            </div>

                            <div className="space-y-10 flex-1">
                                {/* Theme Selector */}
                                <div className="space-y-4">
                                    <label className="text-[9px] font-mono uppercase tracking-[0.3em] text-neutral-500">Aesthetic_Theme</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {["luxury", "deeplab"].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setTheme(t as any)}
                                                className={`py-3 px-4 rounded-xl text-[10px] font-mono uppercase tracking-widest border transition-all ${theme === t ? "bg-accent border-accent text-white" : "bg-white/5 border-white/5 text-neutral-500 hover:border-white/10"
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Motion Toggle */}
                                <div className="flex justify-between items-center bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-white">Cinematic Motion</p>
                                        <p className="text-[10px] text-neutral-500">Enable high-performance animations</p>
                                    </div>
                                    <button
                                        onClick={() => setMotion(motionEnabled === 'on' ? 'reduced' : 'on')}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${motionEnabled === 'on' ? "bg-accent" : "bg-neutral-800"}`}
                                    >
                                        <motion.div
                                            animate={{ x: motionEnabled === 'on' ? 24 : 4 }}
                                            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg"
                                        />
                                    </button>
                                </div>

                                {/* AI Verbosity */}
                                <div className="space-y-4">
                                    <label className="text-[9px] font-mono uppercase tracking-[0.3em] text-neutral-500">Cognitive_Verbosity</label>
                                    <div className="flex gap-2">
                                        {["concise", "balanced", "deep"].map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setAiVerbosity(v as any)}
                                                className={`flex-1 py-3 rounded-xl text-[9px] font-mono uppercase border transition-all ${aiVerbosity === v ? "bg-accent/10 border-accent/40 text-accent" : "bg-white/5 border-white/5 text-neutral-600 hover:border-white/10"
                                                    }`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 3D Intensity */}
                                <div className="space-y-4">
                                    <label className="text-[9px] font-mono uppercase tracking-[0.3em] text-neutral-500">Atmosphere_Intensity</label>
                                    <div className="flex gap-2">
                                        {["low", "medium", "high", "off"].map(i => (
                                            <button
                                                key={i}
                                                onClick={() => setThreeDIntensity(i as any)}
                                                className={`flex-1 py-3 rounded-xl text-[9px] font-mono uppercase border transition-all ${threeDIntensity === i ? "bg-accent/10 border-accent/40 text-accent" : "bg-white/5 border-white/5 text-neutral-600 hover:border-white/10"
                                                    }`}
                                            >
                                                {i}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-12 border-t border-white/5 text-center">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest hover:text-white transition-colors"
                                >
                                    Close Terminal
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

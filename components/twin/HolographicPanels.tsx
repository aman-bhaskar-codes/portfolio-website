"use client";
import { Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";

export default function HolographicPanels({ goal, reflection }: { goal?: string, reflection?: string }) {
    return (
        <>
            <Html position={[4, 1.5, 0]} transform distanceFactor={5}>
                <div className="w-80 font-sans select-none pointer-events-none">
                    <AnimatePresence mode="wait">
                        {goal && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="bg-black/40 backdrop-blur-xl border border-purple-500/50 p-6 rounded-2xl shadow-[0_0_30px_rgba(124,58,237,0.3)]"
                            >
                                <div className="flex items-center gap-2 mb-2 border-b border-purple-500/30 pb-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                    <h3 className="text-purple-300 font-bold uppercase text-xs tracking-widest">Active Directive</h3>
                                </div>
                                <p className="text-white text-sm font-medium leading-relaxed drop-shadow-md">
                                    {goal}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Html>

            <Html position={[-4, -1, 0]} transform distanceFactor={5}>
                <div className="w-80 font-sans select-none pointer-events-none">
                    <AnimatePresence mode="wait">
                        {reflection && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="bg-black/40 backdrop-blur-xl border border-cyan-400/50 p-6 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                            >
                                <div className="flex items-center gap-2 mb-2 border-b border-cyan-400/30 pb-2">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                                    <h3 className="text-cyan-300 font-bold uppercase text-xs tracking-widest">Latest Insight</h3>
                                </div>
                                <p className="text-neutral-200 text-xs italic leading-relaxed">
                                    "{reflection}"
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Html>
        </>
    );
}

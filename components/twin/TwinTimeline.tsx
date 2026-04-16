"use client";
import { motion } from "framer-motion";

export default function TwinTimeline({ memories }: { memories: any[] }) {
    if (!memories || memories.length === 0) return null;

    return (
        <div className="fixed right-8 top-1/2 -translate-y-1/2 w-80 hidden xl:block z-20 pointer-events-none">
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-6 text-right">Memory Stream</h4>
            <div className="space-y-6 pl-6 border-l border-purple-500/20">
                {memories.map((mem, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative"
                    >
                        <div className="absolute -left-[29px] top-1.5 w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                        <div className="bg-black/40 backdrop-blur border border-white/5 p-4 rounded-xl rounded-tl-sm shadow-xl">
                            <span className="text-[10px] text-purple-400 font-bold uppercase block mb-1">
                                {mem.type}
                            </span>
                            <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed">
                                {mem.content}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

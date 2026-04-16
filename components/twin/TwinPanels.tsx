"use client";
import { motion } from "framer-motion";
import { Brain, Terminal, Activity } from "lucide-react";

export default function TwinPanels({ plan, result }: { plan: any, result: any }) {
    if (!plan && !result) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto px-6 relative z-10">
            {plan && (
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
                >
                    <div className="flex items-center gap-3 mb-6 text-purple-300">
                        <Brain size={20} />
                        <h3 className="font-bold uppercase tracking-wider text-sm">Active Plan</h3>
                    </div>

                    <div className="space-y-4">
                        {plan.steps.map((step: any, i: number) => (
                            <div key={i} className="flex gap-4 group">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold border border-purple-500/30 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                        {i + 1}
                                    </div>
                                    {i < plan.steps.length - 1 && <div className="w-[1px] h-full bg-white/5" />}
                                </div>
                                <div className="pb-4">
                                    <p className="text-neutral-200 text-sm font-medium">{step.thought}</p>
                                    <span className="text-[10px] text-neutral-500 font-mono uppercase px-2 py-0.5 bg-white/5 rounded mt-1 inline-block">
                                        {step.tool}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col justify-between"
                >
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-cyan-300">
                            <Terminal size={20} />
                            <h3 className="font-bold uppercase tracking-wider text-sm">Execution Log</h3>
                        </div>
                        <div className="space-y-2 text-xs text-neutral-400 font-mono max-h-40 overflow-y-auto custom-scrollbar">
                            {result.results.map((res: string, i: number) => (
                                <div key={i} className="p-2 bg-black/30 rounded border border-white/5">
                                    {res}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-3 mb-2 text-green-300">
                            <Activity size={18} />
                            <h3 className="font-bold uppercase tracking-wider text-sm">Reflection</h3>
                        </div>
                        <p className="text-neutral-300 text-sm italic leading-relaxed">
                            "{result.reflection.summary}"
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

"use client";

import { useCognitive } from "@/lib/state/cognitiveStore";
import { Zap, CheckCircle2, FlaskConical } from "lucide-react";

export default function HypothesisPanel() {
    const { state } = useCognitive();

    return (
        <section className="col-span-1 lg:col-span-3 pb-24">
            <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
                <h2 className="text-xl font-light tracking-tight flex items-center gap-2">
                    <FlaskConical size={20} className="text-purple-400" />
                    Active Architecture Experiments
                </h2>
                <div className="text-[10px] uppercase font-mono tracking-widest text-emerald-500 flex items-center gap-2">
                    <Zap size={10} className="animate-pulse" /> Live Tracking
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.activeHypotheses.map(hypo => (
                    <div key={hypo.id} className="p-6 bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-all duration-300 rounded-xl group relative overflow-hidden">

                        {/* Status Badge */}
                        <div className="absolute top-4 right-4">
                            {hypo.status === "active" ? (
                                <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" /> Testing
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                    <CheckCircle2 size={10} /> Validated
                                </span>
                            )}
                        </div>

                        <h3 className="text-base font-medium text-neutral-200 pr-20 leading-snug">
                            {hypo.title}
                        </h3>

                        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4">
                            <span className="text-xs text-neutral-500 font-light">Delta Impact</span>
                            <span className={`text-sm font-mono ${hypo.impact > 0 ? "text-emerald-400" : "text-neutral-400"}`}>
                                {hypo.impact > 0 ? "+" : ""}{hypo.impact}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

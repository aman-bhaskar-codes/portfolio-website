"use client";

import { useCognitive } from "@/lib/state/cognitiveStore";

export default function SwarmHeatmap() {
    const { state } = useCognitive();

    return (
        <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-6 font-mono border-b border-white/5 pb-4">Swarm Contribution Index</h2>

            <div className="space-y-6">
                {state.swarmScores.map((agent, i) => {
                    const isActive = state.activeTwin?.toLowerCase() === agent.twin.toLowerCase();

                    return (
                        <div key={i} className="group cursor-default">
                            <div className="flex justify-between items-end mb-2">
                                <span className={`text-sm font-light flex items-center gap-2 ${isActive ? 'text-yellow-400' : 'text-neutral-300'}`}>
                                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />}
                                    {agent.twin}
                                </span>
                                <span className="text-xs font-mono text-neutral-500 group-hover:text-purple-400 transition-colors">
                                    {(agent.score * 100).toFixed(0)}%
                                </span>
                            </div>

                            {/* Base Track */}
                            <div className="h-1.5 w-full bg-black border border-white/5 rounded-full overflow-hidden relative">
                                {/* Fill Track */}
                                <div
                                    className={`absolute top-0 left-0 h-full transition-all duration-700 ease-[0.16,1,0.3,1] ${isActive ? "bg-gradient-to-r from-yellow-600 to-yellow-400" : "bg-gradient-to-r from-purple-900 to-purple-500"}`}
                                    style={{ width: `${agent.score * 100}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

"use client";

import RewardGraph from "./RewardGraph";
import HypothesisPanel from "./HypothesisPanel";
import SwarmHeatmap from "./SwarmHeatmap";
import useUserRole from "@/lib/useUserRole";
import OwnerControlPanel from "@/components/owner/OwnerControlPanel";
import { useCognitive } from "@/lib/state/cognitiveStore";
import { Activity } from "lucide-react";

export default function ResearchDashboard() {
    const role = useUserRole();
    const { state } = useCognitive();

    return (
        <div className="max-w-6xl mx-auto space-y-16">
            <section className="border-b border-white/10 pb-10">
                <div className="text-[10px] uppercase font-mono tracking-widest text-emerald-500 flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 rounded-full mb-6 w-max">
                    <Activity size={12} className="animate-pulse" /> Live Telemetry Linked
                </div>
                <h1 className="text-4xl font-light tracking-tight mb-4 text-white">
                    AI Research Lab
                </h1>
                <p className="text-neutral-400 max-w-2xl font-light leading-relaxed">
                    Continuous autonomous experimentation, reinforcement learning,
                    and cognitive optimization of the Digital Twin system.
                </p>
            </section>

            {role === "owner" && <OwnerControlPanel />}

            {/* Cognitive Drift Monitor */}
            <section>
                <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-6 font-mono border-b border-white/5 pb-4">Cognitive Stability</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        label="Identity Stability"
                        value={(state.identityStability * 100).toFixed(1) + "%"}
                        subtext="Alignment to base personality"
                    />
                    <MetricCard
                        label="Hallucination Rate"
                        value={(state.hallucinationRate * 100).toFixed(2) + "%"}
                        subtext="Factually incoherent retrievals"
                        alert={state.hallucinationRate > 0.08}
                    />
                    <MetricCard
                        label="Current Reward"
                        value={state.reward.toFixed(3)}
                        subtext="Global RLHF optimizer score"
                    />
                </div>
            </section>

            {/* Core Analytics Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="col-span-1 lg:col-span-2">
                    <RewardGraph />
                </div>
                <div className="col-span-1 lg:col-span-1">
                    <SwarmHeatmap />
                </div>
            </section>

            {/* Hypotheses */}
            <HypothesisPanel />
        </div>
    );
}

function MetricCard({ label, value, subtext, alert = false }: { label: string, value: string | number, subtext: string, alert?: boolean }) {
    return (
        <div className={`p-6 bg-white/[0.02] border ${alert ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-white/5'} rounded-2xl flex flex-col justify-between`}>
            <p className="text-xs uppercase tracking-widest font-mono text-neutral-500 mb-4">{label}</p>
            <div>
                <p className={`text-4xl font-light tracking-tight ${alert ? 'text-red-400' : 'text-neutral-200'}`}>
                    {value}
                </p>
                <p className="text-xs text-neutral-600 mt-2 font-mono">{subtext}</p>
            </div>
        </div>
    );
}

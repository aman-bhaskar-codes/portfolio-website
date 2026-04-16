"use client";

import { useCognitive } from "@/lib/state/cognitiveStore";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function RewardGraph() {
    const { state } = useCognitive();

    const data = state.rewardHistory.map((r, i) => ({
        step: `T${i}`,
        reward: Number(r.toFixed(2))
    }));

    return (
        <section className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm uppercase tracking-widest text-neutral-500 mb-6 font-mono border-b border-white/5 pb-4">Reward Evolution</h2>
            <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                        <XAxis
                            dataKey="step"
                            stroke="#525252"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#525252"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            domain={[0.4, 1.0]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#000", borderColor: "#333", borderRadius: "8px", fontSize: "12px" }}
                            itemStyle={{ color: "#a855f7" }}
                        />
                        <Line
                            type="monotone"
                            dataKey="reward"
                            stroke="#a855f7"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#000", stroke: "#a855f7", strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: "#a855f7", stroke: "#fff" }}
                            animationDuration={300}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
}

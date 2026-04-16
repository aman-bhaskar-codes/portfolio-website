"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Use the API key we generated previously
const DEMO_API_KEY = "cgn_05632bcea62c5ad09d65eeb616bf4ce1dc85ebf33a6523fd";

export default function CognifyDashboard() {
    const [usage, setUsage] = useState<any>(null);
    const [query, setQuery] = useState("");
    const [goal, setGoal] = useState("");
    const [response, setResponse] = useState<any>(null);
    const [plan, setPlan] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchUsage();
    }, []);

    async function fetchUsage() {
        try {
            const res = await fetch("/api/agent/usage", {
                headers: { Authorization: `Bearer ${DEMO_API_KEY}` },
            });
            if (res.ok) {
                setUsage(await res.json());
            }
        } catch { }
    }

    async function handleQuery(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        setResponse(null);

        try {
            const res = await fetch("/api/agent/respond", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${DEMO_API_KEY}`,
                },
                body: JSON.stringify({ query, options: { debate: true } }),
            });
            const data = await res.json();
            if (res.ok) {
                setResponse(data);
                fetchUsage();
            } else {
                setError(data.error || "Failed to fetch response");
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handlePlan(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        setPlan(null);

        try {
            const res = await fetch("/api/agent/plan", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${DEMO_API_KEY}`,
                },
                body: JSON.stringify({ goal }),
            });
            const data = await res.json();
            if (res.ok) {
                setPlan(data);
                fetchUsage();
            } else {
                setError(data.error || "Failed to fetch plan");
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
            <header className="mb-12 border-b border-neutral-800 pb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-white mb-2">Cognify<span className="text-neutral-500">.ai</span></h1>
                    <p className="text-sm text-neutral-400">Multi-Tenant Autonomous Infrastructure Platform</p>
                </div>
                {usage && (
                    <div className="text-right">
                        <div className="text-xs uppercase tracking-widest text-emerald-500 font-bold mb-1">{usage.plan} PLAN</div>
                        <div className="text-sm text-neutral-400">Tokens: <span className="text-white">{usage.currentPeriod?.tokensUsed.toLocaleString()}</span> / {usage.limits?.maxTokensPerDay.toLocaleString()}</div>
                        <div className="text-xs mt-1 text-neutral-500">Cost: {usage.estimatedCost}</div>
                    </div>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {/* ───────────────────────────────────────────────────────── */}
                {/* AGENT RESPOND                                             */}
                {/* ───────────────────────────────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl p-6"
                >
                    <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Query / Debate Engine
                    </h2>
                    <form onSubmit={handleQuery} className="mb-6">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask the engine something complex..."
                            className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500/50 mb-3"
                        />
                        <button
                            disabled={loading || !query}
                            type="submit"
                            className="w-full bg-white text-black text-sm font-medium py-2 rounded-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors"
                        >
                            {loading && !response && !plan ? "Processing..." : "Submit Query"}
                        </button>
                    </form>

                    {response && response.data && (
                        <div className="space-y-4 text-sm mt-4 border-t border-neutral-800 pt-4">
                            <div>
                                <h3 className="text-neutral-500 mb-1 text-xs uppercase tracking-wider">Primary Response</h3>
                                <div className="text-neutral-200 leading-relaxed max-h-48 overflow-y-auto pr-2">{response.data.response}</div>
                            </div>
                            {response.data.debate && (
                                <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-md">
                                    <h3 className="text-orange-500 mb-1 text-xs uppercase tracking-wider flex justify-between">
                                        <span>Debate Critique</span>
                                        <span>Conf: {response.data.confidence}</span>
                                    </h3>
                                    <div className="text-orange-200/90 text-xs">{response.data.debate}</div>
                                </div>
                            )}
                            <div className="text-xs text-neutral-500 pt-2 flex justify-between">
                                <span>Trace: {response.data.traceId}</span>
                                <span>Tokens: {response.data.tokensUsed}</span>
                            </div>
                        </div>
                    )}
                </motion.section>

                {/* ───────────────────────────────────────────────────────── */}
                {/* STRATEGIC PLANNING                                       */}
                {/* ───────────────────────────────────────────────────────── */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl p-6"
                >
                    <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        Autonomous Planning
                    </h2>
                    <form onSubmit={handlePlan} className="mb-6">
                        <input
                            type="text"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="Set a strategic goal..."
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm focus:outline-none focus:border-purple-500/50 mb-3"
                        />
                        <button
                            disabled={loading || !goal}
                            type="submit"
                            className="w-full bg-white/10 text-white text-sm font-medium py-2 rounded-lg hover:bg-white/20 disabled:opacity-50 transition-colors border border-white/10"
                        >
                            {loading && !response && !plan ? "Planning..." : "Generate Plan"}
                        </button>
                    </form>

                    {plan && plan.data && (
                        <div className="space-y-4 text-sm mt-4 border-t border-neutral-800 pt-4">
                            <h3 className="text-neutral-500 mb-2 text-xs uppercase tracking-wider">Execution Graph</h3>
                            <div className="space-y-2">
                                {plan.data.steps?.map((step: any, i: number) => (
                                    <div key={i} className="flex gap-3 items-start bg-neutral-950 p-3 rounded border border-neutral-800/50">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs text-neutral-400">
                                            {step.step || i + 1}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="text-neutral-200">{step.action}</div>
                                            <div className="text-[10px] uppercase tracking-wider mt-1 text-neutral-500">Risk: {step.risk}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-xs text-neutral-500 pt-2 text-right">
                                Trace: {plan.data.traceId}
                            </div>
                        </div>
                    )}
                </motion.section>
            </div>

            {error && (
                <div className="max-w-6xl mx-auto mt-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}

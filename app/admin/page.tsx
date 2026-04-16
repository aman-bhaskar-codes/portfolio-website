"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { redirect } from "next/navigation";

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState("");
    const [syncRepo, setSyncRepo] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState("");

    // Edge Middleware handles actual security, but we double-check client-side mount state
    useEffect(() => {
        if (status === "unauthenticated" || (session?.user as any)?.role !== "OWNER") {
            redirect("/");
        }
        if (status === "authenticated") {
            fetchStats();
        }
    }, [status, session]);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/admin/metrics");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            } else {
                setError("Metric Sync Failed: Unauthorized Cognitive Level");
            }
        } catch (e) {
            setError("Connection Error to Core Systems");
        }
    };

    const handleSync = async () => {
        if (!syncRepo.includes("/")) {
            setSyncMessage("Format: owner/repo");
            return;
        }
        setIsSyncing(true);
        setSyncMessage("");
        try {
            const [owner, repo] = syncRepo.split("/");
            const res = await fetch("/api/admin/sync/github", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ owner, repo })
            });
            const data = await res.json();
            if (res.ok) {
                setSyncMessage(`Success: ${data.filesCount} files synced.`);
                fetchStats();
            } else {
                setSyncMessage(`Error: ${data.error}`);
            }
        } catch (e) {
            setSyncMessage("Sync failed.");
        } finally {
            setIsSyncing(false);
        }
    };

    if (status === "loading" || !stats) {
        return (
            <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
                <div className="text-accent font-mono text-sm uppercase tracking-widest animate-pulse">
                    Authenticating Cognitive Ownership...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0B0F] p-12 text-white">
            <header className="max-w-7xl mx-auto flex justify-between items-center mb-16">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tighter">SYSTEM_INTELLIGENCE</h1>
                    <p className="text-sm text-neutral-500 font-mono uppercase">Production Metrics & Latency</p>
                </div>
                <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-[10px] font-mono pulse">
                    LIVE_CONNECTION
                </div>
            </header>

            <main className="max-w-7xl mx-auto space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                        <h3 className="text-sm font-semibold font-mono mb-6 uppercase tracking-wider">GitHub Knowledge Sync</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="owner/repo"
                                className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm font-mono focus:border-accent/40 focus:outline-none transition-all"
                                value={syncRepo}
                                onChange={(e) => setSyncRepo(e.target.value)}
                            />
                            <button
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="w-full py-3 bg-accent/20 hover:bg-accent/30 text-accent font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                {isSyncing ? "SYNCING..." : "SYNC REPOSITORY"}
                            </button>
                            {syncMessage && <p className="text-[10px] font-mono opacity-60 text-center">{syncMessage}</p>}
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-center text-center">
                        <div>
                            <p className="text-[10px] text-neutral-500 font-mono uppercase mb-2">System Status</p>
                            <div className="flex items-center gap-2 text-green-500 font-bold">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                OPERATIONAL
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        { label: "Total Interactions", value: stats?.totalChats || 0, color: "text-blue-500" },
                        { label: "Avg Latency (ms)", value: Math.round(stats?.avgLatency || 0), color: "text-accent" },
                        { label: "RAG Hit Rate", value: stats?.ragStats?.find((s: any) => s.ragUsed)?._count?.id || 0, color: "text-green-500" },
                        { label: "Memory Nodes", value: "24", color: "text-purple-500" }
                    ].map((stat, i) => (
                        <div key={i} className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                            <p className="text-[10px] text-neutral-500 font-mono uppercase mb-2">{stat.label}</p>
                            <p className={`text-4xl font-extrabold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-sm font-semibold font-mono underline decoration-accent/40 decoration-2 underline-offset-4">RECENT_RECORDS</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/[0.01]">
                                <tr>
                                    <th className="p-6 text-neutral-500 font-light">Query</th>
                                    <th className="p-6 text-neutral-500 font-light text-center">Latency</th>
                                    <th className="p-6 text-neutral-500 font-light text-center">RAG</th>
                                    <th className="p-6 text-neutral-500 font-light text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentLogs?.map((log: any, i: number) => (
                                    <tr key={i} className="border-t border-white/5 hover:bg-white/[0.01] transition-colors">
                                        <td className="p-6 font-mono text-xs opacity-70 truncate max-w-xs">{log.query}</td>
                                        <td className="p-6 text-center font-bold text-accent">{log.totalLatency}ms</td>
                                        <td className="p-6 text-center">
                                            {log.ragUsed ? (
                                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                            ) : (
                                                <span className="w-2 h-2 rounded-full bg-neutral-800 inline-block" />
                                            )}
                                        </td>
                                        <td className="p-6 text-right text-xs opacity-40">{new Date(log.createdAt).toLocaleTimeString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart,
} from "recharts";

/* ─── Types ─── */
interface KPIs {
    totalChats: number;
    avgLatency: number;
    avgModelLatency: number;
    ragHitRate: number;
    cacheHitRate: number;
    memoryCount: number;
    knowledgeCount: number;
}

interface LogEntry {
    id: string;
    query: string;
    totalLatency: number;
    modelLatency: number | null;
    ragUsed: boolean;
    cacheHit: boolean;
    createdAt: string;
}

interface HealthCheck {
    status: string;
    latency?: number;
    details?: string;
}

interface HealthData {
    timestamp: string;
    checks: Record<string, HealthCheck>;
    counts: { memories: number; knowledgeChunks: number; analyticsLogs: number };
    cache: { embeddings: { size: number; maxSize: number } };
}

/* ─── Styles ─── */
const card = (glow: string): React.CSSProperties => ({
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "1.5rem",
    position: "relative" as const,
    overflow: "hidden",
    boxShadow: `0 0 40px -15px ${glow}`,
});

const kpiValue: React.CSSProperties = {
    fontSize: "2rem",
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: "0.25rem",
};

const kpiLabel: React.CSSProperties = {
    fontSize: "0.7rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#888",
};

/* ─── Component ─── */
export default function DashboardPage() {
    const [kpis, setKpis] = useState<KPIs | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [health, setHealth] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [metricsRes, healthRes] = await Promise.all([
                    fetch("/api/admin/metrics"),
                    fetch("/api/system/status"),
                ]);

                if (metricsRes.ok) {
                    const data = await metricsRes.json();
                    setKpis(data.kpis);
                    setLogs(data.recentLogs);
                }

                if (healthRes.ok) {
                    setHealth(await healthRes.json());
                }
            } catch (e) {
                console.error("Dashboard load failed:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh", background: "#0a0a0f", color: "#e0e0e0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Inter', system-ui, sans-serif",
            }}>
                <div style={{ fontSize: "1.2rem", opacity: 0.6 }}>Loading analytics...</div>
            </div>
        );
    }

    // Chart data
    const chartData = logs.map(l => ({
        time: new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        total: l.totalLatency,
        model: l.modelLatency || 0,
        rag: l.totalLatency - (l.modelLatency || 0),
    }));

    return (
        <div style={{
            minHeight: "100vh",
            background: "#0a0a0f",
            color: "#e0e0e0",
            padding: "2rem 3rem",
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                {/* Header */}
                <h1 style={{
                    fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.25rem",
                    background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                    System Intelligence Dashboard
                </h1>
                <p style={{ color: "#555", fontSize: "0.8rem", marginBottom: "2rem" }}>
                    Real-time observability for the AI platform
                </p>

                {/* KPI Cards */}
                {kpis && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
                        <div style={card("rgba(124,58,237,0.3)")}>
                            <div style={{ ...kpiValue, color: "#a78bfa" }}>{kpis.totalChats}</div>
                            <div style={kpiLabel}>Total Chats</div>
                        </div>
                        <div style={card("rgba(59,130,246,0.3)")}>
                            <div style={{ ...kpiValue, color: "#60a5fa" }}>{kpis.avgLatency}ms</div>
                            <div style={kpiLabel}>Avg Latency</div>
                        </div>
                        <div style={card("rgba(52,211,153,0.3)")}>
                            <div style={{ ...kpiValue, color: "#34d399" }}>{kpis.ragHitRate}%</div>
                            <div style={kpiLabel}>RAG Hit Rate</div>
                        </div>
                        <div style={card("rgba(251,191,36,0.3)")}>
                            <div style={{ ...kpiValue, color: "#fbbf24" }}>{kpis.cacheHitRate}%</div>
                            <div style={kpiLabel}>Cache Hit Rate</div>
                        </div>
                    </div>
                )}

                {/* Charts Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
                    {/* Latency Chart */}
                    <div style={card("rgba(124,58,237,0.15)")}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "1rem", color: "#aaa" }}>
                            Latency Breakdown (ms)
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="ragGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="modelGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="time" tick={{ fill: "#555", fontSize: 10 }} />
                                <YAxis tick={{ fill: "#555", fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                                    labelStyle={{ color: "#aaa" }}
                                />
                                <Area type="monotone" dataKey="rag" stackId="1" stroke="#a78bfa" fill="url(#ragGrad)" name="RAG" />
                                <Area type="monotone" dataKey="model" stackId="1" stroke="#60a5fa" fill="url(#modelGrad)" name="Model" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Total Latency Bar */}
                    <div style={card("rgba(59,130,246,0.15)")}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "1rem", color: "#aaa" }}>
                            Total Response Time
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="time" tick={{ fill: "#555", fontSize: 10 }} />
                                <YAxis tick={{ fill: "#555", fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                                />
                                <Bar dataKey="total" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Total (ms)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bottom Row: Health + Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {/* System Health */}
                    <div style={card("rgba(52,211,153,0.15)")}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "1rem", color: "#aaa" }}>
                            System Health
                        </div>
                        {health && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {Object.entries(health.checks).map(([name, check]) => (
                                    <div key={name} style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        padding: "0.5rem 0.75rem",
                                        background: "rgba(255,255,255,0.02)",
                                        borderRadius: "8px",
                                    }}>
                                        <span style={{ textTransform: "capitalize", fontWeight: 500, fontSize: "0.85rem" }}>{name}</span>
                                        <span style={{
                                            display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem",
                                            color: check.status === "connected" || check.status === "running" ? "#4ade80" : "#f87171",
                                        }}>
                                            <span style={{
                                                width: 8, height: 8, borderRadius: "50%",
                                                background: check.status === "connected" || check.status === "running" ? "#4ade80" : "#f87171",
                                                display: "inline-block",
                                            }} />
                                            {check.status} {check.latency ? `(${check.latency}ms)` : ""}
                                        </span>
                                    </div>
                                ))}

                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", textAlign: "center" }}>
                                        <div>
                                            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#a78bfa" }}>{health.counts.memories}</div>
                                            <div style={kpiLabel}>Memories</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#60a5fa" }}>{health.counts.knowledgeChunks}</div>
                                            <div style={kpiLabel}>Knowledge</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fbbf24" }}>{health.cache.embeddings.size}/{health.cache.embeddings.maxSize}</div>
                                            <div style={kpiLabel}>Embed Cache</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Additional Stats */}
                    {kpis && (
                        <div style={card("rgba(251,191,36,0.15)")}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "1rem", color: "#aaa" }}>
                                Performance Breakdown
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <StatRow label="Avg Model Latency" value={`${kpis.avgModelLatency}ms`} color="#60a5fa" />
                                <StatRow label="Avg RAG Latency" value={`${kpis.avgLatency - kpis.avgModelLatency}ms`} color="#a78bfa" />
                                <StatRow label="Knowledge Chunks" value={`${kpis.knowledgeCount}`} color="#34d399" />
                                <StatRow label="Visitor Memories" value={`${kpis.memoryCount}`} color="#fbbf24" />

                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#555", marginBottom: "0.5rem" }}>Quick Actions</div>
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <a href="/admin/sync" style={{
                                            padding: "0.5rem 1rem",
                                            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                                            color: "#fff",
                                            borderRadius: "8px",
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            textDecoration: "none",
                                        }}>
                                            ⚡ GitHub Sync
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "0.5rem 0.75rem",
            background: "rgba(255,255,255,0.02)",
            borderRadius: "8px",
            fontSize: "0.85rem",
        }}>
            <span style={{ color: "#aaa" }}>{label}</span>
            <span style={{ fontWeight: 600, color }}>{value}</span>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import {
    LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────

interface SystemMetrics {
    reward: { avg: number; trend: number[]; count: number };
    latency: { avg: number; p95: number; trend: number[] };
    hallucination: { avg: number; rate: number };
    identity: { avg: number; driftTrend: number[] };
    debate: { totalDebates: number; avgDiversity: number; avgRewardDelta: number };
    clusters: { total: number; strong: number; avgStrength: number };
    planning: { active: number; completed: number; failed: number };
    autonomy: { goalsGenerated: number; goalsCompleted: number; cooldownActive: boolean };
    research: { hypotheses: number; validated: number; rejected: number };
    cognition: { avgDepth: number; avgConfidence: number; avgBias: number };
    tokens: { total: number; avgPerRequest: number };
    alerts: { type: string; message: string; timestamp: string }[];
}

interface DashboardData {
    metrics: SystemMetrics;
    recentTraces: string[];
    experiments: { id: string; name: string; avgReward: number | null; status: string; createdAt: string }[];
}

// ────────────────────────────────────────────
// COLORS
// ────────────────────────────────────────────

const COLORS = {
    primary: "#7c3aed",
    secondary: "#06b6d4",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    bg: "#0a0a0f",
    card: "#111118",
    border: "#1e1e2e",
    text: "#e2e8f0",
    muted: "#64748b",
};

// ────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/metrics");
                const json = await res.json();
                setData(json);
            } catch { }
            setLoading(false);
        }
        load();
    }, [refreshKey]);

    if (loading) {
        return (
            <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: COLORS.primary, fontSize: "1.2rem", fontFamily: "'Inter', sans-serif" }}>Loading Observability Platform...</div>
            </div>
        );
    }

    if (!data?.metrics) {
        return (
            <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: COLORS.danger, fontSize: "1.2rem" }}>Failed to load metrics</div>
            </div>
        );
    }

    const m = data.metrics;

    // Prepare chart data
    const rewardTrend = m.reward.trend.map((v, i) => ({ idx: i + 1, value: v }));
    const latencyTrend = m.latency.trend.map((v, i) => ({ idx: i + 1, value: v }));
    const driftTrend = m.identity.driftTrend.map((v, i) => ({ idx: i + 1, value: v }));

    const cognitionRadar = [
        { dim: "Depth", value: m.cognition.avgDepth },
        { dim: "Confidence", value: m.cognition.avgConfidence },
        { dim: "Identity", value: m.identity.avg },
        { dim: "1 - Bias", value: 1 - m.cognition.avgBias },
        { dim: "Debate Div.", value: m.debate.avgDiversity },
        { dim: "1 - Halluc.", value: 1 - m.hallucination.avg },
    ];

    const subsystemBar = [
        { name: "Plans", active: m.planning.active, completed: m.planning.completed, failed: m.planning.failed },
    ];

    const researchBar = [
        { name: "Hypotheses", value: m.research.hypotheses, color: COLORS.primary },
        { name: "Validated", value: m.research.validated, color: COLORS.success },
        { name: "Rejected", value: m.research.rejected, color: COLORS.danger },
    ];

    return (
        <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: COLORS.text, padding: "2rem" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#fff", margin: 0 }}>
                        🧠 Twin Observability Platform
                    </h1>
                    <p style={{ color: COLORS.muted, margin: "0.25rem 0 0", fontSize: "0.85rem" }}>
                        Real-time monitoring across 12 subsystems • 16 background jobs
                    </p>
                </div>
                <button
                    onClick={() => { setLoading(true); setRefreshKey((k) => k + 1); }}
                    style={{
                        background: COLORS.primary, color: "#fff", border: "none", borderRadius: "8px",
                        padding: "0.6rem 1.2rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                    }}
                >
                    ↻ Refresh
                </button>
            </div>

            {/* Alerts */}
            {m.alerts.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                    {m.alerts.map((a, i) => (
                        <div key={i} style={{
                            background: a.type === "critical" ? "#2d1215" : "#2d2815",
                            border: `1px solid ${a.type === "critical" ? COLORS.danger : COLORS.warning}`,
                            borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "0.5rem",
                            fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem",
                        }}>
                            <span>{a.type === "critical" ? "🔴" : "🟡"}</span>
                            <span>{a.message}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* KPI Cards Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                <KPICard label="Avg Reward" value={m.reward.avg.toFixed(2)} color={m.reward.avg >= 0.75 ? COLORS.success : COLORS.warning} sub={`${m.reward.count} logs`} />
                <KPICard label="Avg Latency" value={`${m.latency.avg.toFixed(0)}ms`} color={m.latency.avg < 3000 ? COLORS.secondary : COLORS.warning} sub={`P95: ${m.latency.p95}ms`} />
                <KPICard label="Halluc. Rate" value={`${(m.hallucination.rate * 100).toFixed(1)}%`} color={m.hallucination.rate < 0.15 ? COLORS.success : COLORS.danger} sub={`Avg: ${m.hallucination.avg.toFixed(2)}`} />
                <KPICard label="Identity" value={m.identity.avg.toFixed(2)} color={m.identity.avg >= 0.8 ? COLORS.success : COLORS.warning} sub="Alignment" />
                <KPICard label="Debates" value={String(m.debate.totalDebates)} color={COLORS.primary} sub={`Δ reward: ${m.debate.avgRewardDelta >= 0 ? "+" : ""}${m.debate.avgRewardDelta.toFixed(3)}`} />
                <KPICard label="Clusters" value={`${m.clusters.strong}/${m.clusters.total}`} color={COLORS.secondary} sub={`Avg: ${m.clusters.avgStrength.toFixed(2)}`} />
                <KPICard label="Tokens" value={m.tokens.total.toLocaleString()} color={COLORS.muted} sub={`~${m.tokens.avgPerRequest.toFixed(0)}/req`} />
                <KPICard label="Autonomy" value={`${m.autonomy.goalsCompleted}/${m.autonomy.goalsGenerated}`} color={m.autonomy.cooldownActive ? COLORS.warning : COLORS.success} sub={m.autonomy.cooldownActive ? "Cooldown" : "Ready"} />
            </div>

            {/* Charts Row 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
                <ChartCard title="📈 Reward Trend">
                    {rewardTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={rewardTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                                <XAxis dataKey="idx" stroke={COLORS.muted} fontSize={11} />
                                <YAxis domain={[0, 1]} stroke={COLORS.muted} fontSize={11} />
                                <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12 }} />
                                <Line type="monotone" dataKey="value" stroke={COLORS.primary} strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <EmptyState />}
                </ChartCard>

                <ChartCard title="⚡ Latency Trend (ms)">
                    {latencyTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={latencyTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                                <XAxis dataKey="idx" stroke={COLORS.muted} fontSize={11} />
                                <YAxis stroke={COLORS.muted} fontSize={11} />
                                <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12 }} />
                                <Line type="monotone" dataKey="value" stroke={COLORS.secondary} strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <EmptyState />}
                </ChartCard>
            </div>

            {/* Charts Row 2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
                <ChartCard title="🧠 Cognitive Radar">
                    <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={cognitionRadar}>
                            <PolarGrid stroke={COLORS.border} />
                            <PolarAngleAxis dataKey="dim" stroke={COLORS.muted} fontSize={10} />
                            <PolarRadiusAxis domain={[0, 1]} tick={false} />
                            <Radar dataKey="value" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.25} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="🧪 Research">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={researchBar}>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                            <XAxis dataKey="name" stroke={COLORS.muted} fontSize={11} />
                            <YAxis stroke={COLORS.muted} fontSize={11} />
                            <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {researchBar.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="🌊 Identity Drift">
                    {driftTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={driftTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                                <XAxis dataKey="idx" stroke={COLORS.muted} fontSize={11} />
                                <YAxis stroke={COLORS.muted} fontSize={11} />
                                <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12 }} />
                                <Line type="monotone" dataKey="value" stroke={COLORS.warning} strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <EmptyState />}
                </ChartCard>
            </div>

            {/* Subsystem Status Table */}
            <ChartCard title="📊 Subsystem Status">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                            <th style={thStyle}>#</th>
                            <th style={thStyle}>Subsystem</th>
                            <th style={thStyle}>API</th>
                            <th style={thStyle}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            ["1", "Cognitive Memory", "/api/twin/memory", "ACTIVE"],
                            ["2", "Graph Clustering", "/api/twin/clusters", `${m.clusters.total} clusters`],
                            ["3", "Policy Evolution", "/api/twin/evolve", "STABLE"],
                            ["4", "Weight Tuning", "/api/twin/weights", "4 profiles"],
                            ["5", "Reward Model", "/api/twin/reward", `avg: ${m.reward.avg.toFixed(2)}`],
                            ["6", "Adversarial Eval", "/api/twin/adversarial", "Ready"],
                            ["7", "Multi-Agent Debate", "/api/twin/debate", `${m.debate.totalDebates} debates`],
                            ["8", "Long-Horizon Planning", "/api/twin/plans", `${m.planning.active}A / ${m.planning.completed}C / ${m.planning.failed}F`],
                            ["9", "Autonomous Goals", "/api/twin/goals", m.autonomy.cooldownActive ? "⏸ Cooldown" : "Ready"],
                            ["10", "Research Engine", "/api/twin/research", `${m.research.validated}V / ${m.research.rejected}R`],
                            ["11", "Meta-Cognition", "/api/twin/metacognition", `depth: ${m.cognition.avgDepth.toFixed(2)}`],
                            ["12", "Observability", "/api/metrics", "ACTIVE"],
                            ["13", "Identity", "—", "LOCKED"],
                        ].map(([num, name, api, status], i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                <td style={tdStyle}>{num}</td>
                                <td style={{ ...tdStyle, fontWeight: 600 }}>{name}</td>
                                <td style={{ ...tdStyle, color: COLORS.muted, fontFamily: "monospace", fontSize: "0.75rem" }}>{api}</td>
                                <td style={tdStyle}>
                                    <span style={{
                                        background: status.includes("ACTIVE") || status.includes("STABLE") || status === "Ready" || status === "LOCKED"
                                            ? "#0d3320" : status.includes("Cooldown") ? "#2d2815" : "#1a1a2e",
                                        color: status.includes("ACTIVE") || status.includes("STABLE") || status === "Ready" || status === "LOCKED"
                                            ? COLORS.success : status.includes("Cooldown") ? COLORS.warning : COLORS.text,
                                        padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem",
                                    }}>{status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ChartCard>

            {/* Experiments */}
            {data.experiments && data.experiments.length > 0 && (
                <div style={{ marginTop: "1.5rem" }}>
                    <ChartCard title="🧪 Recent Experiments">
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                    <th style={thStyle}>Name</th>
                                    <th style={thStyle}>Reward</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.experiments.map((e) => (
                                    <tr key={e.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                        <td style={{ ...tdStyle, fontWeight: 600 }}>{e.name}</td>
                                        <td style={tdStyle}>{e.avgReward?.toFixed(3) ?? "—"}</td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                color: e.status === "completed" ? COLORS.success : e.status === "failed" ? COLORS.danger : COLORS.warning,
                                            }}>{e.status}</span>
                                        </td>
                                        <td style={{ ...tdStyle, color: COLORS.muted }}>{new Date(e.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </ChartCard>
                </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: "2rem", textAlign: "center", color: COLORS.muted, fontSize: "0.75rem" }}>
                Digital Twin Observability • 13 Subsystems • 16 Background Jobs • {new Date().toISOString().slice(0, 19)}
            </div>
        </div>
    );
}

// ────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────

function KPICard({ label, value, color, sub }: { label: string; value: string; color: string; sub: string }) {
    return (
        <div style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: "12px",
            padding: "1.2rem", transition: "all 0.2s",
        }}>
            <div style={{ color: COLORS.muted, fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
            <div style={{ color, fontSize: "1.6rem", fontWeight: 700, margin: "0.25rem 0" }}>{value}</div>
            <div style={{ color: COLORS.muted, fontSize: "0.7rem" }}>{sub}</div>
        </div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{
            background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: "12px",
            padding: "1.2rem",
        }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem", color: "#fff" }}>{title}</div>
            {children}
        </div>
    );
}

function EmptyState() {
    return (
        <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.muted, fontSize: "0.85rem" }}>
            No data yet — run interactions to generate metrics
        </div>
    );
}

// ────────────────────────────────────────────
// STYLES
// ────────────────────────────────────────────

const thStyle: React.CSSProperties = { textAlign: "left", padding: "0.6rem 0.75rem", color: COLORS.muted, fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" };
const tdStyle: React.CSSProperties = { padding: "0.6rem 0.75rem", color: COLORS.text };

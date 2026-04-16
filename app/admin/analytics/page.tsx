"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    CartesianGrid,
    Legend,
} from "recharts";
import {
    Activity,
    Cpu,
    Zap,
    Brain,
    BarChart3,
    TrendingUp,
    Shield,
    Clock,
} from "lucide-react";

const CHART_COLORS = ["#8B5CF6", "#06B6D4", "#F472B6", "#34D399", "#FBBF24"];

interface KPIs {
    totalQueries: number;
    avgLatency: number;
    avgModelLatency: number;
    avgConfidence: number;
    avgEvalScore: number;
    ragHitRate: number;
    cacheHitRate: number;
    selfHealRate: number;
}

interface AnalyticsData {
    kpis: KPIs;
    modelUsage: { name: string; value: number; avgLatency: number }[];
    evalByTier: { tier: string; avgEval: number; count: number }[];
    topQueries: { query: string; count: number }[];
    recentLogs: any[];
}

export default function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/admin/analytics")
            .then((res) => {
                if (!res.ok) throw new Error("Unauthorized or server error");
                return res.json();
            })
            .then(setData)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                >
                    <Brain className="w-10 h-10 text-purple-500" />
                </motion.div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-red-400">
                <p>{error || "Failed to load analytics"}</p>
            </div>
        );
    }

    const { kpis, modelUsage, evalByTier, topQueries, recentLogs } = data;

    // Prepare time-series data
    const latencyTrend = recentLogs.map((log: any, i: number) => ({
        idx: i,
        latency: log.totalLatency,
        modelLatency: log.modelLatency || 0,
        confidence: Math.round((log.ragConfidence || 0) * 100),
        time: new Date(log.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        }),
    }));

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-6 md:p-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-7 h-7 text-purple-400" />
                    <h1 className="text-3xl font-bold">AI Analytics</h1>
                </div>
                <p className="text-gray-500 font-mono text-sm tracking-wider">
                    ORCHESTRATION_TELEMETRY · MULTI-MODEL INTELLIGENCE
                </p>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <KPICard
                    icon={<Activity className="w-5 h-5" />}
                    label="Total Queries"
                    value={kpis.totalQueries.toLocaleString()}
                    color="text-purple-400"
                />
                <KPICard
                    icon={<Clock className="w-5 h-5" />}
                    label="Avg Latency"
                    value={`${kpis.avgLatency}ms`}
                    color="text-cyan-400"
                />
                <KPICard
                    icon={<TrendingUp className="w-5 h-5" />}
                    label="Avg Eval Score"
                    value={kpis.avgEvalScore > 0 ? kpis.avgEvalScore.toFixed(2) : "—"}
                    color="text-pink-400"
                />
                <KPICard
                    icon={<Zap className="w-5 h-5" />}
                    label="RAG Hit Rate"
                    value={`${kpis.ragHitRate}%`}
                    color="text-green-400"
                />
                <KPICard
                    icon={<Cpu className="w-5 h-5" />}
                    label="Model Latency"
                    value={`${kpis.avgModelLatency}ms`}
                    color="text-yellow-400"
                />
                <KPICard
                    icon={<Shield className="w-5 h-5" />}
                    label="Cache Hit Rate"
                    value={`${kpis.cacheHitRate}%`}
                    color="text-emerald-400"
                />
                <KPICard
                    icon={<Brain className="w-5 h-5" />}
                    label="Avg Confidence"
                    value={kpis.avgConfidence > 0 ? `${Math.round(kpis.avgConfidence * 100)}%` : "—"}
                    color="text-violet-400"
                />
                <KPICard
                    icon={<Activity className="w-5 h-5" />}
                    label="Self-Heal Rate"
                    value={`${kpis.selfHealRate}%`}
                    color="text-orange-400"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                {/* Latency Over Time */}
                <ChartCard title="Latency Trend" subtitle="Total vs Model Latency (ms)">
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={latencyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                            <XAxis
                                dataKey="time"
                                stroke="#555"
                                fontSize={11}
                                tickLine={false}
                            />
                            <YAxis stroke="#555" fontSize={11} tickLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1a1a2e",
                                    border: "1px solid #333",
                                    borderRadius: "8px",
                                    color: "#fff",
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="latency"
                                stroke="#8B5CF6"
                                strokeWidth={2}
                                dot={false}
                                name="Total"
                            />
                            <Line
                                type="monotone"
                                dataKey="modelLatency"
                                stroke="#06B6D4"
                                strokeWidth={2}
                                dot={false}
                                name="Model"
                            />
                            <Legend />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Model Usage Pie */}
                <ChartCard title="Model Tier Usage" subtitle="FAST vs DEEP distribution">
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={modelUsage}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                            >
                                {modelUsage.map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1a1a2e",
                                    border: "1px solid #333",
                                    borderRadius: "8px",
                                    color: "#fff",
                                }}
                                formatter={(value: any, name: any, props: any) => [
                                    `${value} queries (avg ${props.payload.avgLatency}ms)`,
                                    name,
                                ]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Confidence Over Time */}
                <ChartCard title="RAG Confidence Trend" subtitle="Retrieval confidence (%)">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={latencyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                            <XAxis
                                dataKey="time"
                                stroke="#555"
                                fontSize={11}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#555"
                                fontSize={11}
                                tickLine={false}
                                domain={[0, 100]}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1a1a2e",
                                    border: "1px solid #333",
                                    borderRadius: "8px",
                                    color: "#fff",
                                }}
                            />
                            <Bar
                                dataKey="confidence"
                                fill="#8B5CF6"
                                radius={[4, 4, 0, 0]}
                                name="Confidence %"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Eval Score by Tier */}
                <ChartCard title="Eval Score by Model Tier" subtitle="Average quality score per tier">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={evalByTier}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                            <XAxis
                                dataKey="tier"
                                stroke="#555"
                                fontSize={12}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#555"
                                fontSize={11}
                                tickLine={false}
                                domain={[0, 1]}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1a1a2e",
                                    border: "1px solid #333",
                                    borderRadius: "8px",
                                    color: "#fff",
                                }}
                                formatter={(value: any) => [
                                    Number(value).toFixed(2),
                                    "Avg Eval",
                                ]}
                            />
                            <Bar
                                dataKey="avgEval"
                                fill="#06B6D4"
                                radius={[4, 4, 0, 0]}
                                name="Avg Score"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Recent Queries Table */}
            <ChartCard title="Recent Queries" subtitle="Latest orchestrated requests">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 border-b border-gray-800">
                                <th className="text-left py-3 px-2">Query</th>
                                <th className="text-center py-3 px-2">Model</th>
                                <th className="text-center py-3 px-2">Tier</th>
                                <th className="text-center py-3 px-2">Latency</th>
                                <th className="text-center py-3 px-2">Confidence</th>
                                <th className="text-center py-3 px-2">Eval</th>
                                <th className="text-center py-3 px-2">RAG</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentLogs.slice(-20).reverse().map((log: any) => (
                                <tr
                                    key={log.id}
                                    className="border-b border-gray-800/50 hover:bg-white/[0.02] transition"
                                >
                                    <td className="py-2.5 px-2 max-w-[200px] truncate text-gray-300">
                                        {log.query}
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono text-xs text-gray-400">
                                        {log.model || "—"}
                                    </td>
                                    <td className="py-2.5 px-2 text-center">
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs font-bold ${log.modelTier === "DEEP"
                                                    ? "bg-purple-500/20 text-purple-300"
                                                    : "bg-cyan-500/20 text-cyan-300"
                                                }`}
                                        >
                                            {log.modelTier || "—"}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono text-xs">
                                        {log.totalLatency}ms
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono text-xs">
                                        {log.ragConfidence != null
                                            ? `${Math.round(log.ragConfidence * 100)}%`
                                            : "—"}
                                    </td>
                                    <td className="py-2.5 px-2 text-center font-mono text-xs">
                                        {log.evalScore != null
                                            ? log.evalScore.toFixed(2)
                                            : "—"}
                                    </td>
                                    <td className="py-2.5 px-2 text-center">
                                        {log.ragUsed ? (
                                            <span className="text-green-400">✓</span>
                                        ) : (
                                            <span className="text-gray-600">✗</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </ChartCard>

            {/* Top Queries */}
            {topQueries.length > 0 && (
                <div className="mt-6">
                    <ChartCard title="Top Queries" subtitle="Most frequent questions">
                        <div className="space-y-2">
                            {topQueries.map((q: any, i: number) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition"
                                >
                                    <span className="text-gray-300 text-sm truncate max-w-[80%]">
                                        {q.query}
                                    </span>
                                    <span className="text-purple-400 font-mono text-sm font-bold">
                                        ×{q.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </ChartCard>
                </div>
            )}
        </div>
    );
}

/* ── Reusable Components ── */

function KPICard({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5"
        >
            <div className={`${color} mb-2`}>{icon}</div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">
                {label}
            </p>
        </motion.div>
    );
}

function ChartCard({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-0.5">{title}</h3>
            <p className="text-gray-500 text-xs mb-4 uppercase tracking-wider">
                {subtitle}
            </p>
            {children}
        </div>
    );
}

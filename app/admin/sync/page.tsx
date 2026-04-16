"use client";

import { useState } from "react";

interface SyncDetail {
    repo: string;
    status: "updated" | "skipped" | "not-published" | "failed";
    reason?: string;
    chunks?: number;
}

interface SyncResponse {
    success: boolean;
    updated: number;
    skipped: number;
    totalChunks: number;
    details: SyncDetail[];
}

export default function SyncPage() {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SyncResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSync() {
        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const res = await fetch("/api/github/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ limit: 10 }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Sync failed");
            }

            setResults(await res.json());
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const statusColor = (s: string) => {
        if (s === "updated") return "#4ade80";
        if (s === "skipped") return "#fbbf24";
        if (s === "not-published") return "#888";
        return "#f87171";
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "#0a0a0f",
            color: "#e0e0e0",
            padding: "3rem",
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            <div style={{ maxWidth: "640px", margin: "0 auto" }}>
                <h1 style={{
                    fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem",
                    background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                    Incremental GitHub Sync
                </h1>
                <p style={{ color: "#555", fontSize: "0.8rem", marginBottom: "2rem" }}>
                    Only re-processes repos that changed since last sync. Skips up-to-date projects.
                </p>

                <button
                    onClick={handleSync}
                    disabled={loading}
                    style={{
                        padding: "0.75rem 2rem",
                        background: loading ? "linear-gradient(135deg, #333, #444)" : "linear-gradient(135deg, #7c3aed, #3b82f6)",
                        color: "#fff", border: "none", borderRadius: "12px",
                        fontSize: "0.9rem", fontWeight: 600,
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.7 : 1,
                        transition: "all 0.2s ease",
                    }}
                >
                    {loading ? "⟳ Syncing..." : "🔄 Sync Now"}
                </button>

                {error && (
                    <div style={{
                        marginTop: "1.5rem", padding: "1rem",
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: "8px", color: "#f87171", fontSize: "0.85rem",
                    }}>
                        {error}
                    </div>
                )}

                {results && (
                    <div style={{ marginTop: "2rem" }}>
                        {/* Summary Cards */}
                        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
                            <div style={{
                                flex: 1, padding: "1rem", textAlign: "center",
                                background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "10px",
                            }}>
                                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#4ade80" }}>{results.updated}</div>
                                <div style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase" }}>Updated</div>
                            </div>
                            <div style={{
                                flex: 1, padding: "1rem", textAlign: "center",
                                background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "10px",
                            }}>
                                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fbbf24" }}>{results.skipped}</div>
                                <div style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase" }}>Skipped</div>
                            </div>
                            <div style={{
                                flex: 1, padding: "1rem", textAlign: "center",
                                background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "10px",
                            }}>
                                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#a78bfa" }}>{results.totalChunks}</div>
                                <div style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase" }}>Chunks</div>
                            </div>
                        </div>

                        {/* Per-repo Details */}
                        <div style={{
                            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "10px", overflow: "hidden",
                        }}>
                            {results.details.map((r, i) => (
                                <div key={i} style={{
                                    padding: "0.65rem 1rem",
                                    borderBottom: i < results.details.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    fontSize: "0.82rem",
                                }}>
                                    <span style={{ fontWeight: 500 }}>{r.repo}</span>
                                    <span style={{ color: statusColor(r.status), fontSize: "0.75rem" }}>
                                        {r.status}
                                        {r.reason ? ` · ${r.reason}` : ""}
                                        {r.chunks ? ` · ${r.chunks} chunks` : ""}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

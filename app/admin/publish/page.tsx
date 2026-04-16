"use client";

import { useState } from "react";

interface PublishResult {
    success: boolean;
    project: { name: string; language: string; stars: number };
    knowledgeChunks: number;
}

export default function PublishProjectPage() {
    const [githubUrl, setGithubUrl] = useState("");
    const [tags, setTags] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PublishResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handlePublish() {
        if (!githubUrl.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/projects/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    githubUrl: githubUrl.trim(),
                    tags: tags.split(",").map(t => t.trim()).filter(Boolean),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Publish failed");
            }

            const data: PublishResult = await res.json();
            setResult(data);
            setGithubUrl("");
            setTags("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: "100vh",
            background: "#0a0a0f",
            color: "#e0e0e0",
            padding: "3rem",
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            <div style={{ maxWidth: "560px", margin: "0 auto" }}>
                <h1 style={{
                    fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem",
                    background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                    Publish Project
                </h1>
                <p style={{ color: "#555", fontSize: "0.8rem", marginBottom: "2rem" }}>
                    Paste a GitHub URL → auto-summarize, embed, and make it live.
                </p>

                {/* GitHub URL Input */}
                <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#888", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        GitHub Repository URL
                    </label>
                    <input
                        type="text"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username/repo"
                        style={{
                            width: "100%",
                            padding: "0.8rem 1rem",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "10px",
                            color: "#e0e0e0",
                            fontSize: "0.9rem",
                            outline: "none",
                            transition: "border-color 0.2s",
                            boxSizing: "border-box",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.5)"}
                        onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                    />
                </div>

                {/* Tags Input */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", fontSize: "0.75rem", color: "#888", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Tags (comma separated)
                    </label>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="AI, RAG, Full-Stack"
                        style={{
                            width: "100%",
                            padding: "0.8rem 1rem",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "10px",
                            color: "#e0e0e0",
                            fontSize: "0.9rem",
                            outline: "none",
                            transition: "border-color 0.2s",
                            boxSizing: "border-box",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.5)"}
                        onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                    />
                </div>

                {/* Publish Button */}
                <button
                    onClick={handlePublish}
                    disabled={loading || !githubUrl.trim()}
                    style={{
                        padding: "0.75rem 2rem",
                        background: loading
                            ? "linear-gradient(135deg, #333, #444)"
                            : "linear-gradient(135deg, #7c3aed, #3b82f6)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "12px",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading || !githubUrl.trim() ? 0.6 : 1,
                        transition: "all 0.2s ease",
                        width: "100%",
                    }}
                >
                    {loading ? "⟳ Publishing..." : "⚡ Publish Project"}
                </button>

                {/* Error */}
                {error && (
                    <div style={{
                        marginTop: "1.5rem", padding: "1rem",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: "10px", color: "#f87171", fontSize: "0.85rem",
                    }}>
                        {error}
                    </div>
                )}

                {/* Success */}
                {result && (
                    <div style={{
                        marginTop: "1.5rem", padding: "1.25rem",
                        background: "rgba(52,211,153,0.08)",
                        border: "1px solid rgba(52,211,153,0.2)",
                        borderRadius: "12px",
                    }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4ade80", marginBottom: "0.75rem" }}>
                            ✓ Published Successfully
                        </div>
                        <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.8rem", color: "#aaa" }}>
                            <span><strong style={{ color: "#e0e0e0" }}>{result.project.name}</strong></span>
                            <span>{result.project.language || "—"}</span>
                            <span>★ {result.project.stars}</span>
                            <span>{result.knowledgeChunks} RAG chunks</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

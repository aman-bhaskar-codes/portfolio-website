"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
} from "reactflow";
import "reactflow/dist/style.css";

export default function KnowledgeGraphPage() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/admin/knowledge-graph");
                if (res.ok) {
                    const data = await res.json();
                    // Style nodes based on type
                    const styledNodes = data.nodes.map((n: any) => ({
                        ...n,
                        style: getNodeStyle(n.data.type),
                    }));
                    const styledEdges = data.edges.map((e: any) => ({
                        ...e,
                        style: { stroke: e.animated ? "#7c3aed" : "#3b82f6", strokeWidth: 1.5 },
                    }));
                    setNodes(styledNodes);
                    setEdges(styledEdges);
                }
            } catch (e) {
                console.error("Graph load failed:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const onNodeClick = useCallback((_: any, node: Node) => {
        setSelected(node.data);
    }, []);

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh", background: "#0a0a0f", color: "#e0e0e0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Inter', system-ui, sans-serif",
            }}>
                <div style={{ opacity: 0.6 }}>Loading knowledge graph...</div>
            </div>
        );
    }

    return (
        <div style={{
            height: "100vh",
            background: "#0a0a0f",
            fontFamily: "'Inter', system-ui, sans-serif",
            position: "relative",
        }}>
            {/* Header */}
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
                padding: "1.25rem 2rem",
                background: "linear-gradient(to bottom, rgba(10,10,15,0.95), transparent)",
            }}>
                <h1 style={{
                    fontSize: "1.2rem", fontWeight: 700, margin: 0,
                    background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                    Knowledge Graph
                </h1>
                <p style={{ fontSize: "0.7rem", color: "#555", margin: 0 }}>
                    {nodes.length} nodes · {edges.length} connections
                </p>
            </div>

            {/* React Flow */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                fitView
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#1a1a2e" gap={24} />
                <Controls
                    style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                />
                <MiniMap
                    style={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.08)" }}
                    nodeColor={(n) => {
                        if (n.data?.type === "core") return "#a78bfa";
                        if (n.data?.type === "project") return "#7c3aed";
                        if (n.data?.type === "memory") return "#3b82f6";
                        return "#555";
                    }}
                />
            </ReactFlow>

            {/* Detail Panel */}
            {selected && (
                <div style={{
                    position: "absolute", bottom: "1.5rem", right: "1.5rem",
                    width: 320, maxHeight: 280,
                    background: "rgba(15,15,25,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 16, padding: "1.25rem",
                    zIndex: 20, overflow: "auto",
                    boxShadow: "0 0 40px -10px rgba(124,58,237,0.3)",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <span style={{
                            fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em",
                            color: selected.type === "project" ? "#a78bfa" : "#60a5fa",
                            fontWeight: 600,
                        }}>
                            {selected.type}
                        </span>
                        <button
                            onClick={() => setSelected(null)}
                            style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "1rem" }}
                        >
                            ✕
                        </button>
                    </div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e0e0e0", marginBottom: "0.5rem" }}>
                        {selected.label}
                    </div>
                    {selected.content && (
                        <div style={{ fontSize: "0.78rem", color: "#888", lineHeight: 1.5 }}>
                            {selected.content}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function getNodeStyle(type: string): React.CSSProperties {
    const base: React.CSSProperties = {
        borderRadius: "12px",
        padding: "8px 14px",
        fontSize: "11px",
        fontWeight: 600,
        color: "#e0e0e0",
        border: "1px solid",
    };

    switch (type) {
        case "core":
            return {
                ...base,
                background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                borderColor: "rgba(124,58,237,0.5)",
                fontSize: "13px",
                padding: "12px 20px",
                boxShadow: "0 0 30px rgba(124,58,237,0.4)",
            };
        case "project":
            return {
                ...base,
                background: "rgba(124,58,237,0.15)",
                borderColor: "rgba(124,58,237,0.3)",
            };
        case "memory":
            return {
                ...base,
                background: "rgba(59,130,246,0.15)",
                borderColor: "rgba(59,130,246,0.3)",
            };
        default:
            return {
                ...base,
                background: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.1)",
            };
    }
}

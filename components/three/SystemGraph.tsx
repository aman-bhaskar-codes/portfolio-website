"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const NODES = [
    { id: "input", label: "User Input", x: 100, y: 150, info: "Semantic Intent @ 0ms" },
    { id: "memory", label: "Long-term Memory", x: 300, y: 50, info: "pgvector Index (Cosine Similarity)" },
    { id: "brain", label: "Cognitive Engine", x: 500, y: 150, info: "Ollama / Qwen2.5:1.5B" },
    { id: "tools", label: "Tool Registry", x: 300, y: 250, info: "Function Dispatch Loop" },
    { id: "exec", label: "Execution Layer", x: 700, y: 150, info: "System State Synthesis" },
];

const CONNECTIONS = [
    { from: "input", to: "memory" },
    { from: "input", to: "brain" },
    { from: "memory", to: "brain" },
    { from: "brain", to: "tools" },
    { from: "tools", to: "brain" },
    { from: "brain", to: "exec" },
];

export default function SystemGraph() {
    const [activeNode, setActiveNode] = useState<string | null>(null);

    return (
        <div className="relative w-full aspect-[16/6] bg-bg-surface border border-border rounded-3xl overflow-hidden p-12 group">
            {/* 🌌 Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#8B5CF6_1px,transparent_1px)] [background-size:32px_32px]" />

            <svg className="w-full h-full relative z-10 overflow-visible">
                {/* 🖇️ Connections */}
                {CONNECTIONS.map((conn, i) => {
                    const from = NODES.find(n => n.id === conn.from)!;
                    const to = NODES.find(n => n.id === conn.to)!;

                    return (
                        <g key={`conn-${i}`}>
                            <motion.path
                                d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                                stroke="var(--border)"
                                strokeWidth="1"
                                fill="none"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.3 }}
                                transition={{ duration: 1.5, delay: i * 0.1 }}
                            />
                            <motion.circle
                                r="3"
                                fill="var(--accent)"
                                initial={{ offsetDistance: "0%" }}
                                animate={{ offsetDistance: "100%" }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: i * 0.5
                                }}
                                style={{
                                    offsetPath: `path('M ${from.x} ${from.y} L ${to.x} ${to.y}')`,
                                    opacity: 0.8,
                                    filter: "blur(2px)"
                                }}
                            />
                        </g>
                    );
                })}

                {/* 🟢 Nodes */}
                {NODES.map((node) => (
                    <g
                        key={node.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setActiveNode(node.id)}
                        onMouseLeave={() => setActiveNode(null)}
                    >
                        <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r="6"
                            fill={activeNode === node.id ? "var(--accent)" : "var(--bg-elevated)"}
                            stroke={activeNode === node.id ? "var(--accent)" : "var(--border)"}
                            strokeWidth="2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.5 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        />

                        <foreignObject
                            x={node.x + 15}
                            y={node.y - 12}
                            width="200"
                            height="30"
                            className="pointer-events-none"
                        >
                            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                                {node.label}
                            </div>
                        </foreignObject>

                        <AnimatePresence>
                            {activeNode === node.id && (
                                <motion.foreignObject
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    x={node.x + 15}
                                    y={node.y + 10}
                                    width="220"
                                    height="40"
                                    className="pointer-events-none"
                                >
                                    <div className="text-[9px] font-mono text-accent italic">
                                        {node.info}
                                    </div>
                                </motion.foreignObject>
                            )}
                        </AnimatePresence>
                    </g>
                ))}
            </svg>

            {/* 🏷️ Status Badge */}
            <div className="absolute top-8 left-8 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-neutral-600">
                    Cognitive_Loop_Running
                </span>
            </div>
        </div>
    );
}

import { AnimatePresence } from "framer-motion";

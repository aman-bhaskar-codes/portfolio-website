"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Brain } from "lucide-react";
import NodePanel from "@/components/knowledge/NodePanel";
import Navbar from "@/components/layout/Navbar";

const GraphScene = dynamic(() => import("@/components/knowledge/GraphScene"), { ssr: false });

interface GraphData {
    nodes: any[];
    edges: any[];
}

export default function KnowledgePage() {
    const [data, setData] = useState<GraphData | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/knowledge/graph")
            .then((res) => res.json())
            .then((d) => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const handleSelect = useCallback((id: string) => {
        setSelectedId((prev) => (prev === id ? null : id));
    }, []);

    const selectedNode = data?.nodes.find((n: any) => n.id === selectedId) || null;

    return (
        <main className="h-screen bg-bg-base text-white relative overflow-hidden">
            <Navbar />

            {/* Header overlay */}
            <div className="absolute top-24 left-8 z-20 space-y-3 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Brain size={18} className="text-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Knowledge Graph</h1>
                        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                            NEURAL_MAP v4.0 · {data?.nodes.length || 0} nodes · {data?.edges.length || 0} connections
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Legend */}
            <div className="absolute bottom-8 left-8 z-20 space-y-2 pointer-events-none">
                <div className="flex gap-4 text-[10px] font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> Core</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> System</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-500" /> Project</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Research</span>
                </div>
                <p className="text-[10px] text-neutral-600">Click nodes to inspect · Drag to orbit · Scroll to zoom</p>
            </div>

            {/* Node detail panel */}
            <NodePanel node={selectedNode} onClose={() => setSelectedId(null)} />

            {/* 3D Canvas */}
            {loading ? (
                <div className="h-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                </div>
            ) : data && data.nodes.length > 0 ? (
                <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
                    <GraphScene
                        nodes={data.nodes}
                        edges={data.edges}
                        selectedId={selectedId}
                        onSelect={handleSelect}
                    />
                </Canvas>
            ) : (
                <div className="h-full flex items-center justify-center text-neutral-500 font-mono text-sm">
                    No knowledge data available
                </div>
            )}
        </main>
    );
}

"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float, Line, Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

const NODE_TYPES = {
    BRAIN: { color: "#8B5CF6", size: 0.5 },
    PROJECT: { color: "#6366F1", size: 0.3 },
    MEMORY: { color: "#F472B6", size: 0.2 },
};

function Connection({ start, end, active }: { start: [number, number, number], end: [number, number, number], active: boolean }) {
    const lineRef = useRef<any>(null);

    useFrame((state) => {
        if (lineRef.current) {
            lineRef.current.material.dashOffset -= 0.01;
            lineRef.current.material.opacity = THREE.MathUtils.lerp(lineRef.current.material.opacity, active ? 0.6 : 0.1, 0.1);
        }
    });

    return (
        <Line
            ref={lineRef}
            points={[start, end]}
            color="#8B5CF6"
            lineWidth={1}
            dashed
            dashScale={5}
            transparent
            opacity={0.1}
        />
    );
}

function GraphNode({ position, title, type, active }: { position: [number, number, number], title: string, type: keyof typeof NODE_TYPES, active: boolean }) {
    const nodeRef = useRef<THREE.Mesh>(null);
    const color = NODE_TYPES[type].color;
    const size = NODE_TYPES[type].size;

    useFrame((state) => {
        if (nodeRef.current) {
            const scale = active ? 1.5 : 1;
            nodeRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group position={position}>
                <Sphere ref={nodeRef} args={[size, 32, 32]}>
                    <MeshDistortMaterial
                        color={color}
                        speed={active ? 5 : 2}
                        distort={active ? 0.4 : 0.2}
                        radius={1}
                        emissive={color}
                        emissiveIntensity={active ? 2 : 0.5}
                    />
                </Sphere>
                <Text
                    position={[0, -size - 0.4, 0]}
                    fontSize={0.1}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    fillOpacity={active ? 1 : 0.3}
                >
                    {title.toUpperCase()}
                </Text>
            </group>
        </Float>
    );
}

function GraphCore() {
    const [activeNodes, setActiveNodes] = useState<string[]>([]);

    // Static nodes representing the graph architecture
    const nodes = useMemo(() => [
        { id: "brain", title: "AI_CORE", type: "BRAIN" as const, pos: [0, 0, 0] as [number, number, number] },
        { id: "repo", title: "RepoMind", type: "PROJECT" as const, pos: [-3, 2, -1] as [number, number, number] },
        { id: "cogni", title: "CogniBase", type: "PROJECT" as const, pos: [3, 2, -2] as [number, number, number] },
        { id: "lux", title: "LuxuryAI", type: "PROJECT" as const, pos: [0, 3, 2] as [number, number, number] },
        { id: "mem1", title: "Mem_Block_01", type: "MEMORY" as const, pos: [-2, -2, 1] as [number, number, number] },
        { id: "mem2", title: "Mem_Block_02", type: "MEMORY" as const, pos: [2, -2, 1] as [number, number, number] },
        { id: "sys", title: "System_Graph", type: "PROJECT" as const, pos: [4, -1, -3] as [number, number, number] },
    ], []);

    useEffect(() => {
        // Listen for RAG events to light up nodes
        const handleRag = (e: any) => {
            // Logic to parse sources and activate nodes
            setActiveNodes(["brain", "repo", "mem1"]); // Demo activation
            setTimeout(() => setActiveNodes([]), 3000);
        };
        window.addEventListener("rag-search", handleRag);
        return () => window.removeEventListener("rag-search", handleRag);
    }, []);

    return (
        <group>
            {nodes.map(node => (
                <GraphNode
                    key={node.id}
                    position={node.pos}
                    title={node.title}
                    type={node.type}
                    active={activeNodes.includes(node.id)}
                />
            ))}

            {/* Brain to Projects */}
            <Connection start={[0, 0, 0]} end={[-3, 2, -1]} active={activeNodes.includes("repo")} />
            <Connection start={[0, 0, 0]} end={[3, 2, -2]} active={activeNodes.includes("cogni")} />
            <Connection start={[0, 0, 0]} end={[0, 3, 2]} active={activeNodes.includes("lux")} />

            {/* Brain to Memories */}
            <Connection start={[0, 0, 0]} end={[-2, -2, 1]} active={activeNodes.includes("mem1")} />
            <Connection start={[0, 0, 0]} end={[2, -2, 1]} active={activeNodes.includes("mem2")} />
        </group>
    );
}

export default function KnowledgeGraph() {
    return (
        <div className="w-full h-[600px] border border-white/5 bg-black/20 rounded-3xl backdrop-blur-3xl overflow-hidden relative group">
            <div className="absolute top-8 left-8 z-10 space-y-2 pointer-events-none">
                <h3 className="text-sm font-bold tracking-widest text-white/40">GRAPH_ENGINE_v4.0</h3>
                <p className="text-[10px] font-mono text-accent">STATUS: SYNCED_WITH_RAG_PIPELINE</p>
            </div>

            <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <GraphCore />
            </Canvas>

            <div className="absolute bottom-8 right-8 z-10 pointer-events-none">
                <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Neural_Retrieval_Active</span>
                </div>
            </div>
        </div>
    );
}

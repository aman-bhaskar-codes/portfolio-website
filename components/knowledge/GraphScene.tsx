"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, Line, Sphere, MeshDistortMaterial, OrbitControls, Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";

/* ── Types ── */
interface GraphNode {
    id: string;
    label: string;
    type: string;
    description?: string;
    tags?: string[];
    meta?: Record<string, any>;
}

interface GraphEdge {
    source: string;
    target: string;
    label?: string;
}

/* ── Color + Size by Type ── */
const TYPE_CONFIG: Record<string, { color: string; size: number }> = {
    core: { color: "#8B5CF6", size: 0.6 },
    system: { color: "#6366F1", size: 0.35 },
    project: { color: "#06B6D4", size: 0.3 },
    research: { color: "#10B981", size: 0.3 },
};

/* ── 3D Node ── */
function Node3D({
    node,
    position,
    isSelected,
    onSelect,
}: {
    node: GraphNode;
    position: [number, number, number];
    isSelected: boolean;
    onSelect: (id: string) => void;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const config = TYPE_CONFIG[node.type] || TYPE_CONFIG.project;

    useFrame(() => {
        if (meshRef.current) {
            const target = isSelected ? 1.4 : 1;
            meshRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
        }
    });

    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
            <group position={position}>
                <Sphere
                    ref={meshRef}
                    args={[config.size, 32, 32]}
                    onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
                >
                    <MeshDistortMaterial
                        color={config.color}
                        speed={isSelected ? 4 : 1.5}
                        distort={isSelected ? 0.35 : 0.15}
                        radius={1}
                        emissive={config.color}
                        emissiveIntensity={isSelected ? 1.5 : 0.4}
                        roughness={0.2}
                    />
                </Sphere>
                <Text
                    position={[0, -(config.size + 0.3), 0]}
                    fontSize={0.12}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    fillOpacity={isSelected ? 1 : 0.4}
                    font="/fonts/inter.woff"
                    maxWidth={2}
                >
                    {node.label.length > 18 ? node.label.slice(0, 18) + "…" : node.label}
                </Text>
            </group>
        </Float>
    );
}

/* ── Connection Line ── */
function Edge3D({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
    return (
        <Line
            points={[start, end]}
            color="#6366F1"
            lineWidth={0.8}
            transparent
            opacity={0.15}
        />
    );
}

/* ── Layout: Distribute nodes in 3D sphere ── */
function computePositions(nodes: GraphNode[]): Map<string, [number, number, number]> {
    const map = new Map<string, [number, number, number]>();
    const coreIdx = nodes.findIndex((n) => n.type === "core");

    nodes.forEach((node, i) => {
        if (node.type === "core") {
            map.set(node.id, [0, 0, 0]);
        } else {
            // Fibonacci sphere distribution
            const phi = Math.acos(1 - (2 * (i + 1)) / (nodes.length + 1));
            const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 1);
            const r = node.type === "system" ? 3.5 : 5.5;
            map.set(node.id, [
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta) * 0.6,
                r * Math.cos(phi),
            ]);
        }
    });

    return map;
}

/* ── Scene Assembly ── */
export default function GraphScene({
    nodes,
    edges,
    selectedId,
    onSelect,
}: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    const positions = useMemo(() => computePositions(nodes), [nodes]);

    return (
        <>
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={1.2} color="#8B5CF6" />
            <pointLight position={[-10, -5, -10]} intensity={0.6} color="#6366F1" />

            <Sparkles count={80} scale={16} size={1.5} speed={0.3} opacity={0.15} color="#a78bfa" />

            {/* Nodes */}
            {nodes.map((node) => {
                const pos = positions.get(node.id);
                if (!pos) return null;
                return (
                    <Node3D
                        key={node.id}
                        node={node}
                        position={pos}
                        isSelected={selectedId === node.id}
                        onSelect={onSelect}
                    />
                );
            })}

            {/* Edges */}
            {edges.map((edge, i) => {
                const from = positions.get(edge.source);
                const to = positions.get(edge.target);
                if (!from || !to) return null;
                return <Edge3D key={i} start={from} end={to} />;
            })}

            <OrbitControls
                enableZoom
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.4}
                maxDistance={15}
                minDistance={5}
            />

            <fog attach="fog" args={["#0b0b0f", 8, 22]} />
        </>
    );
}

"use client";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function NeuralStreams({ active }: { active: boolean }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (groupRef.current && active) {
            groupRef.current.rotation.y -= 0.002;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Connections to Panels */}
            <Line
                points={[[0, 0, 0], [4, 1.5, 0]]}
                color="#a78bfa"
                lineWidth={active ? 3 : 1}
                transparent
                opacity={0.5}
            />
            <Line
                points={[[0, 0, 0], [-4, -1, 0]]}
                color="#22d3ee"
                lineWidth={active ? 3 : 1}
                transparent
                opacity={0.5}
            />
            {/* Abstract Orbitals */}
            <group rotation={[Math.PI / 4, 0, 0]}>
                <Line
                    points={getCirclePoints(6)}
                    color="#4c1d95"
                    lineWidth={1}
                    transparent
                    opacity={0.2}
                />
            </group>
        </group>
    );
}

function getCirclePoints(radius: number) {
    const points = [];
    for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        points.push([Math.cos(angle) * radius, Math.sin(angle) * radius, 0] as [number, number, number]);
    }
    return points;
}

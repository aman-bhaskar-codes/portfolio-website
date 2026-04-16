"use client";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

type Mode = "idle" | "active" | "listening" | "speaking";
type Tone = "neutral" | "technical" | "strategic" | "curious" | "frustrated" | "casual";

interface Props {
    mode: Mode;
    tone: Tone;
    speaking?: boolean;
}

export default function IntelligenceCore({ mode, tone, speaking }: Props) {
    const ref = useRef<THREE.Mesh>(null);

    // Map tones to colors
    const toneColors: Record<Tone, string> = {
        neutral: "#7c3aed",      // Purple (Default)
        technical: "#22d3ee",    // Cyan
        strategic: "#f472b6",    // Pink
        curious: "#fbbf24",      // Amber
        frustrated: "#ef4444",   // Red
        casual: "#a78bfa"        // Light Purple
    };

    // Base config based on mode
    const modeConfig = {
        idle: { speed: 2, distort: 0.4, intensity: 1 },
        active: { speed: 5, distort: 0.8, intensity: 2 },
        listening: { speed: 3, distort: 0.3, intensity: 1.5 },
        speaking: { speed: 8, distort: 1.2, intensity: 3 },
    }[mode];

    // Determine active color
    let activeColor = toneColors[tone];

    // Override if speaking or listening
    if (speaking) {
        activeColor = "#22d3ee"; // Cyan/Bright when speaking
    } else if (mode === "listening") {
        activeColor = "#22d3ee";
    } else if (mode === "idle") {
        activeColor = toneColors.neutral;
    }

    useFrame((state) => {
        if (ref.current) {
            // Spin faster when speaking
            const rotationSpeed = speaking ? 0.02 : (mode === "idle" ? 0.002 : 0.01);
            ref.current.rotation.y += rotationSpeed;
            ref.current.rotation.x += rotationSpeed * 0.5;
        }
    });

    // Boost intensity if speaking
    const finalIntensity = speaking ? 3.5 : modeConfig.intensity;

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh ref={ref}>
                <icosahedronGeometry args={[2, 4]} />
                <MeshDistortMaterial
                    color={activeColor}
                    emissive={activeColor}
                    emissiveIntensity={finalIntensity}
                    distort={modeConfig.distort}
                    speed={modeConfig.speed}
                    roughness={0.1}
                    metalness={0.8}
                />
            </mesh>
            {/* Outer Glow Shell */}
            <mesh scale={1.2}>
                <sphereGeometry args={[2.2, 32, 32]} />
                <meshBasicMaterial
                    color={activeColor}
                    transparent
                    opacity={speaking ? 0.3 : (mode === "idle" ? 0.05 : 0.2)}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </Float>
    );
}

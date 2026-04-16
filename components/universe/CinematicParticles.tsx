"use client";

import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useCognitive } from "@/lib/state/cognitiveStore";

// Responsive particle count (optimization)
const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
const COUNT = isMobile ? 800 : 2000;

export default function CinematicParticles() {
    const points = useRef<THREE.Points>(null!);
    const { mouse, viewport, clock } = useThree();

    const { state } = useCognitive();

    const positions = useMemo(() => {
        const arr = new Float32Array(COUNT * 3);
        for (let i = 0; i < COUNT; i++) {
            // Broad initial spread
            arr[i * 3] = (Math.random() - 0.5) * 35;
            arr[i * 3 + 1] = (Math.random() - 0.5) * 35;
            arr[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5; // offset slightly back
        }
        return arr;
    }, []);

    const velocities = useMemo(() => {
        return new Float32Array(COUNT * 3);
    }, []);

    // Base and Target Colors for elite reward transition
    const baseColor = useMemo(() => new THREE.Color("#4c1d95"), []); // deep purple
    const rewardColor = useMemo(() => new THREE.Color("#facc15"), []); // gold

    useFrame((sceneState, delta) => {
        if (!points.current) return;

        const geometry = points.current.geometry;
        const pos = geometry.attributes.position.array as Float32Array;

        // React to system reward & active twin state
        const material = points.current.material as THREE.PointsMaterial;

        // Smoothly shift to intense gold based on reward, mixed with twin activity
        const targetLerp = (state.reward * 0.8) + (state.activeTwin ? 0.2 : 0);
        material.color.lerpColors(baseColor, rewardColor, targetLerp);

        // Gentle pulse 
        material.opacity = 0.6 + (state.reward * 0.3) + Math.sin(sceneState.clock.elapsedTime * 1.5) * 0.1;

        // Map mouse to world target
        const targetX = mouse.x * viewport.width * 0.6;
        const targetY = mouse.y * viewport.height * 0.6;

        for (let i = 0; i < COUNT; i++) {
            const ix = i * 3;

            const dx = targetX - pos[ix];
            const dy = targetY - pos[ix + 1];

            // Inverse distance force (gravity well)
            const distance = Math.sqrt(dx * dx + dy * dy) + 0.001;

            // Limit max force to avoid snapping
            const force = Math.min(1 / distance, 0.03);

            // Apply acceleration 
            velocities[ix] += dx * force * 0.02;
            velocities[ix + 1] += dy * force * 0.02;

            // Dampening (decaying velocity for smooth, cinematic swirl)
            // Slight reward mapping to speed decay
            const damp = 0.94 - (state.reward * 0.01);
            velocities[ix] *= damp;
            velocities[ix + 1] *= damp;

            // Apply velocity
            pos[ix] += velocities[ix];
            pos[ix + 1] += velocities[ix + 1];

            // Subtle depth breathing
            pos[ix + 2] += Math.sin(clock.elapsedTime + i) * 0.002;
        }

        geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.08}
                transparent
                opacity={0.9}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

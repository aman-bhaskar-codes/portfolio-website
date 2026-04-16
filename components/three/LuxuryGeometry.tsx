"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Float, Environment } from "@react-three/drei";
import * as THREE from "three";

export default function LuxuryGeometry() {
    const meshRef = useRef<THREE.Mesh>(null);

    // Smooth rotation logic
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
            meshRef.current.rotation.y += 0.005;
        }
    });

    return (
        <>
            <Environment preset="night" />
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                <mesh ref={meshRef} position={[0, 0, 0]} scale={1.8}>
                    <torusKnotGeometry args={[1, 0.35, 300, 20]} />
                    <meshStandardMaterial
                        color="#8B5CF6"
                        metalness={0.8}
                        roughness={0.15}
                        envMapIntensity={1}
                    />
                </mesh>
            </Float>

            {/* Cinematic Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 5, 5]} intensity={2} color="#8B5CF6" />
            <spotLight position={[-5, 5, 0]} intensity={1} color="#6366F1" />
        </>
    );

}

"use client";

import { useRef, useMemo, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
    Environment, Float, PerspectiveCamera,
    MeshDistortMaterial, Sparkles
} from "@react-three/drei";
import * as THREE from "three";

const PARTICLE_COUNT = 1500;
const SPREAD = 16;

/* ═══════════════════════════════════════════════════════════
   MOUSE-REACTIVE PARTICLE FIELD
   2000 instanced particles that flow away from cursor.
   Uses InstancedMesh for 60fps performance on mobile.
   ═══════════════════════════════════════════════════════════ */

function ParticleField() {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const { mouse, viewport } = useThree();

    // Pre-compute initial positions + velocities
    const particles = useMemo(() => {
        const data = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            data.push({
                x: (Math.random() - 0.5) * SPREAD,
                y: (Math.random() - 0.5) * SPREAD,
                z: (Math.random() - 0.5) * SPREAD,
                // Each particle has a slightly different speed
                speed: 0.2 + Math.random() * 0.8,
                // Oscillation offset
                offset: Math.random() * Math.PI * 2,
                // Size variation
                scale: 0.02 + Math.random() * 0.04,
            });
        }
        return data;
    }, []);

    // Color palette: indigo + emerald gradient
    const colors = useMemo(() => {
        const arr = new Float32Array(PARTICLE_COUNT * 3);
        const indigo = new THREE.Color("#6366f1");
        const emerald = new THREE.Color("#10b981");
        const white = new THREE.Color("#ffffff");

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const t = Math.random();
            let color: THREE.Color;
            if (t < 0.5) {
                color = indigo.clone().lerp(emerald, t * 2);
            } else if (t < 0.85) {
                color = emerald.clone().lerp(indigo, (t - 0.5) * 2.86);
            } else {
                color = white.clone();
            }
            // Reduce saturation for subtlety
            color.multiplyScalar(0.6 + Math.random() * 0.4);
            arr[i * 3] = color.r;
            arr[i * 3 + 1] = color.g;
            arr[i * 3 + 2] = color.b;
        }
        return arr;
    }, []);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state) => {
        if (!meshRef.current) return;

        const time = state.clock.getElapsedTime();
        // Mouse position in world space
        const mx = (mouse.x * viewport.width) / 2;
        const my = (mouse.y * viewport.height) / 2;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const p = particles[i];

            // Base position with gentle oscillation
            let px = p.x + Math.sin(time * p.speed * 0.3 + p.offset) * 0.3;
            let py = p.y + Math.cos(time * p.speed * 0.2 + p.offset) * 0.3;
            let pz = p.z + Math.sin(time * p.speed * 0.15 + p.offset * 1.5) * 0.2;

            // Mouse repulsion (particles flow away from cursor)
            const dx = px - mx;
            const dy = py - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const repelRadius = 3;
            if (dist < repelRadius) {
                const force = (1 - dist / repelRadius) * 1.5;
                px += (dx / dist) * force;
                py += (dy / dist) * force;
            }

            dummy.position.set(px, py, pz);
            dummy.scale.setScalar(p.scale);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
        // Slow global rotation for depth
        meshRef.current.rotation.y = time * 0.01;
    });

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, PARTICLE_COUNT]}
            frustumCulled
        >
            <sphereGeometry args={[1, 6, 6]}>
                <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
            </sphereGeometry>
            <meshBasicMaterial
                transparent
                opacity={0.7}
                depthWrite={false}
                vertexColors={true}
            />
        </instancedMesh>
    );
}

/* ═══════════════════════════════════════════════════════════
   CORE NEURAL OBJECT
   Distorted torus knot — mouse-reactive position
   ═══════════════════════════════════════════════════════════ */

function NeuralObject() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.getElapsedTime();
        meshRef.current.rotation.y = time * 0.08;
        meshRef.current.rotation.x = time * 0.04;

        // Smooth mouse follow
        meshRef.current.position.y = THREE.MathUtils.lerp(
            meshRef.current.position.y,
            state.mouse.y * 0.4,
            0.04
        );
        meshRef.current.position.x = THREE.MathUtils.lerp(
            meshRef.current.position.x,
            state.mouse.x * 0.4,
            0.04
        );
    });

    return (
        <mesh ref={meshRef} scale={1.6}>
            <torusKnotGeometry args={[1, 0.32, 200, 48]} />
            <MeshDistortMaterial
                color="#6366F1"
                speed={1.8}
                distort={0.35}
                radius={1}
                metalness={0.95}
                roughness={0.08}
                emissive="#312e81"
                emissiveIntensity={0.3}
            />
        </mesh>
    );
}

/* ═══════════════════════════════════════════════════════════
   SCENE ASSEMBLY
   ═══════════════════════════════════════════════════════════ */

export default function HeroScene() {
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={35} />
            <Environment preset="studio" />

            {/* Cinematic Lighting */}
            <ambientLight intensity={0.08} />
            <spotLight
                position={[10, 10, 10]}
                angle={0.15}
                penumbra={1}
                intensity={1.5}
                color="#6366F1"
                castShadow
            />
            <pointLight position={[-10, -10, -10]} intensity={0.8} color="#10b981" />
            <pointLight position={[5, -5, 5]} intensity={0.3} color="#818CF8" />

            {/* Mouse-reactive particle field */}
            <ParticleField />

            {/* Volumetric sparkles */}
            <Sparkles
                count={40}
                scale={12}
                size={1.5}
                speed={0.4}
                opacity={0.15}
                color="#6366F1"
            />

            <Float speed={1.5} rotationIntensity={1.2} floatIntensity={1.5} floatingRange={[-0.4, 0.4]}>
                <NeuralObject />
            </Float>

            {/* Depth fog for cinematic feel */}
            <fog attach="fog" args={["#0a0a0f", 6, 20]} />
        </>
    );
}

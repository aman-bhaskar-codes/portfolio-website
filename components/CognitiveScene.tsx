"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { Line, Html, Stars } from "@react-three/drei";
import { useCognitive } from "@/lib/state/cognitiveStore";
import { Activity, Beaker, Brain, Shield, Play } from "lucide-react";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import CinematicParticles from "@/components/universe/CinematicParticles";

// --- META ORB (Core Identity / Reward) ---
function MetaOrb() {
    const { state } = useCognitive();
    const ref = useRef<THREE.Mesh>(null!);

    useFrame(({ clock }) => {
        // Spin faster if autonomy is high
        const speedMultiplier = state.autonomyMode === "full" ? 2 : state.autonomyMode === "advisory" ? 1 : 0.5;
        ref.current.rotation.y = clock.getElapsedTime() * 0.3 * speedMultiplier;
        ref.current.rotation.x = clock.getElapsedTime() * 0.1 * speedMultiplier;
    });

    // Intense Gold for "Full" autonomy, Purple for advisory, White for passive.
    const color = state.autonomyMode === "full" ? "#facc15" : state.autonomyMode === "advisory" ? "#7c3aed" : "#f8fafc";
    const emissive = state.autonomyMode === "full" ? "#854d0e" : state.autonomyMode === "advisory" ? "#4c1d95" : "#94a3b8";

    return (
        <group>
            {/* Halo Ring representing Autonomy Mode */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[2.5, 0.02, 16, 100]} />
                <meshBasicMaterial color={color} transparent opacity={0.4} />
            </mesh>

            <mesh ref={ref}>
                <sphereGeometry args={[1.5, 64, 64]} />
                <meshStandardMaterial
                    color={color}
                    emissive={emissive}
                    emissiveIntensity={state.reward} // Brighter if reward is high
                />
            </mesh>
        </group>
    );
}

// --- SWARM ORB (Agents) ---
function SwarmOrb({ position, role, id }: { position: [number, number, number], role: string, id: string }) {
    const { state } = useCognitive();
    const ref = useRef<THREE.Mesh>(null!);
    const [hovered, setHovered] = useState(false);

    const isActive = state.activeTwin === id;

    useFrame(({ clock }) => {
        // Active twins bob faster and higher
        const speed = isActive ? 4 : 2;
        const amplitude = isActive ? 0.4 : 0.2;
        ref.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * speed + position[0]) * amplitude;
    });

    const color = isActive ? "#facc15" : "#00d4ff";
    const emissive = isActive ? "#ca8a04" : "#0284c7";

    return (
        <group position={position}>
            <mesh
                ref={ref}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <sphereGeometry args={[0.6, 32, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={emissive}
                    emissiveIntensity={isActive ? 2 : (hovered ? 1.5 : 0.8)}
                    wireframe={hovered || isActive}
                />
            </mesh>

            {/* Neural connection down to center */}
            <NeuralLink start={[0, -position[1], -position[0]]} end={[0, 0, 0]} active={isActive} />

            {hovered && (
                <Html position={[0, 1.2, 0]} center>
                    <div className="bg-black/80 backdrop-blur-md border border-neutral-800 text-white text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-md whitespace-nowrap z-50">
                        {role} Twin
                        <div className={`mt-1 font-bold ${isActive ? 'text-yellow-400' : 'text-cyan-500'}`}>
                            {isActive ? "Computing..." : "Standby"}
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

// --- NEURAL LINK (Debate intensity speed) ---
function NeuralLink({ start, end, active }: { start: [number, number, number], end: [number, number, number], active: boolean }) {
    const { state } = useCognitive();
    const materialRef = useRef<THREE.LineBasicMaterial>(null!);

    useFrame(({ clock }) => {
        if (!materialRef.current) return;
        // Debate intensity speeds up the pulses
        const speed = 1 + (state.debateIntensity * 10);
        materialRef.current.opacity = active
            ? 0.5 + Math.sin(clock.elapsedTime * speed) * 0.5
            : 0.2;
    });

    return (
        <Line points={[start, end]} lineWidth={active ? 2 : 1} transparent>
            <lineBasicMaterial ref={materialRef} color={active ? "#facc15" : "#7c3aed"} transparent />
        </Line>
    );
}




// --- MAIN SCENE EXPORT ---
export default function CognitiveScene({ role = "public" }: { role?: string }) {
    const { state, simulateActivity } = useCognitive();
    const clusters = Array.from({ length: 12 });

    // Cinematic camera motion
    useFrame((sceneState) => {
        sceneState.camera.position.x = sceneState.mouse.x * 0.5;
        sceneState.camera.position.y = sceneState.mouse.y * 0.5;
        sceneState.camera.lookAt(0, 0, 0);
    });

    return (
        <>
            <ambientLight intensity={0.2} />
            <pointLight position={[5, 5, 5]} intensity={1.2} />
            <pointLight position={[-5, -5, -5]} intensity={0.5} color="#7c3aed" />

            {/* Cinematic Particle Cosmos + Depth Layers */}
            <Stars radius={100} depth={50} count={1500} factor={4} fade />
            <CinematicParticles />

            <EffectComposer>
                <Bloom luminanceThreshold={0.3} intensity={1.2} mipmapBlur />
            </EffectComposer>

            <MetaOrb />

            <SwarmOrb position={[4, 0, 0]} role="Architecture" id="architecture" />
            <SwarmOrb position={[-4, 0, 0]} role="Safety" id="safety" />
            <SwarmOrb position={[0, 4, 0]} role="Research" id="research" />
            <SwarmOrb position={[0, -4, 0]} role="Performance" id="performance" />

            {/* Memory Clusters Ring */}
            {clusters.map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const x = Math.cos(angle) * 7;
                const y = Math.sin(angle) * 7;
                // Highlight random contiguous clusters based on count
                const isActive = i < state.activeClusters;

                return (
                    <mesh key={i} position={[x, y, 0]}>
                        <sphereGeometry args={[isActive ? 0.35 : 0.15, 16, 16]} />
                        <meshStandardMaterial
                            color={isActive ? "#22c55e" : "#3f3f46"}
                            emissive={isActive ? "#15803d" : "#000000"}
                            emissiveIntensity={isActive ? 2 : 0}
                        />
                    </mesh>
                );
            })}

            {/* Neural Links cross-talk */}
            <NeuralLink start={[0, 0, 0]} end={[4, 0, 0]} active={state.activeTwin === "architecture"} />
            <NeuralLink start={[0, 0, 0]} end={[-4, 0, 0]} active={state.activeTwin === "safety"} />
            <NeuralLink start={[0, 0, 0]} end={[0, 4, 0]} active={state.activeTwin === "research"} />
            <NeuralLink start={[0, 0, 0]} end={[0, -4, 0]} active={state.activeTwin === "performance"} />

            {/* HTML OVERLAYS */}
            <Html position={[-8, 5, 0]}>
                <div className="w-64 text-white backdrop-blur-lg bg-black/40 border border-white/10 rounded-xl p-5 font-sans relative shadow-2xl">
                    {role === "owner" && (
                        <div className="absolute -top-3 -right-3 bg-red-500/80 backdrop-blur border border-red-500 text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                            Root Access
                        </div>
                    )}

                    <h1 className="text-xl font-light tracking-tight mb-6 flex items-center gap-2">
                        <Brain size={18} className="text-purple-400" /> Cognitive State
                    </h1>

                    <div className="space-y-4 text-xs uppercase tracking-widest text-neutral-400">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Sys Reward</span>
                                <span className="text-emerald-400">{(state.reward * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-0.5 bg-white/10 w-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${state.reward * 100}%` }} />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Debate Intensity</span>
                                <span className="text-blue-400">{(state.debateIntensity * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-0.5 bg-white/10 w-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${state.debateIntensity * 100}%` }} />
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-2 border-y border-white/5">
                            <span className="flex items-center gap-2"><Activity size={12} /> Live Twin</span>
                            <span className="text-yellow-400 font-bold">{state.activeTwin || "Idle"}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2"><Shield size={12} /> Autonomy</span>
                            <span className={state.autonomyMode === "full" ? "text-yellow-400" : "text-purple-400"}>
                                {state.autonomyMode}
                            </span>
                        </div>

                        {role === "owner" && (
                            <div className="pt-4 mt-2 border-t border-red-500/20 text-[10px] text-red-400 font-mono flex flex-col gap-1.5 bg-red-500/5 p-3 rounded-lg">
                                <div className="flex justify-between"><span>MemClusters</span> <span>{state.activeClusters}/12</span></div>
                                <div className="flex justify-between"><span>Entropy</span> <span>0.941</span></div>
                                <div className="flex justify-between"><span>Hypotheses</span> <span className="animate-pulse">2 Pending</span></div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={simulateActivity}
                        className="mt-6 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest transition-colors group"
                    >
                        <Play size={10} className="group-hover:text-emerald-400 transition-colors" />
                        Simulate Activity Event
                    </button>
                </div>
            </Html>
        </>
    );
}

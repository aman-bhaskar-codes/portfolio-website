"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense } from "react";
import IntelligenceCore from "./IntelligenceCore";
import HolographicPanels from "./HolographicPanels";
import NeuralStreams from "./NeuralStreams";

type Mode = "idle" | "active" | "listening" | "speaking";
type Tone = "neutral" | "technical" | "strategic" | "curious" | "frustrated" | "casual";

interface Props {
    mode: Mode;
    tone?: Tone;
    goal?: string;
    reflection?: string;
    speaking?: boolean;
}

export default function ControlRoomScene({ mode, tone = "neutral", goal, reflection, speaking }: Props) {
    return (
        <div className="fixed inset-0 z-0 bg-[#050510]">
            <Canvas dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={50} />

                <color attach="background" args={["#050510"]} />
                <fog attach="fog" args={["#050510", 10, 30]} />

                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#7c3aed" />
                <pointLight position={[-10, -5, 5]} intensity={1} color="#22d3ee" />

                <Stars radius={50} depth={20} count={3000} factor={4} saturation={0} fade speed={1} />

                <Suspense fallback={null}>
                    <IntelligenceCore mode={mode} tone={tone} speaking={speaking} />
                    <HolographicPanels goal={goal} reflection={reflection} />
                    <NeuralStreams active={mode !== "idle"} />
                </Suspense>

                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    autoRotate={true}
                    autoRotateSpeed={mode === "idle" ? 0.3 : 0.8}
                    maxPolarAngle={Math.PI / 1.5}
                    minPolarAngle={Math.PI / 3}
                />

                <EffectComposer>
                    <Bloom luminanceThreshold={0.2} intensity={mode === "idle" ? 0.8 : 1.5} radius={0.5} />
                    <Noise opacity={0.05} />
                    <Vignette eskil={false} offset={0.1} darkness={1.1} />
                </EffectComposer>
            </Canvas>
        </div>
    );
}

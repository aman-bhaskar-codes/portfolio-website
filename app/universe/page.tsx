"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import CognitiveScene from "@/components/CognitiveScene";
import { useState, useEffect } from "react";
import useUserRole from "@/lib/useUserRole";
import UniverseOverlay from "@/components/universe/UniverseOverlay";
import { motion } from "framer-motion";

export default function UniversePage() {
    const [mounted, setMounted] = useState(false);
    const role = useUserRole();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-screen h-screen bg-black overflow-hidden relative"
        >
            <Canvas
                camera={{ position: [0, 0, 15], fov: 60 }}
                dpr={[1, 1.5]} // Optimal for retina devices like M1 Macs without burning GPU
                gl={{ antialias: true, powerPreference: "high-performance" }}
            >
                {typeof window !== "undefined" && window.innerWidth >= 768 && (
                    <Stars radius={100} depth={50} count={2000} factor={3} fade />
                )}

                {/* role passed so we can selectively disable certain owner-mode heavy visuals if needed */}
                <CognitiveScene role={role} />
                <OrbitControls
                    enableZoom={true}
                    maxDistance={30}
                    minDistance={5}
                    autoRotate
                    autoRotateSpeed={0.5}
                />
            </Canvas>

            <UniverseOverlay />
        </motion.div>
    );
}

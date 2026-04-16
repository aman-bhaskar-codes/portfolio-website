"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function NeuralBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Scene Setup
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x05050a, 0.002);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 30;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // Particles
        const geometry = new THREE.BufferGeometry();
        const counts = 2000; // Reduced count
        const positions = new Float32Array(counts * 3);

        for (let i = 0; i < counts * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 60;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            size: 0.15,
            color: 0x7c3aed, // Purple
            transparent: true,
            opacity: 0.4,
            sizeAttenuation: true
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        // Animation Loop
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);

            // Slow rotation
            points.rotation.y += 0.0005;
            points.rotation.x += 0.0002;

            renderer.render(scene, camera);
        };
        animate();

        // Resize
        const handleResize = () => {
            if (!containerRef.current) return;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", handleResize);
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
        };
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div ref={containerRef} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#05050a] via-transparent to-[#05050a] opacity-80" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(124,58,237,0.15),transparent_60%)]" />
        </div>
    );
}

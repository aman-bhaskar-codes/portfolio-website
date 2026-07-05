'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

/** Slowly rotating particle sphere — the "neural field" */
function ParticleField() {
  const ref = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const count = 2600
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Distribute on a sphere shell with slight jitter
      const r = 4.6 + (Math.random() - 0.5) * 1.6
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.03
    ref.current.rotation.x += delta * 0.008
    // Mouse parallax drift
    const { x, y } = state.pointer
    ref.current.rotation.y += x * delta * 0.05
    ref.current.rotation.x += y * delta * 0.02
  })

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#7c6df0"
        size={0.028}
        sizeAttenuation
        depthWrite={false}
        opacity={0.75}
      />
    </Points>
  )
}

/** Inner wireframe core — the "mind" */
function WireCore() {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.12
      group.current.rotation.z += delta * 0.03
      const { x, y } = state.pointer
      group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, x * 0.5, 0.04)
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, y * 0.3, 0.04)
    }
    if (inner.current) {
      inner.current.rotation.x -= delta * 0.2
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.04
      inner.current.scale.setScalar(s)
    }
  })

  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.8}>
      <group ref={group}>
        <mesh>
          <icosahedronGeometry args={[1.7, 1]} />
          <meshBasicMaterial color="#7c6df0" wireframe transparent opacity={0.32} />
        </mesh>
        <mesh ref={inner}>
          <icosahedronGeometry args={[1.05, 0]} />
          <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.5} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.34, 24, 24]} />
          <meshBasicMaterial color="#c9c2ff" transparent opacity={0.9} />
        </mesh>
      </group>
    </Float>
  )
}

/** Orbiting ring of small satellites — "agents" */
function AgentRing() {
  const ref = useRef<THREE.Group>(null)
  const satellites = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        angle: (i / 7) * Math.PI * 2,
        radius: 3.1,
        size: 0.05 + Math.random() * 0.05,
        speed: 0.4 + Math.random() * 0.3,
      })),
    []
  )

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.18
    ref.current.rotation.x = Math.PI * 0.12
  })

  return (
    <group ref={ref}>
      {satellites.map((s, i) => (
        <mesh
          key={i}
          position={[Math.cos(s.angle) * s.radius, 0, Math.sin(s.angle) * s.radius]}
        >
          <sphereGeometry args={[s.size, 12, 12]} />
          <meshBasicMaterial color={i % 3 === 0 ? '#f59e0b' : '#7c6df0'} transparent opacity={0.85} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.1, 0.004, 8, 120]} />
        <meshBasicMaterial color="#7c6df0" transparent opacity={0.22} />
      </mesh>
    </group>
  )
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 48 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ParticleField />
        <WireCore />
        <AgentRing />
      </Canvas>
    </div>
  )
}

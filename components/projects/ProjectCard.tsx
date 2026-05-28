'use client'
import { useState, useRef } from 'react'

export interface Project {
  title: string
  description: string
  tags: string[]
  status: 'live' | 'building' | 'concept'
  metrics?: string
  accent?: string
}

const STATUS_STYLES = {
  live:     { color: '#22c55e', label: 'Live' },
  building: { color: '#f59e0b', label: 'Building' },
  concept:  { color: '#7c6df0', label: 'Concept' },
}

export function ProjectCard({ title, description, tags, status, metrics, accent = '#7c6df0' }: Project) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    setTilt({
      x: ((e.clientY - cy) / rect.height) * -8,
      y: ((e.clientX - cx) / rect.width) * 8,
    })
  }

  const statusStyle = STATUS_STYLES[status]

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }) }}
      style={{
        position: 'relative',
        padding: '28px',
        borderRadius: 'var(--radius-xl)',
        border: `1px solid ${hovered ? `${accent}33` : 'rgba(255,255,255,0.06)'}`,
        background: hovered ? 'var(--bg-elevated)' : 'var(--bg-surface)',
        cursor: 'pointer',
        transform: hovered
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px)`
          : 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)',
        transition: 'transform 0.15s, border-color 0.2s, background 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? `0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px ${accent}22` : 'none',
        willChange: 'transform',
      }}
    >
      {/* Accent gradient top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
        background: hovered ? `linear-gradient(90deg, ${accent}00, ${accent}88, ${accent}00)` : 'transparent',
        transition: 'background 0.3s',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <h3 style={{
          fontFamily: 'var(--font-clash)', fontWeight: 600, fontSize: '1.15rem',
          color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.3,
        }}>
          {title}
        </h3>

        <span style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 10px', borderRadius: 'var(--radius-full)',
          background: `${statusStyle.color}15`,
          border: `1px solid ${statusStyle.color}30`,
          fontSize: '0.7rem', fontFamily: 'var(--font-mono)',
          color: statusStyle.color, letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusStyle.color }} />
          {statusStyle.label}
        </span>
      </div>

      {/* Description */}
      <p style={{
        fontSize: '0.9rem', lineHeight: 1.65,
        color: 'var(--text-secondary)', marginBottom: 20,
      }}>
        {description}
      </p>

      {/* Metrics (if any) */}
      {metrics && (
        <div style={{
          padding: '8px 12px', borderRadius: 'var(--radius-md)',
          background: `${accent}0d`, border: `1px solid ${accent}22`,
          marginBottom: 16,
          fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
          color: accent,
        }}>
          {metrics}
        </div>
      )}

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tags.map(tag => (
          <span key={tag} style={{
            padding: '3px 10px', borderRadius: 'var(--radius-full)',
            background: 'var(--bg-overlay)',
            border: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
            color: 'var(--text-tertiary)', letterSpacing: '0.04em',
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Hover arrow */}
      <div style={{
        position: 'absolute', bottom: 24, right: 24,
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translateX(0)' : 'translateX(-8px)',
        transition: 'opacity 0.2s, transform 0.2s',
        color: accent, fontSize: '1.2rem',
      }}>
        →
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'

interface ServiceStatus {
  name: string
  status: 'operational' | 'degraded' | 'down'
  latency?: number
  description: string
}

const SERVICES: ServiceStatus[] = [
  { name: 'AI Digital Twin', status: 'operational', latency: 42, description: 'phi4-mini reasoning' },
  { name: 'RAG Pipeline', status: 'operational', latency: 180, description: '5-stage retrieval' },
  { name: 'Vector DB (Qdrant)', status: 'operational', latency: 12, description: 'knowledge store' },
  { name: 'Memory System', status: 'operational', latency: 8, description: '3-tier Redis/PG' },
  { name: 'GitHub Sync', status: 'operational', latency: undefined, description: 'webhook + hourly' },
  { name: 'DSPy Optimizer', status: 'operational', latency: undefined, description: 'Sunday 1am' },
]

const STATUS_CONFIG = {
  operational: { color: '#22c55e', label: 'Operational' },
  degraded:    { color: '#f59e0b', label: 'Degraded' },
  down:        { color: '#ef4444', label: 'Down' },
}

export function SystemStatus() {
  const [expanded, setExpanded] = useState(false)

  const allOk = SERVICES.every(s => s.status === 'operational')

  return (
    <div style={{
      padding: '16px 20px',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'var(--bg-surface)',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: allOk ? '#22c55e' : '#f59e0b',
            boxShadow: `0 0 8px ${allOk ? '#22c55e' : '#f59e0b'}`,
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
            System Status
          </span>
          <span style={{
            padding: '1px 8px', borderRadius: 'var(--radius-full)',
            background: allOk ? '#22c55e1a' : '#f59e0b1a',
            border: `1px solid ${allOk ? '#22c55e33' : '#f59e0b33'}`,
            fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
            color: allOk ? '#22c55e' : '#f59e0b',
          }}>
            {allOk ? 'ALL SYSTEMS GO' : 'DEGRADED'}
          </span>
        </div>
        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
          ▾
        </span>
      </button>

      {/* Services list */}
      {expanded && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {SERVICES.map(service => {
            const cfg = STATUS_CONFIG[service.status]
            return (
              <div key={service.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block', textAlign: 'left' }}>{service.name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'block', textAlign: 'left' }}>{service.description}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {service.latency !== undefined && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      {service.latency}ms
                    </span>
                  )}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: cfg.color }}>{cfg.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

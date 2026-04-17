'use client';

/**
 * ═══════════════════════════════════════════════════════════
 * Live Build Widget — ANTIGRAVITY OS v2 (§26.8)
 * ═══════════════════════════════════════════════════════════
 * 
 * Persistent bottom widget: "What Aman Is Building Right Now"
 * Section 1: Current sprint (from last 7 days GitHub activity)
 * Section 2: Last commit (real-time via SSE)
 * Section 3: Technologies used this week
 */

import React, { useState, useEffect, useCallback } from 'react';

interface LiveBuildData {
  currentSprint: {
    title: string;
    description: string;
    progress: number;
  };
  lastCommit: {
    message: string;
    repo: string;
    timeAgo: string;
    sha: string;
  };
  techThisWeek: string[];
}

interface LiveBuildWidgetProps {
  onItemClick?: (topic: string) => void;
}

const LiveBuildWidget: React.FC<LiveBuildWidgetProps> = ({ onItemClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [data, setData] = useState<LiveBuildData>({
    currentSprint: {
      title: 'ANTIGRAVITY OS v2',
      description: 'Building the Singularity Stack',
      progress: 65,
    },
    lastCommit: {
      message: 'feat: implement circuit breaker + health orchestrator',
      repo: 'portfolio-website',
      timeAgo: 'just now',
      sha: 'abc1234',
    },
    techThisWeek: ['Python', 'TypeScript', 'FastAPI', 'React', 'PostgreSQL', 'Redis', 'Ollama'],
  });

  const [pulse, setPulse] = useState(true);

  // Pulse animation every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Try to connect to SSE for live updates
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/v2/live-activity');
      eventSource.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data);
          setData(prev => ({
            ...prev,
            lastCommit: update.lastCommit || prev.lastCommit,
          }));
        } catch {
          // Ignore parse errors
        }
      };
      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch {
      // SSE not available, use static data
    }

    return () => eventSource?.close();
  }, []);

  if (!isExpanded) {
    return (
      <button
        style={{
          ...styles.minimized,
          boxShadow: pulse
            ? '0 0 20px rgba(124, 58, 237, 0.4)'
            : '0 4px 15px rgba(0, 0, 0, 0.3)',
        }}
        onClick={() => setIsExpanded(true)}
      >
        <span style={styles.liveDot}>●</span>
        Building now: {data.currentSprint.title}
      </button>
    );
  }

  return (
    <div style={styles.widget}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.liveDot}>●</span>
          <span style={styles.headerTitle}>What Aman Is Building Right Now</span>
        </div>
        <button style={styles.collapseBtn} onClick={() => setIsExpanded(false)}>
          ▾
        </button>
      </div>

      {/* Current Sprint */}
      <div
        style={styles.section}
        onClick={() => onItemClick?.(data.currentSprint.title)}
      >
        <div style={styles.sectionLabel}>CURRENT SPRINT</div>
        <div style={styles.sprintTitle}>{data.currentSprint.title}</div>
        <div style={styles.sprintDesc}>{data.currentSprint.description}</div>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${data.currentSprint.progress}%`,
            }}
          />
        </div>
        <div style={styles.progressLabel}>{data.currentSprint.progress}% complete</div>
      </div>

      {/* Last Commit */}
      <div
        style={styles.section}
        onClick={() => onItemClick?.(data.lastCommit.message)}
      >
        <div style={styles.sectionLabel}>LAST COMMIT</div>
        <div style={styles.commitMessage}>
          <span style={styles.commitIcon}>⚡</span>
          {data.lastCommit.message}
        </div>
        <div style={styles.commitMeta}>
          {data.lastCommit.repo} · {data.lastCommit.timeAgo}
        </div>
      </div>

      {/* Tech This Week */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>TECH THIS WEEK</div>
        <div style={styles.techTags}>
          {data.techThisWeek.map((tech) => (
            <span
              key={tech}
              style={styles.techTag}
              onClick={() => onItemClick?.(tech)}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  minimized: {
    position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(13, 17, 23, 0.95)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '30px',
    padding: '10px 20px', color: '#c9d1d9', fontSize: '13px',
    cursor: 'pointer', zIndex: 50, display: 'flex', alignItems: 'center',
    gap: '8px', transition: 'all 0.3s ease',
  },
  liveDot: {
    color: '#7ee787', fontSize: '10px',
    animation: 'pulse 2s infinite',
  },
  widget: {
    position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
    width: '400px', maxWidth: '90vw',
    background: 'rgba(13, 17, 23, 0.97)', backdropFilter: 'blur(20px)',
    border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '16px',
    overflow: 'hidden', zIndex: 50,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(37, 99, 235, 0.1))',
    borderBottom: '1px solid #21262d',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  headerTitle: { color: '#f0f6fc', fontSize: '13px', fontWeight: 700 },
  collapseBtn: {
    background: 'transparent', border: 'none', color: '#8b949e',
    cursor: 'pointer', fontSize: '16px',
  },
  section: {
    padding: '12px 16px', borderBottom: '1px solid #21262d',
    cursor: 'pointer', transition: 'background 0.2s',
  },
  sectionLabel: {
    color: '#484f58', fontSize: '10px', fontWeight: 700,
    textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '6px',
  },
  sprintTitle: { color: '#f0f6fc', fontSize: '14px', fontWeight: 600 },
  sprintDesc: { color: '#8b949e', fontSize: '12px', marginTop: '2px' },
  progressBar: {
    height: '3px', background: '#21262d', borderRadius: '2px',
    marginTop: '8px', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: '2px',
    background: 'linear-gradient(90deg, #7c3aed, #2563eb)',
    transition: 'width 0.5s ease',
  },
  progressLabel: {
    color: '#484f58', fontSize: '11px', marginTop: '4px', textAlign: 'right' as const,
  },
  commitMessage: {
    color: '#c9d1d9', fontSize: '13px', display: 'flex', gap: '6px',
  },
  commitIcon: { fontSize: '14px' },
  commitMeta: { color: '#484f58', fontSize: '11px', marginTop: '4px' },
  techTags: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  techTag: {
    background: 'rgba(124, 58, 237, 0.15)', border: '1px solid rgba(124, 58, 237, 0.3)',
    color: '#a78bfa', padding: '3px 10px', borderRadius: '12px',
    fontSize: '11px', cursor: 'pointer',
  },
};

export default LiveBuildWidget;

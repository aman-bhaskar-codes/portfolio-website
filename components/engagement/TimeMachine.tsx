'use client';

/**
 * ═══════════════════════════════════════════════════════════
 * Project Time Machine — ANTIGRAVITY OS v2 (§26.6)
 * ═══════════════════════════════════════════════════════════
 * 
 * Scrubable commit history timeline per project.
 * Above: README at that point in time
 * Below: complexity heatmap
 * "What changed here?" and "Why?" buttons → AI explains decisions
 */

import React, { useState, useCallback } from 'react';

interface CommitPoint {
  sha: string;
  message: string;
  date: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  label?: string; // LLM-generated label
}

interface TimeMachineProps {
  projectName: string;
  commits: CommitPoint[];
  onAskWhy: (commitSha: string) => void;
}

const TimeMachine: React.FC<TimeMachineProps> = ({
  projectName,
  commits,
  onAskWhy,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedCommit = commits[selectedIndex];

  if (!commits.length) {
    return (
      <div style={styles.empty}>
        No commit history available for {projectName}
      </div>
    );
  }

  // Calculate complexity heatmap (additions + deletions)
  const maxChange = Math.max(...commits.map(c => c.additions + c.deletions), 1);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.icon}>⏰</span>
        <span style={styles.title}>Time Machine — {projectName}</span>
      </div>

      {/* Timeline slider */}
      <div style={styles.sliderArea}>
        <input
          type="range"
          min={0}
          max={commits.length - 1}
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.sliderLabels}>
          <span style={styles.sliderLabel}>{commits[commits.length - 1]?.date}</span>
          <span style={styles.sliderLabel}>{commits[0]?.date}</span>
        </div>
      </div>

      {/* Selected commit */}
      {selectedCommit && (
        <div style={styles.commitCard}>
          <div style={styles.commitHeader}>
            <span style={styles.commitSha}>{selectedCommit.sha.slice(0, 7)}</span>
            <span style={styles.commitDate}>{selectedCommit.date}</span>
          </div>
          <div style={styles.commitMessage}>{selectedCommit.message}</div>
          {selectedCommit.label && (
            <div style={styles.commitLabel}>📌 {selectedCommit.label}</div>
          )}
          <div style={styles.commitStats}>
            <span style={styles.additions}>+{selectedCommit.additions}</span>
            <span style={styles.deletions}>-{selectedCommit.deletions}</span>
            <span style={styles.filesChanged}>
              {selectedCommit.filesChanged} files
            </span>
          </div>
          <div style={styles.actions}>
            <button
              style={styles.actionBtn}
              onClick={() => onAskWhy(selectedCommit.sha)}
            >
              🤔 What changed here?
            </button>
            <button
              style={{ ...styles.actionBtn, background: 'rgba(124, 58, 237, 0.15)' }}
              onClick={() => onAskWhy(selectedCommit.sha)}
            >
              💡 Why this decision?
            </button>
          </div>
        </div>
      )}

      {/* Complexity heatmap */}
      <div style={styles.heatmapArea}>
        <div style={styles.heatmapLabel}>Complexity Heatmap</div>
        <div style={styles.heatmap}>
          {commits.map((commit, i) => {
            const intensity = (commit.additions + commit.deletions) / maxChange;
            const color = intensity > 0.7
              ? `rgba(248, 81, 73, ${0.3 + intensity * 0.7})`
              : intensity > 0.3
                ? `rgba(249, 158, 11, ${0.3 + intensity * 0.7})`
                : `rgba(126, 231, 135, ${0.3 + intensity * 0.7})`;

            return (
              <div
                key={commit.sha}
                style={{
                  ...styles.heatmapCell,
                  backgroundColor: color,
                  opacity: i === selectedIndex ? 1 : 0.6,
                  border: i === selectedIndex ? '2px solid #f0f6fc' : '1px solid transparent',
                }}
                title={`${commit.date}: ${commit.additions + commit.deletions} changes`}
                onClick={() => setSelectedIndex(i)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'rgba(13, 17, 23, 0.95)', backdropFilter: 'blur(20px)',
    borderRadius: '16px', border: '1px solid #21262d',
    padding: '20px', maxWidth: '600px',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px',
  },
  icon: { fontSize: '20px' },
  title: { color: '#f0f6fc', fontWeight: 700, fontSize: '16px' },
  empty: {
    color: '#484f58', textAlign: 'center', padding: '40px',
  },
  sliderArea: { marginBottom: '16px' },
  slider: {
    width: '100%', height: '6px', appearance: 'none' as const,
    background: 'linear-gradient(90deg, #7c3aed, #2563eb)',
    borderRadius: '3px', outline: 'none', cursor: 'pointer',
  },
  sliderLabels: {
    display: 'flex', justifyContent: 'space-between', marginTop: '4px',
  },
  sliderLabel: { color: '#484f58', fontSize: '11px' },
  commitCard: {
    background: '#161b22', borderRadius: '12px', padding: '16px',
    marginBottom: '16px', border: '1px solid #21262d',
  },
  commitHeader: {
    display: 'flex', justifyContent: 'space-between', marginBottom: '8px',
  },
  commitSha: {
    fontFamily: 'monospace', color: '#79c0ff', fontSize: '13px',
    background: 'rgba(121, 192, 255, 0.1)', padding: '2px 8px',
    borderRadius: '4px',
  },
  commitDate: { color: '#8b949e', fontSize: '12px' },
  commitMessage: {
    color: '#c9d1d9', fontSize: '14px', fontWeight: 500, marginBottom: '8px',
  },
  commitLabel: {
    color: '#f0883e', fontSize: '12px', fontStyle: 'italic', marginBottom: '8px',
  },
  commitStats: {
    display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '12px',
  },
  additions: { color: '#7ee787' },
  deletions: { color: '#f85149' },
  filesChanged: { color: '#8b949e' },
  actions: { display: 'flex', gap: '8px' },
  actionBtn: {
    background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(37, 99, 235, 0.3)',
    color: '#79c0ff', padding: '6px 12px', borderRadius: '8px',
    fontSize: '12px', cursor: 'pointer',
  },
  heatmapArea: { marginTop: '4px' },
  heatmapLabel: {
    color: '#484f58', fontSize: '11px', textTransform: 'uppercase' as const,
    marginBottom: '8px', letterSpacing: '0.5px',
  },
  heatmap: {
    display: 'flex', gap: '2px', flexWrap: 'wrap',
  },
  heatmapCell: {
    width: '16px', height: '16px', borderRadius: '3px', cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default TimeMachine;

'use client';

/**
 * ═══════════════════════════════════════════════════════════
 * Stump Challenge Mode — ANTIGRAVITY OS v2 (§26.9)
 * ═══════════════════════════════════════════════════════════
 * 
 * Gamified mode: visitors try to ask questions the AI can't answer.
 * If confidence < 0.6, AI admits uncertainty + offers "Report This Gap".
 * Session scoring with anonymous leaderboard.
 */

import React, { useState, useCallback } from 'react';

interface StumpScore {
  total_questions: number;
  stumped_count: number;
  answered_count: number;
  verdict: string;
}

interface StumpChallengeProps {
  isActive: boolean;
  onToggle: () => void;
  sessionId: string;
}

const StumpChallenge: React.FC<StumpChallengeProps> = ({
  isActive,
  onToggle,
  sessionId,
}) => {
  const [score, setScore] = useState<StumpScore>({
    total_questions: 0,
    stumped_count: 0,
    answered_count: 0,
    verdict: '',
  });

  const updateScore = useCallback(async (
    question: string,
    wasStumped: boolean,
    confidence: number,
  ) => {
    try {
      const response = await fetch('/api/v2/stump/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question,
          was_stumped: wasStumped,
          confidence,
        }),
      });
      const data = await response.json();
      setScore(data);
    } catch {
      // Update locally if backend unreachable
      setScore(prev => ({
        total_questions: prev.total_questions + 1,
        stumped_count: prev.stumped_count + (wasStumped ? 1 : 0),
        answered_count: prev.answered_count + (wasStumped ? 0 : 1),
        verdict: wasStumped
          ? `You stumped me ${prev.stumped_count + 1} times!`
          : prev.verdict,
      }));
    }
  }, [sessionId]);

  if (!isActive) {
    return (
      <button style={styles.toggleBtn} onClick={onToggle} title="Stump the AI">
        🎯
      </button>
    );
  }

  const progress = score.total_questions > 0
    ? (score.stumped_count / score.total_questions) * 100
    : 0;

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>🎯 Stump Challenge</span>
        <button style={styles.closeBtn} onClick={onToggle}>✕</button>
      </div>

      <div style={styles.scoreArea}>
        <div style={styles.scoreStat}>
          <span style={styles.scoreNumber}>{score.total_questions}</span>
          <span style={styles.scoreLabel}>Questions</span>
        </div>
        <div style={styles.scoreStat}>
          <span style={{ ...styles.scoreNumber, color: '#f85149' }}>
            {score.stumped_count}
          </span>
          <span style={styles.scoreLabel}>Stumped</span>
        </div>
        <div style={styles.scoreStat}>
          <span style={{ ...styles.scoreNumber, color: '#7ee787' }}>
            {score.answered_count}
          </span>
          <span style={styles.scoreLabel}>Answered</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${progress}%`,
            background: progress > 50
              ? 'linear-gradient(90deg, #f85149, #da3633)'
              : 'linear-gradient(90deg, #7ee787, #3fb950)',
          }}
        />
      </div>

      {score.verdict && (
        <div style={styles.verdict}>{score.verdict}</div>
      )}

      <div style={styles.hint}>
        Ask the hardest technical questions you can think of!
      </div>
    </div>
  );
};

// Export the score updater for use by the chat component
export { StumpChallenge };
export type { StumpScore };

const styles: Record<string, React.CSSProperties> = {
  toggleBtn: {
    position: 'fixed', bottom: '100px', right: '20px',
    width: '48px', height: '48px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
    border: 'none', fontSize: '20px', cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
    zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  panel: {
    position: 'fixed', bottom: '100px', right: '20px',
    width: '280px', borderRadius: '16px', zIndex: 100,
    background: 'rgba(13, 17, 23, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', borderBottom: '1px solid #21262d',
    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(37, 99, 235, 0.1))',
  },
  title: { color: '#f0f6fc', fontWeight: 700, fontSize: '14px' },
  closeBtn: {
    background: 'transparent', border: 'none', color: '#8b949e',
    cursor: 'pointer', fontSize: '16px',
  },
  scoreArea: {
    display: 'flex', justifyContent: 'space-around', padding: '16px 12px',
  },
  scoreStat: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
  },
  scoreNumber: { fontSize: '24px', fontWeight: 800, color: '#f0f6fc' },
  scoreLabel: { fontSize: '11px', color: '#8b949e', textTransform: 'uppercase' as const },
  progressBar: {
    margin: '0 16px', height: '4px', borderRadius: '2px',
    background: '#21262d', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: '2px',
    transition: 'width 0.5s ease',
  },
  verdict: {
    padding: '12px 16px', textAlign: 'center',
    color: '#f0f6fc', fontSize: '13px', fontWeight: 600,
  },
  hint: {
    padding: '8px 16px 16px', textAlign: 'center',
    color: '#484f58', fontSize: '12px',
  },
};

export default StumpChallenge;

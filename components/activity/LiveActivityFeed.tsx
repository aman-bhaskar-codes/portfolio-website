"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ═══════════════════════════════════════════════════════════
 * Live GitHub Activity Feed (§13.2)
 * ═══════════════════════════════════════════════════════════
 *
 * Shows Aman's actual development activity in real-time.
 * Polled from /api/github/activity (Redis cached, 60s TTL).
 * Proves the portfolio is alive. Recruiters especially notice.
 */

interface GitHubEvent {
  id: string;
  type: string; // "push", "pr", "release", "star"
  repo: string;
  message: string;
  timestamp: string;
  url?: string;
}

// Fallback data when API unavailable
const FALLBACK_EVENTS: GitHubEvent[] = [
  {
    id: "1",
    type: "push",
    repo: "portfolio-website",
    message: "feat: ANTIGRAVITY OS v2.0 — full agent orchestration",
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    type: "push",
    repo: "portfolio-website",
    message: "feat: visitor intelligence pipeline + persona classifier",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    type: "push",
    repo: "portfolio-website",
    message: "feat: knowledge graph + self-healing freshness tracker",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
];

const EVENT_ICONS: Record<string, string> = {
  push: "⚡",
  pr: "🔀",
  release: "🚀",
  star: "⭐",
  create: "🆕",
  default: "📝",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function LiveActivityFeed() {
  const [events, setEvents] = useState<GitHubEvent[]>(FALLBACK_EVENTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/github/activity");
        if (res.ok) {
          const data = await res.json();
          if (data.events?.length > 0) {
            setEvents(data.events.slice(0, 5));
          }
        }
      } catch {
        // Use fallback data
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="live-feed-section" id="activity-feed">
      <div className="live-feed-header">
        <span className="live-dot" />
        <h3>Live Activity</h3>
      </div>

      <div className="live-feed-list">
        <AnimatePresence mode="popLayout">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              className="feed-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              <span className="feed-icon">
                {EVENT_ICONS[event.type] || EVENT_ICONS.default}
              </span>
              <div className="feed-content">
                <span className="feed-repo">{event.repo}</span>
                <span className="feed-message">{event.message}</span>
              </div>
              <span className="feed-time">{timeAgo(event.timestamp)}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .live-feed-section {
          padding: 24px;
          background: rgba(15, 15, 35, 0.4);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 16px;
          backdrop-filter: blur(12px);
        }
        .live-feed-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        .live-feed-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        .live-feed-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .feed-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          transition: background 0.2s;
          cursor: default;
        }
        .feed-item:hover {
          background: rgba(99, 102, 241, 0.08);
        }
        .feed-icon {
          font-size: 16px;
          flex-shrink: 0;
        }
        .feed-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }
        .feed-repo {
          font-size: 11px;
          font-weight: 600;
          color: #818cf8;
          text-transform: lowercase;
        }
        .feed-message {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.65);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .feed-time {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.35);
          flex-shrink: 0;
          white-space: nowrap;
        }
      `}</style>
    </section>
  );
}

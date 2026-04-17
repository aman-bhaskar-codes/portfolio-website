"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ═══════════════════════════════════════════════════════════
 * Ambient Notification Overlay (§13.4)
 * ═══════════════════════════════════════════════════════════
 *
 * Non-intrusive floating card (bottom-right, above chat).
 * Appears ONCE per session based on ambient triggers.
 * Auto-dismisses after 8s if no interaction.
 */

interface AmbientSuggestion {
  title: string;
  message: string;
  ctaText: string;
  ctaAction: string; // "open_chat" | "open_walkthrough" | "download_brief"
  icon: string;
}

interface AmbientNotificationProps {
  onAction?: (action: string) => void;
}

export default function AmbientNotification({
  onAction,
}: AmbientNotificationProps) {
  const [suggestion, setSuggestion] = useState<AmbientSuggestion | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check for ambient suggestions from backend
  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem("ambient_shown")) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/ambient/suggestion");
        if (res.ok) {
          const data = await res.json();
          if (data.suggestion) {
            setSuggestion({
              title: data.suggestion.title,
              message: data.suggestion.message,
              ctaText: data.suggestion.cta_text,
              ctaAction: data.suggestion.cta_action,
              icon: data.suggestion.icon || "💡",
            });
            setVisible(true);
            sessionStorage.setItem("ambient_shown", "true");
          }
        }
      } catch {
        // Silent fail — ambient is non-essential
      }
    }, 15000); // Wait 15s before showing

    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss after 8s
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setDismissed(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [visible]);

  const handleCTA = useCallback(() => {
    if (suggestion && onAction) {
      onAction(suggestion.ctaAction);
    }
    setVisible(false);
    setDismissed(true);
  }, [suggestion, onAction]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
  }, []);

  if (dismissed || !suggestion) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="ambient-card"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          <button
            className="ambient-close"
            onClick={handleDismiss}
            aria-label="Dismiss notification"
          >
            ×
          </button>
          <div className="ambient-icon">{suggestion.icon}</div>
          <div className="ambient-content">
            <h4 className="ambient-title">{suggestion.title}</h4>
            <p className="ambient-message">{suggestion.message}</p>
            <button className="ambient-cta" onClick={handleCTA}>
              {suggestion.ctaText}
            </button>
          </div>

          <style jsx>{`
            .ambient-card {
              position: fixed;
              bottom: 100px;
              right: 24px;
              z-index: 900;
              width: 320px;
              padding: 20px;
              background: rgba(15, 15, 35, 0.92);
              border: 1px solid rgba(99, 102, 241, 0.3);
              border-radius: 16px;
              backdrop-filter: blur(20px);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba(99, 102, 241, 0.1);
              display: flex;
              gap: 14px;
              align-items: flex-start;
            }
            .ambient-close {
              position: absolute;
              top: 8px;
              right: 12px;
              background: none;
              border: none;
              color: rgba(255, 255, 255, 0.4);
              font-size: 18px;
              cursor: pointer;
              padding: 4px;
              line-height: 1;
            }
            .ambient-close:hover {
              color: rgba(255, 255, 255, 0.8);
            }
            .ambient-icon {
              font-size: 28px;
              flex-shrink: 0;
              padding-top: 2px;
            }
            .ambient-content {
              flex: 1;
              min-width: 0;
            }
            .ambient-title {
              font-size: 14px;
              font-weight: 700;
              color: #fff;
              margin-bottom: 4px;
            }
            .ambient-message {
              font-size: 12px;
              color: rgba(255, 255, 255, 0.65);
              line-height: 1.5;
              margin-bottom: 12px;
            }
            .ambient-cta {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 6px 14px;
              font-size: 12px;
              font-weight: 600;
              color: #fff;
              background: linear-gradient(135deg, #6366f1, #818cf8);
              border: none;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
            }
            .ambient-cta:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

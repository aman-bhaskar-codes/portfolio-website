"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Conversion Tracker
═══════════════════════════════════════════════════════════

Tracks conversion events (brief downloads, contact clicks, etc.)
and injects conversion instructions into prompts based on signals.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("portfolio.analytics.conversion")


class ConversionEvent:
    """A single conversion event."""

    def __init__(
        self,
        session_id: str,
        event_type: str,
        metadata: dict[str, Any] | None = None,
    ):
        self.session_id = session_id
        self.event_type = event_type
        self.metadata = metadata or {}
        self.timestamp = datetime.now(timezone.utc)


class ConversionTracker:
    """
    Tracks and suggests conversion actions.
    
    Conversion events:
    - brief_requested: Visitor asked for a PDF brief
    - contact_clicked: Visitor clicked email/LinkedIn
    - interview_started: Visitor entered interview sim mode
    - code_walkthrough: Deep dive into a project's code
    """

    def __init__(self):
        # In-memory tracking (in production, use Redis/Postgres)
        self._events: list[ConversionEvent] = []

    def track(
        self,
        session_id: str,
        event_type: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Record a conversion event."""
        event = ConversionEvent(session_id, event_type, metadata)
        self._events.append(event)
        logger.info(
            f"Conversion event: {event_type} (session: {session_id})"
        )

    def suggest_action(
        self,
        persona: str,
        turn_count: int,
        intent: str,
    ) -> str:
        """
        Suggest a conversion action to inject into the prompt.
        
        Returns one of: "none", "brief", "interview", "contact", "walkthrough"
        """
        # Recruiters: offer brief after 2+ turns about projects
        if persona == "technical_recruiter" and turn_count >= 2:
            if intent in ("projects", "technical_skill", "personal_info"):
                return "brief"

        # Engineers: offer code walkthrough after discussing projects
        if persona == "senior_engineer":
            if intent in ("code_walkthrough", "projects") and turn_count >= 3:
                return "walkthrough"

        # Founders: offer interview sim
        if persona in ("startup_founder", "engineering_manager"):
            if turn_count >= 4:
                return "interview"

        # Anyone with 5+ turns: suggest contact
        if turn_count >= 5:
            return "contact"

        return "none"

    def get_session_events(self, session_id: str) -> list[ConversionEvent]:
        """Get all events for a session."""
        return [e for e in self._events if e.session_id == session_id]

    def get_stats(self) -> dict[str, int]:
        """Get aggregate stats."""
        stats: dict[str, int] = {}
        for event in self._events:
            stats[event.event_type] = stats.get(event.event_type, 0) + 1
        return stats


# Module-level singleton
conversion_tracker = ConversionTracker()

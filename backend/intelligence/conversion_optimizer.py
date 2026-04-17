"""
═══════════════════════════════════════════════════════════
Conversion Optimizer (§7)
═══════════════════════════════════════════════════════════

Closes the feedback loop: collects implicit conversion signals,
identifies which conversations lead to interviews/contacts,
and generates prompt improvement suggestions.

Signals collected without asking:
  - Contact info requests
  - Availability inquiries
  - Brief downloads
  - Follow-up depth (3+ follow-ups = high engagement)
  - Return visits within 24h
  - Clipboard copy events
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.intelligence.conversion")


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class ConversionSignal(BaseModel):
    """Signals that a conversation is 'working' — collected without asking."""
    session_id: str
    visitor_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # High-value signals
    asked_for_contact: bool = False
    asked_about_availability: bool = False
    asked_for_resume: bool = False
    copied_text: bool = False
    conversation_duration_minutes: float = 0.0

    # Medium signals
    follow_up_depth: int = 0          # 3+ = high engagement
    return_visit_within_24h: bool = False
    shared_link_detected: bool = False

    # Weak signals
    response_rating: Optional[int] = None  # 1-5 if shown
    session_scroll_depth: float = 0.0

    # Context
    visitor_persona: str = "casual"
    topics_discussed: List[str] = Field(default_factory=list)


class ConversionLevel(str):
    """Conversion tier based on signal strength."""
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CONVERTED = "converted"


# ═══════════════════════════════════════════════════════════
# SIGNAL DETECTOR
# ═══════════════════════════════════════════════════════════

# Keywords that signal conversion intent in chat messages
CONTACT_KEYWORDS = [
    "email", "contact", "reach out", "get in touch", "connect",
    "linkedin", "schedule", "call", "meeting", "calendar",
]

AVAILABILITY_KEYWORDS = [
    "available", "availability", "open to", "looking for",
    "interested in", "hire", "hiring", "freelance", "contract",
    "full-time", "part-time", "remote",
]

RESUME_KEYWORDS = [
    "resume", "cv", "brief", "pdf", "download", "portfolio",
    "experience summary",
]


def detect_conversion_signals(message: str) -> Dict[str, bool]:
    """
    Detect conversion signals from a chat message.
    Returns dict of signal flags.
    """
    msg_lower = message.lower()

    return {
        "asked_for_contact": any(kw in msg_lower for kw in CONTACT_KEYWORDS),
        "asked_about_availability": any(kw in msg_lower for kw in AVAILABILITY_KEYWORDS),
        "asked_for_resume": any(kw in msg_lower for kw in RESUME_KEYWORDS),
    }


def compute_conversion_level(signal: ConversionSignal) -> str:
    """Compute conversion level from accumulated signals."""
    score = 0

    # High-value signals (3 points each)
    if signal.asked_for_contact:
        score += 3
    if signal.asked_about_availability:
        score += 3
    if signal.asked_for_resume:
        score += 3

    # Medium signals (2 points each)
    if signal.follow_up_depth >= 3:
        score += 2
    if signal.return_visit_within_24h:
        score += 2
    if signal.conversation_duration_minutes > 5:
        score += 2
    if signal.copied_text:
        score += 1

    # Weak signals (1 point each)
    if signal.session_scroll_depth > 0.7:
        score += 1
    if signal.response_rating and signal.response_rating >= 4:
        score += 1

    if score >= 6:
        return ConversionLevel.CONVERTED
    elif score >= 4:
        return ConversionLevel.HIGH
    elif score >= 2:
        return ConversionLevel.MEDIUM
    elif score >= 1:
        return ConversionLevel.LOW
    return ConversionLevel.NONE


class ConversionOptimizer:
    """
    Analyzes conversion patterns across conversations.
    Identifies which prompt patterns correlate with success.
    """

    async def should_offer_brief(
        self,
        visitor_persona: str,
        message_count: int,
        asked_availability: bool,
    ) -> bool:
        """Determine if we should proactively offer the recruiter brief."""
        if visitor_persona == "technical_recruiter" and message_count >= 3:
            return True
        if asked_availability:
            return True
        return False

    async def should_offer_interview_mode(
        self,
        visitor_persona: str,
        message_count: int,
        topics: List[str],
    ) -> bool:
        """Determine if we should offer interview simulation mode."""
        if visitor_persona not in ("senior_engineer", "engineering_manager"):
            return False
        if message_count < 2:
            return False
        
        technical_topics = {"architecture", "system design", "algorithm", "code"}
        if any(t.lower() in technical_topics for t in topics):
            return True
        return False

    def generate_prompt_suggestions(
        self,
        high_converting: List[ConversionSignal],
        low_converting: List[ConversionSignal],
    ) -> List[str]:
        """
        Compare high-converting vs low-converting conversations.
        Generate prompt improvement suggestions.
        Human-in-the-loop: suggestions require manual approval.
        """
        suggestions = []

        if not high_converting or not low_converting:
            return ["Insufficient data — need more conversations"]

        # Analyze topic patterns
        high_topics = set()
        for s in high_converting:
            high_topics.update(s.topics_discussed)

        low_topics = set()
        for s in low_converting:
            low_topics.update(s.topics_discussed)

        winning_topics = high_topics - low_topics
        if winning_topics:
            suggestions.append(
                f"Topics that correlate with conversion: {', '.join(winning_topics)}. "
                f"Consider surfacing these more proactively."
            )

        # Analyze response length
        avg_high_duration = sum(s.conversation_duration_minutes for s in high_converting) / len(high_converting)
        avg_low_duration = sum(s.conversation_duration_minutes for s in low_converting) / len(low_converting)

        if avg_high_duration > avg_low_duration * 1.5:
            suggestions.append(
                "Longer conversations correlate with conversion. "
                "Encourage deeper follow-ups and offer walkthroughs."
            )

        return suggestions

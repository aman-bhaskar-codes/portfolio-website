"""
═══════════════════════════════════════════════════════════
Behavioral Security Monitor — ANTIGRAVITY OS v2 (§23.4)
═══════════════════════════════════════════════════════════

Beyond pattern matching — detect sophisticated attacks through
session-level behavioral analysis.

RED FLAGS (accumulate risk score per session):
  +20: Injection pattern detected
  +15: Rapid-fire messages (>5/minute)
  +15: Asking about system prompt / instructions / rules
  +10: Persona change attempts
  +10: Requesting info about other visitors
  +8:  Asking for unsayable things
  +5:  Unusual message structure (repeated delimiters)

THRESHOLDS:
  >30:  Log + increase scrutiny
  >50:  Soft challenge
  >75:  Add 5s delay between responses
  >100: 48h soft-ban + admin alert

NEVER hard-ban. Never reveal detection.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.security.behavioral")


# ═══════════════════════════════════════════════════════════
# RESPONSE POLICY
# ═══════════════════════════════════════════════════════════

class InfoDisclosureLevel:
    FULL = "full"
    REDUCED = "reduced"
    MINIMAL = "minimal"


class ResponsePolicy(BaseModel):
    max_info_disclosure: str = InfoDisclosureLevel.FULL
    add_delay_ms: int = 0
    skip_critical_info_disclosure: bool = False
    flag_for_review: bool = False
    soft_challenge: bool = False


# ═══════════════════════════════════════════════════════════
# SESSION RISK TRACKER
# ═══════════════════════════════════════════════════════════

@dataclass
class SessionRiskProfile:
    session_id: str
    risk_score: int = 0
    message_timestamps: List[float] = field(default_factory=list)
    detected_signals: List[str] = field(default_factory=list)
    soft_banned_until: Optional[float] = None


# In-memory session risk store (Redis in production)
_session_risks: Dict[str, SessionRiskProfile] = {}


class BehavioralSecurityMonitor:
    """Behavioral analysis for detecting sophisticated attacks."""

    # Risk score weights
    WEIGHTS = {
        "injection_pattern": 20,
        "rapid_fire": 15,
        "system_prompt_curiosity": 15,
        "persona_change": 10,
        "other_visitor_info": 10,
        "unsayable_request": 8,
        "unusual_structure": 5,
        "long_encoded_content": 5,
    }

    # Thresholds
    THRESHOLDS = {
        "scrutiny": 30,
        "challenge": 50,
        "delay": 75,
        "soft_ban": 100,
    }

    SOFT_BAN_DURATION = 48 * 3600  # 48 hours

    def assess_message(self, session_id: str, message: str) -> int:
        """
        Assess a single message and return updated risk score.
        """
        profile = _session_risks.get(session_id)
        if not profile:
            profile = SessionRiskProfile(session_id=session_id)
            _session_risks[session_id] = profile

        # Check soft ban
        if profile.soft_banned_until and time.time() < profile.soft_banned_until:
            return profile.risk_score

        now = time.time()
        profile.message_timestamps.append(now)

        # ── Signal detection ──

        msg_lower = message.lower()

        # 1. Rapid fire (>5 messages in 60 seconds)
        recent = [t for t in profile.message_timestamps if now - t < 60]
        if len(recent) > 5:
            profile.risk_score += self.WEIGHTS["rapid_fire"]
            profile.detected_signals.append("rapid_fire")

        # 2. System prompt curiosity
        prompt_keywords = ["system prompt", "instructions", "your rules",
                          "your directives", "your configuration", "how were you built"]
        if any(kw in msg_lower for kw in prompt_keywords):
            profile.risk_score += self.WEIGHTS["system_prompt_curiosity"]
            profile.detected_signals.append("system_prompt_curiosity")

        # 3. Persona change attempts
        persona_keywords = ["pretend you are", "act as if", "roleplay as",
                           "you are now", "from now on you are"]
        if any(kw in msg_lower for kw in persona_keywords):
            profile.risk_score += self.WEIGHTS["persona_change"]
            profile.detected_signals.append("persona_change")

        # 4. Other visitor info
        visitor_keywords = ["other visitors", "other users", "who else visited",
                          "previous conversations", "other people"]
        if any(kw in msg_lower for kw in visitor_keywords):
            profile.risk_score += self.WEIGHTS["other_visitor_info"]
            profile.detected_signals.append("other_visitor_info")

        # 5. Unusual structure (excessive delimiters, encoding)
        delimiter_count = sum(message.count(d) for d in ["###", "---", "```", "==="])
        if delimiter_count > 5:
            profile.risk_score += self.WEIGHTS["unusual_structure"]
            profile.detected_signals.append("unusual_structure")

        # 6. Suspiciously long messages with encoded content
        if len(message) > 1500 and any(c in message for c in ["\\x", "\\u", "base64"]):
            profile.risk_score += self.WEIGHTS["long_encoded_content"]
            profile.detected_signals.append("long_encoded_content")

        # Log threshold crossings
        score = profile.risk_score
        if score >= self.THRESHOLDS["soft_ban"]:
            profile.soft_banned_until = now + self.SOFT_BAN_DURATION
            logger.critical(
                f"🚨 Session {session_id} SOFT-BANNED (score={score}). "
                f"Signals: {profile.detected_signals[-5:]}"
            )
        elif score >= self.THRESHOLDS["delay"]:
            logger.warning(f"⏳ Session {session_id} in DELAY mode (score={score})")
        elif score >= self.THRESHOLDS["challenge"]:
            logger.warning(f"⚠️ Session {session_id} in CHALLENGE mode (score={score})")
        elif score >= self.THRESHOLDS["scrutiny"]:
            logger.info(f"🔍 Session {session_id} under SCRUTINY (score={score})")

        return score

    def add_injection_score(self, session_id: str):
        """Called by injection_shield when patterns are detected."""
        profile = _session_risks.get(session_id)
        if not profile:
            profile = SessionRiskProfile(session_id=session_id)
            _session_risks[session_id] = profile
        profile.risk_score += self.WEIGHTS["injection_pattern"]
        profile.detected_signals.append("injection_pattern")

    def get_response_policy(self, session_id: str) -> ResponsePolicy:
        """Get response generation policy based on risk score."""
        profile = _session_risks.get(session_id)
        if not profile:
            return ResponsePolicy()

        score = profile.risk_score

        # Soft-banned
        if profile.soft_banned_until and time.time() < profile.soft_banned_until:
            return ResponsePolicy(
                max_info_disclosure=InfoDisclosureLevel.MINIMAL,
                add_delay_ms=5000,
                skip_critical_info_disclosure=True,
                flag_for_review=True,
            )

        if score >= self.THRESHOLDS["delay"]:
            return ResponsePolicy(
                max_info_disclosure=InfoDisclosureLevel.MINIMAL,
                add_delay_ms=5000,
                skip_critical_info_disclosure=True,
                flag_for_review=True,
            )

        if score >= self.THRESHOLDS["challenge"]:
            return ResponsePolicy(
                max_info_disclosure=InfoDisclosureLevel.REDUCED,
                add_delay_ms=2000,
                skip_critical_info_disclosure=True,
                soft_challenge=True,
            )

        if score >= self.THRESHOLDS["scrutiny"]:
            return ResponsePolicy(
                max_info_disclosure=InfoDisclosureLevel.REDUCED,
                flag_for_review=True,
            )

        return ResponsePolicy()

    def get_session_risk(self, session_id: str) -> int:
        """Get current risk score for a session."""
        profile = _session_risks.get(session_id)
        return profile.risk_score if profile else 0


# Singleton
behavioral_monitor = BehavioralSecurityMonitor()

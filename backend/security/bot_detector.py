"""
═══════════════════════════════════════════════════════════
Bot Detector — ANTIGRAVITY OS v2 (§23.7)
═══════════════════════════════════════════════════════════

Distinguishes real visitors from scrapers, bots, and automated attacks.

Confirmed bot  (>0.90):  Allow UI access (SEO), block LLM calls
Suspected bot  (0.60-0.90): Allow chat, route to lighter model
Unknown        (<0.60):  Normal flow

NEVER show CAPTCHA. It destroys the premium experience.
"""

from __future__ import annotations

import logging
import re
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Set

from pydantic import BaseModel

logger = logging.getLogger("portfolio.security.bot_detector")


# ═══════════════════════════════════════════════════════════
# BOT CLASSIFICATION
# ═══════════════════════════════════════════════════════════

class BotClassification(Enum):
    HUMAN = "human"
    UNKNOWN = "unknown"
    SUSPECTED_BOT = "suspected_bot"
    CONFIRMED_BOT = "confirmed_bot"


class BotPolicy(BaseModel):
    """Policy decisions based on bot confidence."""
    classification: str = BotClassification.UNKNOWN.value
    confidence: float = 0.0
    allow_llm: bool = True
    use_lighter_model: bool = False
    aggressive_rate_limit: bool = False
    reason: str = ""


# ═══════════════════════════════════════════════════════════
# KNOWN BOT USER AGENTS
# ═══════════════════════════════════════════════════════════

BOT_UA_PATTERNS = [
    r"(?i)googlebot",
    r"(?i)bingbot",
    r"(?i)slurp",
    r"(?i)duckduckbot",
    r"(?i)baiduspider",
    r"(?i)yandexbot",
    r"(?i)sogou",
    r"(?i)facebookexternalhit",
    r"(?i)twitterbot",
    r"(?i)linkedinbot",
    r"(?i)whatsapp",
    r"(?i)telegrambot",
    r"(?i)crawl",
    r"(?i)spider",
    r"(?i)bot\b",
    r"(?i)scraper",
    r"(?i)headless",
    r"(?i)phantomjs",
    r"(?i)selenium",
    r"(?i)puppeteer",
    r"(?i)playwright",
    r"(?i)curl/",
    r"(?i)wget/",
    r"(?i)python-requests",
    r"(?i)httpx",
    r"(?i)node-fetch",
    r"(?i)axios",
    r"(?i)go-http-client",
]

_COMPILED_BOT_UAS = [re.compile(p) for p in BOT_UA_PATTERNS]

# Known datacenter ASN prefixes (partial IP ranges)
DATACENTER_INDICATORS = {
    "datacenter_ips": {
        "34.", "35.", "104.", "130.211.", "142.250.",  # Google Cloud
        "52.", "54.", "18.",                            # AWS
        "40.76.", "40.112.", "40.113.",                # Azure
        "198.41.", "104.16.",                          # Cloudflare
        "159.203.", "167.172.",                        # DigitalOcean
    }
}


# ═══════════════════════════════════════════════════════════
# SESSION SIGNALS
# ═══════════════════════════════════════════════════════════

@dataclass
class VisitorSignals:
    """Behavioral signals collected from the frontend."""
    session_id: str = ""
    user_agent: str = ""
    ip: str = ""
    # Positive (human-like) signals
    has_mouse_events: bool = False
    has_scroll_events: bool = False
    has_keyboard_events: bool = False
    time_to_first_message_ms: int = 0
    referrer: str = ""
    # Timing
    message_inter_arrival_ms: List[int] = field(default_factory=list)
    session_start_time: float = field(default_factory=time.time)


# ═══════════════════════════════════════════════════════════
# BOT DETECTOR
# ═══════════════════════════════════════════════════════════

class BotDetector:
    """
    Multi-signal bot detection without CAPTCHA.
    """

    def __init__(self):
        self._sessions: Dict[str, VisitorSignals] = {}

    def register_signals(self, signals: VisitorSignals):
        """Register behavioral signals from frontend."""
        self._sessions[signals.session_id] = signals

    def classify(self, session_id: str, user_agent: str = "", ip: str = "") -> BotPolicy:
        """
        Classify a visitor as human or bot.
        Returns policy decisions.
        """
        signals = self._sessions.get(session_id)
        if not signals:
            signals = VisitorSignals(
                session_id=session_id, user_agent=user_agent, ip=ip
            )

        score = 0.0  # 0 = definitely human, 1 = definitely bot
        reasons = []

        # ── Bad signals (bot-like) ──

        # Check user agent
        ua = signals.user_agent or user_agent
        if ua:
            for pattern in _COMPILED_BOT_UAS:
                if pattern.search(ua):
                    score += 0.6
                    reasons.append(f"bot_ua:{ua[:50]}")
                    break
            if not ua or len(ua) < 10:
                score += 0.2
                reasons.append("missing_or_short_ua")

        # Check IP (datacenter)
        check_ip = signals.ip or ip
        if check_ip:
            for prefix in DATACENTER_INDICATORS["datacenter_ips"]:
                if check_ip.startswith(prefix):
                    score += 0.15
                    reasons.append("datacenter_ip")
                    break

        # No JS execution (no behavioral events at all)
        if not any([
            signals.has_mouse_events,
            signals.has_scroll_events,
            signals.has_keyboard_events,
        ]):
            # Only penalize if session is old enough (>5s)
            age = time.time() - signals.session_start_time
            if age > 5:
                score += 0.25
                reasons.append("no_js_interaction")

        # Instant responses (<500ms between messages)
        if signals.message_inter_arrival_ms:
            fast_count = sum(
                1 for ms in signals.message_inter_arrival_ms if ms < 500
            )
            if fast_count > 2:
                score += 0.3
                reasons.append("instant_responses")

        # ── Good signals (human-like) ──

        if signals.has_mouse_events:
            score -= 0.15
        if signals.has_scroll_events:
            score -= 0.1
        if signals.has_keyboard_events:
            score -= 0.15

        # Time before first message (>30s = likely reading page)
        if signals.time_to_first_message_ms > 30_000:
            score -= 0.1

        # Has referrer (organic traffic)
        if signals.referrer:
            score -= 0.05

        # Clamp to [0, 1]
        score = max(0.0, min(1.0, score))

        # ── Classify ──
        if score > 0.90:
            classification = BotClassification.CONFIRMED_BOT
        elif score > 0.60:
            classification = BotClassification.SUSPECTED_BOT
        elif score < 0.30:
            classification = BotClassification.HUMAN
        else:
            classification = BotClassification.UNKNOWN

        # ── Policy ──
        policy = BotPolicy(
            classification=classification.value,
            confidence=round(score, 2),
            allow_llm=classification != BotClassification.CONFIRMED_BOT,
            use_lighter_model=classification == BotClassification.SUSPECTED_BOT,
            aggressive_rate_limit=classification in (
                BotClassification.CONFIRMED_BOT,
                BotClassification.SUSPECTED_BOT,
            ),
            reason=", ".join(reasons) if reasons else "normal_behavior",
        )

        if classification != BotClassification.HUMAN:
            logger.info(
                f"Bot detection: session={session_id}, "
                f"classification={classification.value}, "
                f"confidence={score:.2f}, reasons={reasons}"
            )

        return policy


# Singleton
bot_detector = BotDetector()

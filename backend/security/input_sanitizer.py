"""
═══════════════════════════════════════════════════════════
Input Sanitization Pipeline — ANTIGRAVITY OS v2 (§23.5)
═══════════════════════════════════════════════════════════

Runs before EVERY message enters LangGraph. Six stages:

  1. LENGTH CHECK         — max 2000 chars
  2. ENCODING NORMALIZE   — NFD→NFC, strip zero-width
  3. INJECTION SCAN       — PromptInjectionShield
  4. PII SCRUB (logs)     — emails, phones from logs only
  5. CONTENT MODERATION   — lightweight keyword toxicity
  6. BEHAVIORAL SCORING   — session risk accumulation
"""

from __future__ import annotations

import logging
import re
import unicodedata
from typing import Optional

from pydantic import BaseModel, Field

from backend.security.injection_shield import injection_shield, ScanResult
from backend.security.behavioral_monitor import behavioral_monitor, ResponsePolicy

logger = logging.getLogger("portfolio.security.sanitizer")


# ═══════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════

MAX_MESSAGE_LENGTH = 2000

# Zero-width characters used in injection attacks
ZERO_WIDTH_CHARS = re.compile(
    "[\u200b\u200c\u200d\u200e\u200f\u2060\u2061\u2062\u2063\u2064\ufeff]"
)

# PII patterns (for log scrubbing only — NOT removed from user message)
PII_EMAIL = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PII_PHONE = re.compile(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}")
PII_CREDIT_CARD = re.compile(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b")

# Toxicity keywords (only block SEVERE — this is not a children's service)
SEVERE_TOXICITY = [
    "kill yourself", "kys", "bomb threat", "child porn",
    "child abuse", "csam",
]


# ═══════════════════════════════════════════════════════════
# RESULT MODEL
# ═══════════════════════════════════════════════════════════

class SanitizationResult(BaseModel):
    """Result of the full sanitization pipeline."""
    original_message: str = ""
    sanitized_message: str = ""
    was_truncated: bool = False
    injection_scan: Optional[ScanResult] = None
    response_policy: ResponsePolicy = Field(default_factory=ResponsePolicy)
    blocked: bool = False
    block_reason: str = ""
    log_safe_message: str = ""  # PII-scrubbed version for logs


# ═══════════════════════════════════════════════════════════
# PIPELINE
# ═══════════════════════════════════════════════════════════

class InputSanitizationPipeline:
    """
    Six-stage sanitization pipeline.
    Every message must pass through this before reaching the agent.
    """

    def sanitize(self, message: str, session_id: str = "") -> SanitizationResult:
        """
        Run the full pipeline. Returns sanitized message + metadata.
        """
        result = SanitizationResult(original_message=message)

        # ── Stage 1: Length check ──
        if len(message) > MAX_MESSAGE_LENGTH:
            message = message[:MAX_MESSAGE_LENGTH]
            result.was_truncated = True
            logger.info(
                f"Message truncated: {len(result.original_message)} → "
                f"{MAX_MESSAGE_LENGTH} chars"
            )

        # ── Stage 2: Encoding normalization ──
        message = self._normalize_encoding(message)

        # ── Stage 3: Injection scan ──
        scan = injection_shield.scan_user_message(message)
        result.injection_scan = scan

        if scan.blocked:
            result.blocked = True
            result.block_reason = "injection_detected"
            result.sanitized_message = ""
            result.log_safe_message = self._scrub_pii(message)

            # Update behavioral monitor
            if session_id:
                behavioral_monitor.add_injection_score(session_id)

            return result

        # ── Stage 4: PII scrubbing (logs only) ──
        result.log_safe_message = self._scrub_pii(message)

        # ── Stage 5: Content moderation ──
        if self._check_severe_toxicity(message):
            result.blocked = True
            result.block_reason = "severe_toxicity"
            result.sanitized_message = ""
            logger.warning(f"Message blocked: severe toxicity in session {session_id}")
            return result

        # ── Stage 6: Behavioral scoring ──
        if session_id:
            behavioral_monitor.assess_message(session_id, message)
            result.response_policy = behavioral_monitor.get_response_policy(session_id)

        result.sanitized_message = message
        return result

    def _normalize_encoding(self, text: str) -> str:
        """Normalize unicode and strip zero-width characters."""
        # NFD → NFC normalization
        text = unicodedata.normalize("NFC", text)

        # Strip zero-width characters (common in injection attacks)
        text = ZERO_WIDTH_CHARS.sub("", text)

        # Strip control characters (except newline, tab)
        text = "".join(
            ch for ch in text
            if ch in ("\n", "\t", "\r") or not unicodedata.category(ch).startswith("C")
        )

        return text.strip()

    def _scrub_pii(self, text: str) -> str:
        """Scrub PII from text for safe logging. NOT from the user message."""
        scrubbed = PII_EMAIL.sub("[EMAIL]", text)
        scrubbed = PII_PHONE.sub("[PHONE]", scrubbed)
        scrubbed = PII_CREDIT_CARD.sub("[CARD]", scrubbed)
        return scrubbed

    def _check_severe_toxicity(self, text: str) -> bool:
        """Check for SEVERE toxicity only. Broad latitude for portfolio visitors."""
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in SEVERE_TOXICITY)


# Singleton
sanitizer = InputSanitizationPipeline()

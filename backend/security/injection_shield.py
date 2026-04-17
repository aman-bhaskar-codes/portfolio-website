"""
═══════════════════════════════════════════════════════════
Prompt Injection Shield — ANTIGRAVITY OS v2 (§23.3)
═══════════════════════════════════════════════════════════

Runs on EVERY incoming message AND every RAG chunk.

TWO ATTACK SURFACES:
  1. USER MESSAGE INJECTION (direct attack)
  2. RAG CHUNK INJECTION (indirect — poisoned GitHub README)

Severity levels:
  CRITICAL: Block and return refusal. Log with full context.
  HIGH:     Sanitize + flag. Soft warning in response.
  MEDIUM:   Log. Respond normally. Monitor follow-ups.
  LOW:      Log silently.
"""

from __future__ import annotations

import logging
import re
from enum import Enum
from typing import Dict, List, Optional, Tuple

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.security.injection")


# ═══════════════════════════════════════════════════════════
# SEVERITY LEVELS
# ═══════════════════════════════════════════════════════════

class Severity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# ═══════════════════════════════════════════════════════════
# SCAN RESULT
# ═══════════════════════════════════════════════════════════

class ScanResult(BaseModel):
    """Result of an injection scan."""
    clean: bool = True
    severity: str = "none"
    detected_patterns: List[str] = Field(default_factory=list)
    sanitized_content: Optional[str] = None
    blocked: bool = False
    refusal_message: str = ""


# ═══════════════════════════════════════════════════════════
# INJECTION PATTERNS
# ═══════════════════════════════════════════════════════════

# (pattern, severity, description)
INJECTION_PATTERNS: List[Tuple[str, Severity, str]] = [
    # ── DIRECT OVERRIDE ATTEMPTS ──
    (r"ignore\s+(previous|all|above|prior)\s+instructions?", Severity.CRITICAL, "override_instructions"),
    (r"forget\s+(everything|all|your)\s+(instructions?|context|prompt|rules)", Severity.CRITICAL, "forget_instructions"),
    (r"you\s+are\s+now\s+a?\s*different", Severity.CRITICAL, "identity_override"),
    (r"new\s+instructions?\s*:", Severity.CRITICAL, "new_instructions"),
    (r"override\s+(your|the|all)\s+(rules?|instructions?|constraints?)", Severity.CRITICAL, "override_rules"),
    (r"disregard\s+(your|all|previous)\s+(instructions?|rules?)", Severity.CRITICAL, "disregard"),

    # ── EXTRACTION ATTEMPTS ──
    (r"repeat\s+(your|the|all)\s+(instructions?|prompt|context|system)", Severity.HIGH, "extract_prompt"),
    (r"print\s+(your|the)\s+system\s+prompt", Severity.HIGH, "print_prompt"),
    (r"what\s+(are|were)\s+your\s+(instructions?|rules?|directives?)", Severity.HIGH, "extract_instructions"),
    (r"output\s+(everything|all|text)\s+(before|above|prior)", Severity.HIGH, "output_above"),
    (r"show\s+me\s+(your|the)\s+(system\s+)?prompt", Severity.HIGH, "show_prompt"),
    (r"reveal\s+(your|the)\s+(instructions?|prompt|rules)", Severity.HIGH, "reveal_prompt"),

    # ── ROLE HIJACKING ──
    (r"jailbreak", Severity.CRITICAL, "jailbreak"),
    (r"\bdan\s*mode\b", Severity.CRITICAL, "dan_mode"),
    (r"developer\s*mode", Severity.CRITICAL, "developer_mode"),
    (r"unrestricted\s*mode", Severity.CRITICAL, "unrestricted_mode"),
    (r"no\s+filter\s+mode", Severity.CRITICAL, "no_filter"),
    (r"act\s+as\s+(if\s+you\s+are\s+)?(?!aman)", Severity.MEDIUM, "role_hijack"),
    (r"pretend\s+(you\s+are|to\s+be)\s+(?!aman)", Severity.MEDIUM, "pretend_other"),
    (r"roleplay\s+as\s+(?!aman)", Severity.MEDIUM, "roleplay"),

    # ── INDIRECT INJECTION (content delimiters) ──
    (r"###\s*SYSTEM", Severity.HIGH, "system_delimiter"),
    (r"\[INST\]", Severity.HIGH, "inst_delimiter"),
    (r"<\|im_start\|>", Severity.HIGH, "im_start"),
    (r"<\|system\|>", Severity.HIGH, "system_tag"),
    (r"<\|user\|>", Severity.HIGH, "user_tag"),
    (r"<<SYS>>", Severity.HIGH, "llama_sys"),

    # ── INFO EXTRACTION ──
    (r"(phone|mobile)\s+(number|#)", Severity.MEDIUM, "phone_extraction"),
    (r"salary\s+(expectation|range|requirement)", Severity.MEDIUM, "salary_extraction"),
    (r"what\s+(salary|compensation|pay)\s+(does|would|is)", Severity.MEDIUM, "compensation_query"),
    (r"deal\s*breaker", Severity.LOW, "deal_breaker_query"),
]

# Pre-compile for performance
_COMPILED_PATTERNS = [
    (re.compile(pattern, re.IGNORECASE), severity, desc)
    for pattern, severity, desc in INJECTION_PATTERNS
]


# ═══════════════════════════════════════════════════════════
# REFUSALS (sound like Aman, not a corporate bot)
# ═══════════════════════════════════════════════════════════

REFUSALS: Dict[str, List[str]] = {
    "critical": [
        "Nice try — but you're talking to Aman's digital presence, and I'm not going to override my own identity. What were you actually trying to learn about my work?",
        "I appreciate the creativity, but I'm pretty committed to being myself here. What can I actually help you with?",
        "That's a clever approach, but it won't work on me. I'm built to represent Aman authentically. What would you like to know about his projects?",
    ],
    "high": [
        "I can't share my internal configuration, but I can tell you a LOT about Aman's actual work. What interests you?",
        "My system internals aren't part of the conversation, but everything about Aman's engineering work is. What would you like to explore?",
    ],
    "medium": [
        "I'd rather stay in character as Aman's representative. What specific question can I help with?",
    ],
}


# ═══════════════════════════════════════════════════════════
# PROMPT INJECTION SHIELD
# ═══════════════════════════════════════════════════════════

class PromptInjectionShield:
    """
    Scans user messages and RAG chunks for injection attacks.
    """

    def scan_user_message(self, message: str) -> ScanResult:
        """
        Scan an incoming chat message for injection patterns.
        Returns ScanResult with severity and optional refusal.
        """
        if not message or not message.strip():
            return ScanResult()

        detected = []
        max_severity = Severity.LOW
        max_severity_order = {"low": 0, "medium": 1, "high": 2, "critical": 3}

        for compiled, severity, description in _COMPILED_PATTERNS:
            if compiled.search(message):
                detected.append(description)
                if max_severity_order.get(severity.value, 0) > max_severity_order.get(max_severity.value, 0):
                    max_severity = severity

        if not detected:
            return ScanResult()

        # Determine response
        blocked = max_severity in (Severity.CRITICAL, Severity.HIGH)
        refusal = ""
        if blocked:
            import random
            refusals = REFUSALS.get(max_severity.value, REFUSALS["medium"])
            refusal = random.choice(refusals)

        # Log the attempt
        severity_emoji = {
            "critical": "🚨",
            "high": "⚠️",
            "medium": "📋",
            "low": "📝",
        }
        logger.warning(
            f"{severity_emoji.get(max_severity.value, '📝')} "
            f"Injection detected [{max_severity.value.upper()}]: "
            f"patterns={detected}, message_preview='{message[:100]}...'"
        )

        return ScanResult(
            clean=False,
            severity=max_severity.value,
            detected_patterns=detected,
            blocked=blocked,
            refusal_message=refusal,
        )

    def scan_rag_chunk(self, content: str, source: str = "") -> ScanResult:
        """
        Scan a retrieved RAG chunk for injection payloads.
        An attacker could seed their GitHub README with injection payloads.

        If injection detected: strip the payload, keep legitimate content.
        """
        if not content:
            return ScanResult()

        detected = []
        sanitized = content

        for compiled, severity, description in _COMPILED_PATTERNS:
            # Only check for delimiters and override attempts in RAG chunks
            if severity in (Severity.CRITICAL, Severity.HIGH):
                match = compiled.search(sanitized)
                if match:
                    detected.append(description)
                    # Strip the injection payload (the matched text)
                    sanitized = compiled.sub("[REDACTED]", sanitized)

        if not detected:
            return ScanResult()

        logger.warning(
            f"⚠️ RAG chunk injection detected from source '{source}': "
            f"patterns={detected}"
        )

        return ScanResult(
            clean=False,
            severity="high",
            detected_patterns=detected,
            sanitized_content=sanitized,
            blocked=False,  # Don't block RAG results, just sanitize
        )


# Singleton
injection_shield = PromptInjectionShield()

# backend/security/injection_detector.py
"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Injection Detector (Spec-compatible API)
═══════════════════════════════════════════════════════════

Provides the scan_message() function expected by the spec's chat.py.
Delegates to the existing PromptInjectionShield from V2.
"""
from backend.security.injection_shield import injection_shield


def scan_message(message: str) -> dict:
    """
    Scan a chat message for prompt injection.

    Returns dict with:
        - clean: bool
        - severity: str ("none", "low", "medium", "high", "critical")
        - detected_patterns: list[str]
        - blocked: bool
        - refusal_message: str
    """
    result = injection_shield.scan_user_message(message)
    return {
        "clean": result.clean,
        "severity": result.severity,
        "detected_patterns": result.detected_patterns,
        "blocked": result.blocked,
        "refusal_message": result.refusal_message,
    }

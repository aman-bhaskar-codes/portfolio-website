"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Visitor Classifier (§19)
═══════════════════════════════════════════════════════════

Infers visitor persona based on referrer, UTM tags, user agent, etc.
"""

from __future__ import annotations

import hashlib
from datetime import date
from enum import Enum


class VisitorPersona(str, Enum):
    TECHNICAL_RECRUITER = "technical_recruiter"
    ENGINEERING_MANAGER = "engineering_manager"
    SENIOR_ENGINEER = "senior_engineer"
    STARTUP_FOUNDER = "startup_founder"
    CASUAL = "casual"


# Strongest signals: matching domain in referrer
REFERRER_SIGNALS = {
    # Recruiters / ATS
    "linkedin.com/jobs": (VisitorPersona.TECHNICAL_RECRUITER, 0.80),
    "lever.co": (VisitorPersona.TECHNICAL_RECRUITER, 0.85),
    "greenhouse.io": (VisitorPersona.TECHNICAL_RECRUITER, 0.85),
    "ashbyhq.com": (VisitorPersona.TECHNICAL_RECRUITER, 0.85),
    
    # Founders / Startups
    "wellfound.com": (VisitorPersona.STARTUP_FOUNDER, 0.70),
    "ycombinator.com": (VisitorPersona.STARTUP_FOUNDER, 0.75),
    
    # Engineers
    "github.com": (VisitorPersona.SENIOR_ENGINEER, 0.70),
    "news.ycombinator.com": (VisitorPersona.SENIOR_ENGINEER, 0.65),
    "reddit.com/r/cscareer": (VisitorPersona.TECHNICAL_RECRUITER, 0.60),
    "reddit.com/r/programming": (VisitorPersona.SENIOR_ENGINEER, 0.60),
}


# Strong signals: domain from company IP resolution
COMPANY_SIGNALS = {
    # Big Tech -> Engineer or EM
    "google.com": VisitorPersona.SENIOR_ENGINEER,
    "meta.com": VisitorPersona.SENIOR_ENGINEER,
    "amazon.com": VisitorPersona.ENGINEERING_MANAGER,
    "apple.com": VisitorPersona.SENIOR_ENGINEER,
    "microsoft.com": VisitorPersona.SENIOR_ENGINEER,
    "netflix.com": VisitorPersona.SENIOR_ENGINEER,
    
    # High-growth startups
    "stripe.com": VisitorPersona.STARTUP_FOUNDER,
    "openai.com": VisitorPersona.SENIOR_ENGINEER,
    "anthropic.com": VisitorPersona.SENIOR_ENGINEER,
}


class VisitorClassifier:
    """Classifies a visitor based on multiple signals."""

    def classify(
        self,
        referrer: str = "",
        company_domain: str = "",
        utm_source: str = "",
        user_agent: str = "",
    ) -> tuple[VisitorPersona, float]:
        """
        Return the detected persona and confidence score.
        """
        referrer_lower = referrer.lower()
        company_lower = company_domain.lower()
        utm_lower = utm_source.lower()

        # 1. Check referrer (strongest signal)
        if referrer_lower:
            for domain, (persona, confidence) in REFERRER_SIGNALS.items():
                if domain in referrer_lower:
                    return persona, confidence

        # 2. Check company domain (strong signal)
        if company_lower:
            for domain, persona in COMPANY_SIGNALS.items():
                if domain in company_lower:
                    # Slightly less confidence than direct referrer link
                    return persona, 0.70

        # 3. Check UTM source
        if utm_lower in ("lever", "greenhouse", "ashby", "workday"):
            return VisitorPersona.TECHNICAL_RECRUITER, 0.75
            
        if utm_lower in ("hn", "github"):
            return VisitorPersona.SENIOR_ENGINEER, 0.70

        # 4. Check User Agent traces (weak signals)
        ua_lower = user_agent.lower()
        if "curl" in ua_lower or "postman" in ua_lower or "insomnia" in ua_lower:
            # Only devs use curl on APIs
            return VisitorPersona.SENIOR_ENGINEER, 0.80

        # Default fallback
        return VisitorPersona.CASUAL, 0.50

    def get_anonymous_id(self, ip: str, user_agent: str) -> str:
        """
        Generate a daily-rotating anonymous ID for rate limiting
        and session tracking without storing PII natively.
        """
        # Salt with the current date to rotate daily
        raw = f"{ip}:{user_agent}:{date.today().isoformat()}"
        return hashlib.sha256(raw.encode()).hexdigest()[:16]


# Shared instance
visitor_classifier = VisitorClassifier()

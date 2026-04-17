"""
═══════════════════════════════════════════════════════════
Visitor Intelligence Pipeline — Persona Classifier
═══════════════════════════════════════════════════════════

Classifies every visitor into a VisitorPersona from behavioral signals
BEFORE they say a word. This is the keystone of persona-first design.

Signal weights (tunable):
  - Referrer domain:          weight=0.35 (strongest signal)
  - Company domain (rev DNS): weight=0.30
  - UTM parameters:           weight=0.25
  - Behavioral patterns:      weight=0.10
"""

from __future__ import annotations

import logging
import re
from enum import Enum
from typing import List, Optional, Dict

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.intelligence.visitor")


# ═══════════════════════════════════════════════════════════
# ENUMS & MODELS
# ═══════════════════════════════════════════════════════════

class VisitorPersona(str, Enum):
    TECHNICAL_RECRUITER = "technical_recruiter"
    ENGINEERING_MANAGER = "engineering_manager"
    SENIOR_ENGINEER = "senior_engineer"
    STARTUP_FOUNDER = "startup_founder"
    OSS_CONTRIBUTOR = "oss_contributor"
    CASUAL = "casual"


class CompanyProfile(BaseModel):
    """Resolved company information from IP/referrer signals."""
    name: str
    domain: str
    tech_stack: List[str] = Field(default_factory=list)
    industry: str = "technology"
    is_faang: bool = False
    is_startup: bool = False


class VisitorSignal(BaseModel):
    """Raw behavioral signals collected from the session."""
    referrer: str = ""
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    time_of_day: int = 12                       # 0–23
    is_weekday: bool = True
    company_domain: Optional[str] = None
    scroll_depth_on_projects: float = 0.0       # 0.0–1.0
    hover_time_on_tech_stack: float = 0.0       # seconds
    opened_github_links: bool = False
    chat_opening_message: str = ""
    session_path: List[str] = Field(default_factory=list)
    user_agent: str = ""
    client_ip: str = ""


class PersonaClassificationResult(BaseModel):
    """Output of the visitor classification pipeline."""
    persona: VisitorPersona
    confidence: float = Field(ge=0.0, le=1.0)
    company: Optional[CompanyProfile] = None
    signals_used: List[str] = Field(default_factory=list)
    context_injection: str = ""


# ═══════════════════════════════════════════════════════════
# PERSONA-SPECIFIC SYSTEM PROMPT INJECTIONS
# ═══════════════════════════════════════════════════════════

PERSONA_SYSTEM_PROMPTS: Dict[VisitorPersona, str] = {
    VisitorPersona.TECHNICAL_RECRUITER: """
This visitor is a technical recruiter. Lead every response with the most 
recruiter-relevant facts: years of experience, key technologies, availability, 
seniority indicators, team size worked with. Offer to generate a recruiter brief.
Keep technical depth moderate — translate acronyms. Highlight impact in business 
terms (e.g., "reduced API latency by 40%, enabling 3x user scale").
""".strip(),

    VisitorPersona.ENGINEERING_MANAGER: """
This visitor is an engineering manager. Balance technical credibility with 
collaborative and leadership signals. Highlight: mentorship, code review practices,
cross-team communication, delivering under uncertainty, project scoping, estimations.
Frame projects in terms of team impact, delivery timelines, stakeholder management.
""".strip(),

    VisitorPersona.SENIOR_ENGINEER: """
This visitor is a senior engineer. Go deep. Skip introductory explanations.
Discuss architecture decisions, tradeoffs, what you would do differently.
Reference specific design patterns, performance characteristics, failure modes.
Show actual code when relevant. Treat them as a peer — be direct and technical.
""".strip(),

    VisitorPersona.STARTUP_FOUNDER: """
This visitor is a founder or in a startup context. Emphasize: full-stack ownership,
shipping fast, wearing multiple hats, cost-efficiency (OSS choices), production 
reliability, ability to own a product end-to-end. Show scrappiness + craft together.
""".strip(),

    VisitorPersona.OSS_CONTRIBUTOR: """
This visitor is an open-source contributor. Focus on: collaboration patterns,
contribution history, code review practices, documentation quality, community
engagement. Reference specific commits, PRs, and architectural decisions.
""".strip(),

    VisitorPersona.CASUAL: """
This visitor is casually browsing. Keep responses friendly, accessible, and
jargon-light. Lead with the story and impact, not implementation details.
Invite them to explore further if something sparks interest.
""".strip(),
}


# ═══════════════════════════════════════════════════════════
# REFERRER → PERSONA MAPPING
# ═══════════════════════════════════════════════════════════

# Domains → persona hints (strongest signal)
REFERRER_PERSONA_MAP: Dict[str, VisitorPersona] = {
    # Recruiter signals
    "linkedin.com/jobs": VisitorPersona.TECHNICAL_RECRUITER,
    "linkedin.com/talent": VisitorPersona.TECHNICAL_RECRUITER,
    "lever.co": VisitorPersona.TECHNICAL_RECRUITER,
    "greenhouse.io": VisitorPersona.TECHNICAL_RECRUITER,
    "workday.com": VisitorPersona.TECHNICAL_RECRUITER,
    "ashbyhq.com": VisitorPersona.TECHNICAL_RECRUITER,
    "gem.com": VisitorPersona.TECHNICAL_RECRUITER,
    # Engineer signals
    "github.com": VisitorPersona.SENIOR_ENGINEER,
    "stackoverflow.com": VisitorPersona.SENIOR_ENGINEER,
    "news.ycombinator.com": VisitorPersona.SENIOR_ENGINEER,
    "reddit.com/r/programming": VisitorPersona.SENIOR_ENGINEER,
    "dev.to": VisitorPersona.SENIOR_ENGINEER,
    # Manager signals
    "linkedin.com": VisitorPersona.ENGINEERING_MANAGER,
    # Founder signals
    "producthunt.com": VisitorPersona.STARTUP_FOUNDER,
    "ycombinator.com": VisitorPersona.STARTUP_FOUNDER,
    "crunchbase.com": VisitorPersona.STARTUP_FOUNDER,
    "f6s.com": VisitorPersona.STARTUP_FOUNDER,
}

# UTM source → persona hints
UTM_PERSONA_MAP: Dict[str, VisitorPersona] = {
    "lever": VisitorPersona.TECHNICAL_RECRUITER,
    "greenhouse": VisitorPersona.TECHNICAL_RECRUITER,
    "ashby": VisitorPersona.TECHNICAL_RECRUITER,
    "linkedin_recruiter": VisitorPersona.TECHNICAL_RECRUITER,
    "github": VisitorPersona.SENIOR_ENGINEER,
    "hackernews": VisitorPersona.SENIOR_ENGINEER,
    "producthunt": VisitorPersona.STARTUP_FOUNDER,
    "yc": VisitorPersona.STARTUP_FOUNDER,
}


# ═══════════════════════════════════════════════════════════
# CLASSIFICATION ENGINE
# ═══════════════════════════════════════════════════════════

async def classify_visitor(signal: VisitorSignal) -> PersonaClassificationResult:
    """
    Multi-signal classification pipeline.
    
    Scoring approach: accumulate weighted evidence for each persona,
    then pick the persona with the highest combined score.
    """
    scores: Dict[VisitorPersona, float] = {p: 0.0 for p in VisitorPersona}
    signals_used: List[str] = []

    # ── 1. Referrer Analysis (weight=0.35) ──
    referrer = signal.referrer.lower()
    referrer_matched = False
    for domain_pattern, persona in REFERRER_PERSONA_MAP.items():
        if domain_pattern in referrer:
            scores[persona] += 0.35
            signals_used.append(f"referrer:{domain_pattern}")
            referrer_matched = True
            break
    
    if not referrer_matched and referrer:
        # Generic LinkedIn (not jobs/talent) → likely manager or recruiter
        if "linkedin.com" in referrer:
            scores[VisitorPersona.ENGINEERING_MANAGER] += 0.15
            scores[VisitorPersona.TECHNICAL_RECRUITER] += 0.15
            signals_used.append("referrer:linkedin_generic")

    # ── 2. Company Domain (weight=0.30) ──
    if signal.company_domain:
        company_lower = signal.company_domain.lower()
        signals_used.append(f"company:{company_lower}")

        faang_domains = {"google.com", "meta.com", "apple.com", "amazon.com", "microsoft.com",
                         "netflix.com", "stripe.com", "openai.com", "anthropic.com", "deepmind.com"}
        startup_signals = any(kw in company_lower for kw in ["startup", "ventures", "capital", "labs"])

        if company_lower in faang_domains:
            scores[VisitorPersona.SENIOR_ENGINEER] += 0.20
            scores[VisitorPersona.ENGINEERING_MANAGER] += 0.10
        elif startup_signals or ".io" in company_lower:
            scores[VisitorPersona.STARTUP_FOUNDER] += 0.20
            scores[VisitorPersona.SENIOR_ENGINEER] += 0.10
        else:
            # Unknown company — moderate recruiter signal
            scores[VisitorPersona.TECHNICAL_RECRUITER] += 0.15
            scores[VisitorPersona.ENGINEERING_MANAGER] += 0.10

    # ── 3. UTM Parameters (weight=0.25) ──
    if signal.utm_source:
        utm_lower = signal.utm_source.lower()
        if utm_lower in UTM_PERSONA_MAP:
            scores[UTM_PERSONA_MAP[utm_lower]] += 0.25
            signals_used.append(f"utm_source:{utm_lower}")
        elif "recruit" in utm_lower or "talent" in utm_lower:
            scores[VisitorPersona.TECHNICAL_RECRUITER] += 0.20
            signals_used.append(f"utm_source:{utm_lower}_inferred")

    # ── 4. Behavioral Signals (weight=0.10) ──
    behavioral_score = 0.0

    # Time-based heuristics
    if signal.is_weekday and 9 <= signal.time_of_day <= 18:
        # Business hours → likely professional (recruiter/manager)
        scores[VisitorPersona.TECHNICAL_RECRUITER] += 0.03
        scores[VisitorPersona.ENGINEERING_MANAGER] += 0.03
        signals_used.append("time:business_hours")
    elif signal.time_of_day >= 22 or signal.time_of_day <= 5:
        # Late night / early morning → likely engineer
        scores[VisitorPersona.SENIOR_ENGINEER] += 0.05
        signals_used.append("time:late_night")

    # GitHub link clicking → engineer signal
    if signal.opened_github_links:
        scores[VisitorPersona.SENIOR_ENGINEER] += 0.05
        scores[VisitorPersona.OSS_CONTRIBUTOR] += 0.03
        signals_used.append("behavior:opened_github")

    # Deep project scrolling → interested in depth
    if signal.scroll_depth_on_projects > 0.7:
        scores[VisitorPersona.SENIOR_ENGINEER] += 0.03
        signals_used.append("behavior:deep_scroll")

    # Tech stack hover → checking fit
    if signal.hover_time_on_tech_stack > 3.0:
        scores[VisitorPersona.TECHNICAL_RECRUITER] += 0.04
        signals_used.append("behavior:tech_stack_hover")

    # ── 5. Chat Opening Message Analysis ──
    if signal.chat_opening_message:
        msg = signal.chat_opening_message.lower()
        
        recruiter_keywords = ["hire", "avail", "interest", "opportuni", "role", "position", 
                              "candidate", "team", "salary", "compensat"]
        engineer_keywords = ["architect", "design", "implement", "scale", "latency", 
                             "tradeoff", "pattern", "algorithm", "complexity", "code"]
        founder_keywords = ["build", "mvp", "startup", "ship", "product", "cofounder",
                            "equity", "fullstack", "full-stack"]
        
        for kw in recruiter_keywords:
            if kw in msg:
                scores[VisitorPersona.TECHNICAL_RECRUITER] += 0.06
                signals_used.append(f"chat_keyword:{kw}")
                break

        for kw in engineer_keywords:
            if kw in msg:
                scores[VisitorPersona.SENIOR_ENGINEER] += 0.06
                signals_used.append(f"chat_keyword:{kw}")
                break

        for kw in founder_keywords:
            if kw in msg:
                scores[VisitorPersona.STARTUP_FOUNDER] += 0.06
                signals_used.append(f"chat_keyword:{kw}")
                break

    # ── 6. Resolve: pick highest scoring persona ──
    best_persona = max(scores, key=scores.get)  # type: ignore
    best_score = scores[best_persona]

    # Minimum confidence threshold — fallback to CASUAL
    if best_score < 0.10:
        best_persona = VisitorPersona.CASUAL
        best_score = 0.5  # Default moderate confidence
        signals_used.append("fallback:no_strong_signal")

    # Normalize confidence to 0–1
    confidence = min(1.0, best_score / 0.60)  # 0.60 = perfect multi-signal match

    # Build context injection string
    context_injection = PERSONA_SYSTEM_PROMPTS.get(best_persona, "")

    logger.info(
        f"Visitor classified: persona={best_persona.value}, "
        f"confidence={confidence:.2f}, signals={signals_used}"
    )

    return PersonaClassificationResult(
        persona=best_persona,
        confidence=round(confidence, 3),
        company=None,  # Populated by company_resolver
        signals_used=signals_used,
        context_injection=context_injection,
    )

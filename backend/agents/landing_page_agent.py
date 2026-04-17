"""
═══════════════════════════════════════════════════════════
Dynamic Landing Page Agent — ANTIGRAVITY OS v2 (§27.3)
═══════════════════════════════════════════════════════════

Pre-generates 6 hero section variants (one per visitor persona).
SSR: Next.js server component selects variant before HTML is sent.

Cached in Redis (TTL: 24h) — NOT AI-generated per request.
No flash of wrong content. Google gets CASUAL variant (SEO-safe).
"""

from __future__ import annotations

import logging
from typing import Dict, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.agents.landing_page")


# ═══════════════════════════════════════════════════════════
# HERO VARIANTS
# ═══════════════════════════════════════════════════════════

class HeroVariant(BaseModel):
    """A persona-specific hero section variant."""
    persona: str
    headline: str
    subtext: str
    cta_text: str
    cta_link: str = "#projects"
    emphasis_skills: list[str] = Field(default_factory=list)
    project_order: list[str] = Field(default_factory=list)


# Pre-generated variants (no LLM call needed)
HERO_VARIANTS: Dict[str, HeroVariant] = {
    "senior_engineer": HeroVariant(
        persona="senior_engineer",
        headline="Systems that scale. Code that's built to last.",
        subtext=(
            "AI architect building autonomous intelligence platforms — "
            "from distributed inference to self-healing knowledge systems."
        ),
        cta_text="Explore my architecture →",
        cta_link="#projects",
        emphasis_skills=["System Design", "Distributed Systems", "AI/ML Infrastructure"],
        project_order=["antigravity-os", "autoresearch", "portfolio-website"],
    ),
    "technical_recruiter": HeroVariant(
        persona="technical_recruiter",
        headline="The engineer your team is looking for.",
        subtext=(
            "Senior AI architect with production experience across "
            "full-stack, ML systems, and platform engineering. "
            "Open to compelling opportunities."
        ),
        cta_text="See my impact →",
        cta_link="#experience",
        emphasis_skills=["Full-Stack", "AI/ML", "Team Leadership"],
        project_order=["portfolio-website", "antigravity-os", "autoresearch"],
    ),
    "startup_founder": HeroVariant(
        persona="startup_founder",
        headline="From zero to production. Fast.",
        subtext=(
            "Full-stack engineer who ships end-to-end, owns the product, "
            "and builds systems that don't need a team of 10 to maintain."
        ),
        cta_text="See what I've shipped →",
        cta_link="#projects",
        emphasis_skills=["Rapid Prototyping", "Full-Stack", "Product Engineering"],
        project_order=["antigravity-os", "portfolio-website", "autoresearch"],
    ),
    "ml_researcher": HeroVariant(
        persona="ml_researcher",
        headline="AI that works in the real world.",
        subtext=(
            "ML engineer who builds pipelines that don't just demo well — "
            "they run in production with real users and real data."
        ),
        cta_text="See my ML work →",
        cta_link="#projects",
        emphasis_skills=["ML Systems", "RAG Architecture", "LLM Orchestration"],
        project_order=["autoresearch", "antigravity-os", "portfolio-website"],
    ),
    "student_learner": HeroVariant(
        persona="student_learner",
        headline="Building the future of intelligent systems.",
        subtext=(
            "Explore how modern AI portfolios work — from RAG pipelines "
            "to multi-agent architectures. Ask me anything about the stack."
        ),
        cta_text="Start exploring →",
        cta_link="#chat",
        emphasis_skills=["Learning Path", "Open Source", "AI Engineering"],
    ),
    "casual": HeroVariant(
        persona="casual",
        headline="Aman Bhaskar — Senior AI Architect",
        subtext=(
            "Architecting cognitive platforms that bridge the gap between "
            "human intent and autonomous execution."
        ),
        cta_text="Learn more →",
        cta_link="#about",
        emphasis_skills=["AI Systems", "Full-Stack", "System Design"],
    ),
}


# ═══════════════════════════════════════════════════════════
# LANDING PAGE AGENT
# ═══════════════════════════════════════════════════════════

class DynamicLandingPageAgent:
    """
    Returns the appropriate hero variant for a visitor persona.
    SEO-safe: Google gets the 'casual' variant.
    """

    def get_variant(self, persona: str = "casual") -> HeroVariant:
        """Get hero variant for a persona. Falls back to casual."""
        variant = HERO_VARIANTS.get(persona)
        if not variant:
            variant = HERO_VARIANTS["casual"]
        return variant

    def get_all_variants(self) -> Dict[str, HeroVariant]:
        """Get all variants (for pre-rendering/caching)."""
        return HERO_VARIANTS.copy()

    def get_seo_variant(self) -> HeroVariant:
        """Get SEO-safe variant for crawlers."""
        return HERO_VARIANTS["casual"]

    def to_api_response(self, persona: str = "casual") -> dict:
        """Format as API response for the frontend."""
        variant = self.get_variant(persona)
        return {
            "persona": variant.persona,
            "hero": {
                "headline": variant.headline,
                "subtext": variant.subtext,
                "cta_text": variant.cta_text,
                "cta_link": variant.cta_link,
            },
            "emphasis_skills": variant.emphasis_skills,
            "project_order": variant.project_order,
        }


# Singleton
landing_page_agent = DynamicLandingPageAgent()

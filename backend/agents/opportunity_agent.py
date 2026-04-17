"""
═══════════════════════════════════════════════════════════
Opportunity Discovery Agent — ANTIGRAVITY OS v2 (§27.5)
═══════════════════════════════════════════════════════════

Fully autonomous background agent.
Finds opportunities matching owner's profile.

Data sources: HN "Who is hiring?" (free, scraped)
Matching: role type, stack preferences, location

AUTONOMY:
  DISCOVER: Fully autonomous — runs daily
  FILTER:   Fully autonomous — applies match criteria
  RANK:     Fully autonomous — scores by fit quality
  ALERT:    Owner notification
  APPLY:    NEVER autonomous — always owner decision

PRIVACY: Runs server-side, never visible to portfolio visitors.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.agents.opportunity")


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class Opportunity(BaseModel):
    """A discovered job opportunity."""
    title: str
    company: str
    description: str = ""
    url: str = ""
    source: str = ""
    location: str = ""
    remote: bool = False
    tech_stack: List[str] = Field(default_factory=list)
    match_score: float = 0.0
    match_reasons: List[str] = Field(default_factory=list)
    discovered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MatchCriteria(BaseModel):
    """Owner's job preferences."""
    preferred_roles: List[str] = Field(default_factory=lambda: [
        "AI Engineer", "ML Engineer", "Backend Engineer",
        "Full-Stack Engineer", "Platform Engineer",
        "Senior Software Engineer", "Staff Engineer",
    ])
    preferred_stack: List[str] = Field(default_factory=lambda: [
        "python", "typescript", "react", "fastapi",
        "postgresql", "redis", "docker", "kubernetes",
        "pytorch", "langchain", "ollama",
    ])
    preferred_locations: List[str] = Field(default_factory=lambda: [
        "remote", "bangalore", "india", "hybrid",
    ])
    min_match_score: float = 0.4  # Only surface opportunities above this


class OpportunityReport(BaseModel):
    """Daily opportunity scan report."""
    opportunities: List[Opportunity] = Field(default_factory=list)
    total_scanned: int = 0
    total_matched: int = 0
    scan_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ═══════════════════════════════════════════════════════════
# OPPORTUNITY AGENT
# ═══════════════════════════════════════════════════════════

class OpportunityDiscoveryAgent:
    """
    Autonomous job discovery agent.
    """

    def __init__(self):
        self._criteria = MatchCriteria()
        self._cached_opportunities: List[Opportunity] = []

    def update_criteria(self, criteria: MatchCriteria):
        """Update match criteria (from /data/owner/availability.md)."""
        self._criteria = criteria

    async def scan(self) -> OpportunityReport:
        """
        Run the full opportunity scan.
        In production, this connects to HN API.
        For now, provides the matching engine.
        """
        # In production: fetch from HN, job boards, etc.
        # For now: return matching logic against manually provided data
        raw_opportunities = await self._fetch_hn_hiring()
        matched = []

        for opp in raw_opportunities:
            score, reasons = self._compute_match(opp)
            if score >= self._criteria.min_match_score:
                opp.match_score = round(score, 2)
                opp.match_reasons = reasons
                matched.append(opp)

        # Sort by match score
        matched.sort(key=lambda o: o.match_score, reverse=True)
        self._cached_opportunities = matched

        logger.info(
            f"Opportunity scan complete: {len(raw_opportunities)} scanned, "
            f"{len(matched)} matched (min_score={self._criteria.min_match_score})"
        )

        return OpportunityReport(
            opportunities=matched[:20],  # Top 20
            total_scanned=len(raw_opportunities),
            total_matched=len(matched),
        )

    def _compute_match(self, opp: Opportunity) -> tuple[float, List[str]]:
        """Score an opportunity against match criteria."""
        score = 0.0
        reasons = []
        desc_lower = (opp.description + " " + opp.title).lower()

        # Role match
        for role in self._criteria.preferred_roles:
            if role.lower() in desc_lower:
                score += 0.3
                reasons.append(f"role_match:{role}")
                break

        # Tech stack match
        tech_matches = 0
        for tech in self._criteria.preferred_stack:
            if tech.lower() in desc_lower:
                tech_matches += 1
        if tech_matches > 0:
            tech_score = min(0.4, tech_matches * 0.08)
            score += tech_score
            reasons.append(f"tech_match:{tech_matches}_technologies")

        # Location match
        for loc in self._criteria.preferred_locations:
            if loc.lower() in desc_lower or loc.lower() in opp.location.lower():
                score += 0.2
                reasons.append(f"location_match:{loc}")
                break

        # Remote bonus
        if opp.remote or "remote" in desc_lower:
            score += 0.1
            reasons.append("remote_friendly")

        return min(1.0, score), reasons

    async def _fetch_hn_hiring(self) -> List[Opportunity]:
        """
        Fetch from HN "Who is hiring?" thread.
        Uses the Algolia HN API (free, no key).
        """
        try:
            import httpx

            async with httpx.AsyncClient(timeout=15.0) as client:
                # Search for the latest "Who is hiring?" post
                resp = await client.get(
                    "https://hn.algolia.com/api/v1/search",
                    params={
                        "query": "Ask HN: Who is hiring?",
                        "tags": "ask_hn",
                        "hitsPerPage": 1,
                    },
                )

                if resp.status_code != 200:
                    return []

                data = resp.json()
                hits = data.get("hits", [])
                if not hits:
                    return []

                # Get comments (job listings) from the post
                post_id = hits[0].get("objectID")
                if not post_id:
                    return []

                comments_resp = await client.get(
                    f"https://hn.algolia.com/api/v1/items/{post_id}"
                )

                if comments_resp.status_code != 200:
                    return []

                post_data = comments_resp.json()
                children = post_data.get("children", [])

                opportunities = []
                for child in children[:100]:  # Process top 100 comments
                    text = child.get("text", "")
                    if not text or len(text) < 50:
                        continue

                    # Extract company name (usually first line or bolded)
                    company = self._extract_company(text)
                    title = self._extract_title(text)

                    opportunities.append(Opportunity(
                        title=title,
                        company=company,
                        description=text[:500],
                        url=f"https://news.ycombinator.com/item?id={child.get('id', '')}",
                        source="hn_who_is_hiring",
                        remote="remote" in text.lower(),
                    ))

                return opportunities

        except Exception as e:
            logger.error(f"HN hiring scan failed: {e}")
            return []

    def _extract_company(self, text: str) -> str:
        """Extract company name from HN hiring comment."""
        # Usually first line: "Company Name | Location | ..."
        first_line = text.split("\n")[0].strip()
        parts = re.split(r'[|–—]', first_line)
        if parts:
            company = re.sub(r'<[^>]+>', '', parts[0]).strip()
            return company[:100] if company else "Unknown"
        return "Unknown"

    def _extract_title(self, text: str) -> str:
        """Extract a job title from text."""
        title_patterns = [
            r"(senior|staff|principal|lead)?\s*(software|backend|frontend|full[- ]?stack|ml|ai|data)\s*(engineer|developer|architect)",
        ]
        for pattern in title_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0).strip().title()
        return "Software Engineer"

    def get_cached_opportunities(self) -> List[Opportunity]:
        """Get cached results from last scan."""
        return self._cached_opportunities


# Singleton
opportunity_agent = OpportunityDiscoveryAgent()

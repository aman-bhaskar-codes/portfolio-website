"""
═══════════════════════════════════════════════════════════
Visitor Profile Memory (§4.2)
═══════════════════════════════════════════════════════════

Cross-session visitor memory. The digital twin remembers
conversations — not just within a session, but ACROSS sessions.

Stores:
  - What we've discussed (topics, projects shown)
  - What interested them (follow-ups, GitHub clicks)
  - Relationship state (new → returning → warm → hot)
  - Conversion signals (availability inquiry, contact request)
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional

from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.intelligence.visitor_classifier import VisitorPersona

logger = logging.getLogger("portfolio.memory.visitor")


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class VisitorMemory(BaseModel):
    """Full cross-session memory for a visitor."""
    visitor_id: str
    persona: VisitorPersona = VisitorPersona.CASUAL
    company: Optional[str] = None

    # What we've discussed
    topics_covered: List[str] = Field(default_factory=list)
    projects_shown: List[str] = Field(default_factory=list)
    questions_asked: List[str] = Field(default_factory=list)

    # What interested them
    high_engagement_topics: List[str] = Field(default_factory=list)
    clicked_repos: List[str] = Field(default_factory=list)

    # Relationship state
    visit_count: int = 1
    relationship_tier: str = "new"  # new | returning | warm | hot
    first_visit: Optional[datetime] = None
    last_visit: Optional[datetime] = None

    # Conversion signals
    asked_availability: bool = False
    asked_contact: bool = False
    downloaded_brief: bool = False


# ═══════════════════════════════════════════════════════════
# VISITOR PROFILE STORE
# ═══════════════════════════════════════════════════════════

class VisitorProfileStore:
    """PostgreSQL-backed visitor profile persistence."""

    def __init__(self, session: AsyncSession):
        self.db = session

    async def get_or_create(self, visitor_id: str) -> VisitorMemory:
        """Get existing profile or create a new one."""
        result = await self.db.execute(
            text("""
                SELECT visitor_id, persona, company, topics_covered, projects_shown,
                       questions_asked, high_engagement_topics, clicked_repos,
                       visit_count, relationship_tier, asked_availability,
                       asked_contact, downloaded_brief, first_visit, last_visit
                FROM visitor_profiles WHERE visitor_id = :vid
            """),
            {"vid": visitor_id},
        )
        row = result.fetchone()

        if row:
            return VisitorMemory(
                visitor_id=row[0],
                persona=VisitorPersona(row[1]) if row[1] else VisitorPersona.CASUAL,
                company=row[2],
                topics_covered=json.loads(row[3]) if row[3] else [],
                projects_shown=json.loads(row[4]) if row[4] else [],
                questions_asked=json.loads(row[5]) if row[5] else [],
                high_engagement_topics=json.loads(row[6]) if row[6] else [],
                clicked_repos=json.loads(row[7]) if row[7] else [],
                visit_count=row[8] or 1,
                relationship_tier=row[9] or "new",
                asked_availability=row[10] or False,
                asked_contact=row[11] or False,
                downloaded_brief=row[12] or False,
                first_visit=row[13],
                last_visit=row[14],
            )

        # Create new profile
        now = datetime.now(timezone.utc)
        await self.db.execute(
            text("""
                INSERT INTO visitor_profiles (visitor_id, first_visit, last_visit)
                VALUES (:vid, :now, :now)
                ON CONFLICT (visitor_id) DO NOTHING
            """),
            {"vid": visitor_id, "now": now},
        )
        await self.db.commit()

        return VisitorMemory(visitor_id=visitor_id, first_visit=now, last_visit=now)

    async def update(self, memory: VisitorMemory):
        """Persist updated visitor memory."""
        now = datetime.now(timezone.utc)
        
        # Compute relationship tier
        tier = self._compute_tier(memory)

        await self.db.execute(
            text("""
                UPDATE visitor_profiles SET
                    persona = :persona,
                    company = :company,
                    topics_covered = :topics::jsonb,
                    projects_shown = :projects::jsonb,
                    questions_asked = :questions::jsonb,
                    high_engagement_topics = :engagement::jsonb,
                    clicked_repos = :repos::jsonb,
                    visit_count = :visit_count,
                    relationship_tier = :tier,
                    asked_availability = :avail,
                    asked_contact = :contact,
                    downloaded_brief = :brief,
                    last_visit = :now
                WHERE visitor_id = :vid
            """),
            {
                "vid": memory.visitor_id,
                "persona": memory.persona.value,
                "company": memory.company,
                "topics": json.dumps(memory.topics_covered[-50:]),  # Keep last 50
                "projects": json.dumps(memory.projects_shown[-20:]),
                "questions": json.dumps(memory.questions_asked[-30:]),
                "engagement": json.dumps(memory.high_engagement_topics[-20:]),
                "repos": json.dumps(memory.clicked_repos[-20:]),
                "visit_count": memory.visit_count,
                "tier": tier,
                "avail": memory.asked_availability,
                "contact": memory.asked_contact,
                "brief": memory.downloaded_brief,
                "now": now,
            },
        )
        await self.db.commit()

    async def record_visit(self, visitor_id: str):
        """Increment visit count and update last_visit."""
        await self.db.execute(
            text("""
                UPDATE visitor_profiles 
                SET visit_count = visit_count + 1, last_visit = :now
                WHERE visitor_id = :vid
            """),
            {"vid": visitor_id, "now": datetime.now(timezone.utc)},
        )
        await self.db.commit()

    def _compute_tier(self, memory: VisitorMemory) -> str:
        """Compute relationship tier from signals."""
        if memory.asked_contact or memory.downloaded_brief:
            return "hot"
        if memory.asked_availability or memory.visit_count >= 3:
            return "warm"
        if memory.visit_count >= 2:
            return "returning"
        return "new"


# ═══════════════════════════════════════════════════════════
# GREETING GENERATOR
# ═══════════════════════════════════════════════════════════

def personalize_greeting(memory: VisitorMemory) -> str:
    """Generate a personalized greeting based on visitor history."""
    if memory.visit_count <= 1:
        return ""  # First visit — no personalization needed

    parts = [f"Welcome back!"]

    if memory.topics_covered:
        last_topic = memory.topics_covered[-1]
        parts.append(f"Last time we talked about {last_topic}")

    if memory.high_engagement_topics:
        topic = memory.high_engagement_topics[-1]
        parts.append(f"— you were particularly interested in {topic}.")
    else:
        parts.append("— anything new you'd like to explore?")

    return " ".join(parts)

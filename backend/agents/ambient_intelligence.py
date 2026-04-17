"""
═══════════════════════════════════════════════════════════
Ambient Intelligence Agent (§6)
═══════════════════════════════════════════════════════════

Watches visitor behavior in real-time and surfaces proactive
suggestions WITHOUT being asked. Max 1 per session.

Triggers:
  - Company recognized → relevant project match
  - Deep project engagement (>45s hover)
  - Code reading pattern (3+ GitHub links)
  - Return visitor recognition
  - Time context (late night = deep mode)
"""

from __future__ import annotations

import logging
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field

from backend.intelligence.visitor_classifier import VisitorPersona, VisitorSignal
from backend.intelligence.company_resolver import CompanyProfile

logger = logging.getLogger("portfolio.agents.ambient")


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class TriggerType(str, Enum):
    COMPANY_RECOGNIZED = "company_recognized"
    DEEP_PROJECT_ENGAGEMENT = "deep_project_engagement"
    CODE_READING_PATTERN = "code_reading_pattern"
    CONVERSATION_RESUMPTION = "conversation_resumption"
    TIME_CONTEXT = "time_context"
    RETURN_VISITOR = "return_visitor"
    INTENT_BRIDGE = "intent_bridge"


class AmbientSuggestion(BaseModel):
    """A proactive suggestion to surface to the visitor."""
    trigger: TriggerType
    title: str
    message: str
    cta_text: str
    cta_action: str  # "open_chat", "open_walkthrough", "download_brief"
    confidence: float = Field(ge=0.0, le=1.0)
    icon: str = "💡"
    auto_dismiss_seconds: int = 8


class VisitorContext(BaseModel):
    """Real-time visitor context for ambient evaluation."""
    visitor_id: str = ""
    persona: VisitorPersona = VisitorPersona.CASUAL
    company: Optional[CompanyProfile] = None
    visit_count: int = 1
    time_of_day: int = 12
    is_weekday: bool = True
    projects_viewed: List[str] = Field(default_factory=list)
    project_hover_seconds: float = 0.0
    github_links_opened: int = 0
    chat_messages_sent: int = 0
    seconds_on_page: float = 0.0
    ambient_shown_this_session: bool = False


# ═══════════════════════════════════════════════════════════
# ENGINE
# ═══════════════════════════════════════════════════════════

class AmbientIntelligenceAgent:
    """
    Evaluates visitor context and generates proactive suggestions.
    Rules:
      - Max 1 suggestion per session
      - Only fire when confidence > 0.75
      - Never interrupt mid-conversation
    """

    CONFIDENCE_THRESHOLD = 0.75

    async def evaluate(
        self, context: VisitorContext
    ) -> Optional[AmbientSuggestion]:
        """
        Evaluate all triggers against current context.
        Returns the highest-confidence suggestion, or None.
        """
        if context.ambient_shown_this_session:
            return None
        if context.chat_messages_sent > 0:
            return None  # Don't interrupt active conversations

        candidates: List[AmbientSuggestion] = []

        # ── Trigger 1: Company Recognized ──
        if context.company and context.company.name != "unknown":
            suggestion = self._company_trigger(context)
            if suggestion:
                candidates.append(suggestion)

        # ── Trigger 2: Deep Project Engagement ──
        if context.project_hover_seconds > 45:
            suggestion = self._engagement_trigger(context)
            if suggestion:
                candidates.append(suggestion)

        # ── Trigger 3: Code Reading Pattern ──
        if context.github_links_opened >= 3:
            candidates.append(AmbientSuggestion(
                trigger=TriggerType.CODE_READING_PATTERN,
                title="Deep diving the code?",
                message=(
                    "You're clearly reading the source — want a live "
                    "architecture walkthrough with the actual code?"
                ),
                cta_text="Open walkthrough →",
                cta_action="open_walkthrough",
                confidence=0.85,
                icon="📂",
            ))

        # ── Trigger 4: Return Visitor ──
        if context.visit_count > 1:
            candidates.append(AmbientSuggestion(
                trigger=TriggerType.RETURN_VISITOR,
                title="Welcome back!",
                message=(
                    "Good to see you again. I've been working on some new projects "
                    "since your last visit — want to catch up?"
                ),
                cta_text="What's new →",
                cta_action="open_chat",
                confidence=0.80,
                icon="👋",
            ))

        # ── Trigger 5: Time Context ──
        if context.time_of_day >= 22 or context.time_of_day <= 5:
            candidates.append(AmbientSuggestion(
                trigger=TriggerType.TIME_CONTEXT,
                title="Late night session?",
                message="Happy to go deep on any project or system design topic.",
                cta_text="Let's talk architecture →",
                cta_action="open_chat",
                confidence=0.70,
                icon="🌙",
            ))

        # ── Trigger 6: Recruiter with no chat ──
        if (context.persona == VisitorPersona.TECHNICAL_RECRUITER
                and context.seconds_on_page > 30
                and context.chat_messages_sent == 0):
            candidates.append(AmbientSuggestion(
                trigger=TriggerType.INTENT_BRIDGE,
                title="Looking for a candidate?",
                message=(
                    "I can generate a personalized recruiter brief with "
                    "key skills, projects, and availability — one click."
                ),
                cta_text="Generate brief →",
                cta_action="download_brief",
                confidence=0.82,
                icon="📋",
            ))

        # Pick highest confidence above threshold
        candidates = [c for c in candidates if c.confidence >= self.CONFIDENCE_THRESHOLD]
        if not candidates:
            return None

        best = max(candidates, key=lambda s: s.confidence)
        logger.info(
            f"Ambient suggestion fired: trigger={best.trigger.value}, "
            f"confidence={best.confidence:.2f}"
        )
        return best

    # ═══════════════════════════════════════════════════════
    # TRIGGER BUILDERS
    # ═══════════════════════════════════════════════════════

    def _company_trigger(self, ctx: VisitorContext) -> Optional[AmbientSuggestion]:
        """Build company-recognized suggestion."""
        if not ctx.company:
            return None

        company_name = ctx.company.name
        tech_overlap = []

        # Check tech stack overlap
        owner_stack = {"Python", "FastAPI", "LangGraph", "PostgreSQL", "Redis", 
                       "Next.js", "TypeScript", "Docker", "Kubernetes"}
        company_stack = set(ctx.company.tech_stack)
        overlap = list(owner_stack & company_stack)

        if overlap:
            tech_str = ", ".join(overlap[:3])
            return AmbientSuggestion(
                trigger=TriggerType.COMPANY_RECOGNIZED,
                title=f"Looks like you're from {company_name}",
                message=(
                    f"I have deep experience with {tech_str} — "
                    f"exactly the stack you use. Want to see the relevant work?"
                ),
                cta_text="Start conversation →",
                cta_action="open_chat",
                confidence=0.90,
                icon="💡",
            )
        else:
            return AmbientSuggestion(
                trigger=TriggerType.COMPANY_RECOGNIZED,
                title=f"Welcome from {company_name}!",
                message="I'd love to show you the projects most relevant to your team.",
                cta_text="Start conversation →",
                cta_action="open_chat",
                confidence=0.78,
                icon="💡",
            )

    def _engagement_trigger(self, ctx: VisitorContext) -> Optional[AmbientSuggestion]:
        """Build deep-engagement suggestion."""
        project = ctx.projects_viewed[-1] if ctx.projects_viewed else "that project"
        return AmbientSuggestion(
            trigger=TriggerType.DEEP_PROJECT_ENGAGEMENT,
            title=f"Interested in {project}?",
            message="Want me to do a live code walkthrough of the architecture?",
            cta_text="Open walkthrough →",
            cta_action="open_walkthrough",
            confidence=0.83,
            icon="🔍",
        )

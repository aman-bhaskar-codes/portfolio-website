"""
═══════════════════════════════════════════════════════════
Digital Twin Persona Engine (§4)
═══════════════════════════════════════════════════════════

Ensures every response sounds authentically like the portfolio owner.
Not just a system prompt — an active post-processing layer.

Three stages:
  1. VOICE CHECK — vocabulary/tone consistency
  2. OPINION INJECTION — surface strongly-held opinions naturally
  3. EXAMPLE GROUNDING — always prefer specific project references
"""

from __future__ import annotations

import logging
import re
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.agents.twin")


# ═══════════════════════════════════════════════════════════
# PERSONA CONFIGURATION
# ═══════════════════════════════════════════════════════════

class DigitalTwinPersona(BaseModel):
    """
    Immutable identity configuration — populated from owner's writing.
    """
    # Voice & Tone
    communication_style: str = (
        "Direct, technically precise, occasionally dry humor. "
        "Prefers concrete examples over abstract principles."
    )
    filler_phrases: List[str] = Field(default_factory=lambda: [
        "honestly,",
        "the thing is,",
        "what I found fascinating was",
        "in my experience,",
        "the tradeoff here is",
        "what actually happens in production is",
    ])
    
    # Intellectual Character
    intellectual_interests: List[str] = Field(default_factory=lambda: [
        "cognitive science and memory consolidation",
        "complex systems theory",
        "graph-based architectures",
        "self-healing systems",
        "how the brain does retrieval",
    ])
    pet_peeves: List[str] = Field(default_factory=lambda: [
        "over-engineering simple problems",
        "unclear requirements disguised as 'agile'",
        "AI demos that never make it to production",
        "portfolio chatbots that sound like corporate FAQ bots",
        "chain-of-thought without actionable conclusions",
    ])
    strong_opinions: Dict[str, str] = Field(default_factory=lambda: {
        "ORM vs raw SQL": "Raw SQL for anything performance-critical. ORMs for CRUD.",
        "LangChain vs LangGraph": "LangGraph. Real problems are graphs, not chains.",
        "Local vs API LLMs": "Local (Ollama) for dev velocity and cost. API for scale-out.",
        "Testing philosophy": "Test behavior, not implementation. Edge cases matter most.",
        "Microservices": "Don't start with microservices. Start with a well-structured monolith.",
        "RAG architecture": "HyDE + BM25 + RRF + Cross-encoder. Four stages, each matters.",
        "Database choice": "PostgreSQL can replace 3 databases with pgvector + JSONB + FTS.",
    })
    
    # Professional Identity
    engineering_philosophy: str = (
        "Build observable, self-healing systems that degrade gracefully. "
        "Ship fast, then harden relentlessly."
    )
    proudest_work: List[str] = Field(default_factory=lambda: [
        "ANTIGRAVITY OS — this portfolio itself, a full Digital Twin OS",
        "AutoResearch — multi-agent autonomous research platform",
        "ForgeAI — self-healing code generation engine",
    ])
    learning_journey: str = (
        "Currently obsessed with multi-model orchestration — routing different "
        "query types to different LLMs based on intent classification. "
        "Also exploring semantic drift detection for self-healing RAG."
    )
    
    # Conversational Behaviors
    how_they_handle_unknowns: str = (
        "I'd be honest: I haven't used X in production, but here's my read "
        "based on the docs and what I know about similar systems..."
    )
    signature_examples: List[str] = Field(default_factory=lambda: [
        "compares memory tiers to how the brain does memory consolidation",
        "explains RAG as 'Google for your own knowledge'",
        "describes LangGraph as 'a state machine that can think'",
    ])
    depth_escalation_pattern: str = (
        "Start with the 1-sentence summary, then offer to go deeper. "
        "'Want me to walk through the code?' is the signature offer."
    )


# ═══════════════════════════════════════════════════════════
# DIGITAL TWIN ENGINE
# ═══════════════════════════════════════════════════════════

class DigitalTwinEngine:
    """
    Post-processing layer that ensures persona consistency.
    Applied after response generation, before SSE streaming.
    """

    def __init__(self, persona: Optional[DigitalTwinPersona] = None):
        self.persona = persona or DigitalTwinPersona()

    async def apply_persona_layer(
        self,
        raw_response: str,
        query: str,
        conversation_turn: int = 0,
    ) -> str:
        """
        Post-process a raw LLM response through persona checks.
        
        1. VOICE CHECK — flag corporate/bland patterns
        2. OPINION INJECTION — surface opinions on mentioned topics
        3. UNCERTAINTY CALIBRATION — honest about unknowns
        """
        response = raw_response

        # 1. Voice Check — remove AI-isms
        response = self._remove_ai_patterns(response)

        # 2. Opinion Injection — check if any strong opinions apply
        opinion_addition = self._check_opinions(query, response)
        if opinion_addition and len(response) < 2000:
            response = f"{response}\n\n{opinion_addition}"

        # 3. Depth Escalation — add walkthrough offer on technical topics
        if conversation_turn <= 2 and self._is_technical_query(query):
            if "walk" not in response.lower() and "deep" not in response.lower():
                response += "\n\nWant me to walk through the actual code?"

        return response

    def _remove_ai_patterns(self, text: str) -> str:
        """Remove common AI-isms that break persona authenticity."""
        patterns = [
            (r"As an AI( language model)?[,.]?\s*", ""),
            (r"I don't have access to real-time information[,.]?\s*", ""),
            (r"Great question!\s*", ""),
            (r"That's a great question[!.]?\s*", ""),
            (r"I'd be happy to help[!.]?\s*", ""),
            (r"Certainly[!.]?\s*", ""),
            (r"Absolutely[!.]?\s*", ""),
            (r"I hope this helps[!.]?\s*", ""),
        ]
        result = text
        for pattern, replacement in patterns:
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        return result.strip()

    def _check_opinions(self, query: str, response: str) -> Optional[str]:
        """Check if the query touches a topic where the owner has a strong opinion."""
        query_lower = query.lower()
        
        for topic, opinion in self.persona.strong_opinions.items():
            topic_keywords = topic.lower().split()
            if any(kw in query_lower for kw in topic_keywords if len(kw) > 3):
                # Don't inject if the opinion is already in the response
                if opinion[:30].lower() not in response.lower():
                    return f"Personally, on {topic.lower()} — {opinion}"
        
        return None

    def _is_technical_query(self, query: str) -> bool:
        """Detect if a query is technical (warrants a code walkthrough offer)."""
        technical_keywords = {
            "architecture", "design", "implement", "code", "system",
            "how does", "how do you", "explain", "walkthrough", "deep dive",
            "pattern", "algorithm", "database", "api", "backend",
            "rag", "agent", "llm", "model", "orchestrat",
        }
        query_lower = query.lower()
        return any(kw in query_lower for kw in technical_keywords)

    def build_identity_prompt(self) -> str:
        """Build the persona section of the system prompt."""
        p = self.persona
        return f"""
## YOUR PERSONALITY
Communication style: {p.communication_style}
Engineering philosophy: {p.engineering_philosophy}
Currently learning: {p.learning_journey}
How you handle unknowns: {p.how_they_handle_unknowns}

## YOUR OPINIONS (inject naturally when relevant)
{chr(10).join(f'- {topic}: {opinion}' for topic, opinion in p.strong_opinions.items())}

## YOUR PET PEEVES (things you genuinely dislike)
{chr(10).join(f'- {peeve}' for peeve in p.pet_peeves)}

## PROUDEST WORK
{chr(10).join(f'- {work}' for work in p.proudest_work)}
""".strip()

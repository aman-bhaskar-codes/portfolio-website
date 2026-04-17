"""
═══════════════════════════════════════════════════════════
Multi-Agent Debate Mode — ANTIGRAVITY OS v2 (§27.4)
═══════════════════════════════════════════════════════════

Two AI instances debate a technical tradeoff — Aman moderates.

Agent "Architect" (pro-A):  Uses phi4-mini
Agent "Pragmatist" (pro-B): Uses llama3.2:3b
Agent "Aman" (synthesis):   Uses phi4-mini

ACTIVATION:
  - Visitor types "debate this"
  - Auto-detect tradeoff query (X vs Y, should I use, compare)
"""

from __future__ import annotations

import logging
import re
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.agents.debate")


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class DebatePosition(BaseModel):
    """One agent's position in the debate."""
    agent_name: str
    position: str
    model_used: str
    key_points: List[str] = Field(default_factory=list)


class DebateResult(BaseModel):
    """Full debate with synthesis."""
    topic: str
    option_a: str
    option_b: str
    architect: DebatePosition
    pragmatist: DebatePosition
    synthesis: DebatePosition
    is_debate: bool = True


# ═══════════════════════════════════════════════════════════
# TRADEOFF DETECTION
# ═══════════════════════════════════════════════════════════

TRADEOFF_PATTERNS = [
    re.compile(r"(\w+)\s+vs\.?\s+(\w+)", re.IGNORECASE),
    re.compile(r"(\w+)\s+versus\s+(\w+)", re.IGNORECASE),
    re.compile(r"(\w+)\s+or\s+(\w+)\s+(for|in|when|if)", re.IGNORECASE),
    re.compile(r"should\s+I\s+use\s+(\w+)\s+or\s+(\w+)", re.IGNORECASE),
    re.compile(r"compare\s+(\w+)\s+(?:and|with|to)\s+(\w+)", re.IGNORECASE),
    re.compile(r"(\w+)\s+over\s+(\w+)", re.IGNORECASE),
    re.compile(r"pros\s+and\s+cons\s+of\s+(\w+)", re.IGNORECASE),
    re.compile(r"tradeoffs?\s+(?:of|between|for)\s+(\w+)", re.IGNORECASE),
]


def detect_tradeoff(query: str) -> Optional[tuple[str, str]]:
    """
    Detect if a query is a tradeoff question.
    Returns (option_a, option_b) or None.
    """
    for pattern in TRADEOFF_PATTERNS:
        match = pattern.search(query)
        if match:
            groups = match.groups()
            if len(groups) >= 2:
                return (groups[0], groups[1])
            elif len(groups) == 1:
                return (groups[0], "alternatives")
    return None


def should_activate_debate(query: str) -> bool:
    """Check if debate mode should activate."""
    lower = query.lower().strip()

    # Explicit activation
    if "debate this" in lower or "debate mode" in lower:
        return True

    # Implicit: tradeoff detected
    return detect_tradeoff(query) is not None


# ═══════════════════════════════════════════════════════════
# DEBATE AGENT
# ═══════════════════════════════════════════════════════════

class MultiAgentDebateMode:
    """
    Orchestrates a 3-agent debate on technical tradeoffs.
    Each agent uses a different Ollama model for diverse perspectives.
    """

    def build_architect_prompt(
        self, topic: str, option_a: str, option_b: str
    ) -> str:
        """Build prompt for the Architect agent (pro-option-A)."""
        return f"""You are "The Architect" — a senior systems engineer who favors {option_a} 
for the problem of: {topic}

You must argue FOR {option_a} and AGAINST {option_b}.
Be specific. Use real-world examples and technical reasoning.
Acknowledge one genuine weakness of your position.

Keep your argument under 200 words. Be direct and opinionated.

Write as if you are Aman Bhaskar making the case for {option_a} based on your experience."""

    def build_pragmatist_prompt(
        self, topic: str, option_a: str, option_b: str
    ) -> str:
        """Build prompt for the Pragmatist agent (pro-option-B)."""
        return f"""You are "The Pragmatist" — a practical engineer who favors {option_b}
for the problem of: {topic}

You must argue FOR {option_b} and AGAINST {option_a}.
Focus on practical concerns: operational complexity, team familiarity, 
time to ship, real-world reliability.
Acknowledge one genuine weakness of your position.

Keep your argument under 200 words. Be direct and opinionated.

Write as if you are Aman Bhaskar making the practical case for {option_b}."""

    def build_synthesis_prompt(
        self,
        topic: str,
        option_a: str,
        option_b: str,
        architect_argument: str,
        pragmatist_argument: str,
    ) -> str:
        """Build prompt for the Aman synthesis agent."""
        return f"""You are Aman Bhaskar, moderating a debate between two perspectives on: {topic}

The Architect argued for {option_a}:
{architect_argument}

The Pragmatist argued for {option_b}:
{pragmatist_argument}

Now synthesize:
1. Who is RIGHT and under what conditions?
2. What's the decision tree? (When to pick A vs B)
3. What would YOU actually choose for most real-world cases and why?

Be honest and opinionated. Under 200 words."""

    async def run_debate(
        self,
        query: str,
        ollama_generate_fn,
    ) -> DebateResult:
        """
        Run the full 3-agent debate.

        Args:
            query: The original visitor question
            ollama_generate_fn: async fn(model, prompt) → str
        """
        # Detect options
        tradeoff = detect_tradeoff(query)
        if tradeoff:
            option_a, option_b = tradeoff
        else:
            # Fallback: use the query as topic with generic options
            option_a, option_b = "Option A", "Option B"

        topic = query

        # Agent 1: Architect (phi4-mini — strongest reasoning)
        architect_prompt = self.build_architect_prompt(topic, option_a, option_b)
        try:
            architect_response = await ollama_generate_fn("phi4-mini", architect_prompt)
        except Exception as e:
            logger.error(f"Architect agent failed: {e}")
            architect_response = f"I'd lean toward {option_a} for its technical merits, but let me hear the other side."

        # Agent 2: Pragmatist (llama3.2:3b — different perspective)
        pragmatist_prompt = self.build_pragmatist_prompt(topic, option_a, option_b)
        try:
            pragmatist_response = await ollama_generate_fn("llama3.2:3b", pragmatist_prompt)
        except Exception as e:
            logger.error(f"Pragmatist agent failed: {e}")
            pragmatist_response = f"Practically speaking, {option_b} often wins on simplicity and operational overhead."

        # Agent 3: Aman synthesis (phi4-mini)
        synthesis_prompt = self.build_synthesis_prompt(
            topic, option_a, option_b,
            architect_response, pragmatist_response,
        )
        try:
            synthesis_response = await ollama_generate_fn("phi4-mini", synthesis_prompt)
        except Exception as e:
            logger.error(f"Synthesis agent failed: {e}")
            synthesis_response = f"Both have merit. For most cases, I'd pick based on your team's expertise and scale requirements."

        return DebateResult(
            topic=topic,
            option_a=option_a,
            option_b=option_b,
            architect=DebatePosition(
                agent_name="The Architect",
                position=architect_response,
                model_used="phi4-mini",
                key_points=self._extract_key_points(architect_response),
            ),
            pragmatist=DebatePosition(
                agent_name="The Pragmatist",
                position=pragmatist_response,
                model_used="llama3.2:3b",
                key_points=self._extract_key_points(pragmatist_response),
            ),
            synthesis=DebatePosition(
                agent_name="Aman (Synthesis)",
                position=synthesis_response,
                model_used="phi4-mini",
                key_points=self._extract_key_points(synthesis_response),
            ),
        )

    def _extract_key_points(self, text: str) -> List[str]:
        """Extract key points from an argument (bullet points or sentences)."""
        points = []
        for line in text.split("\n"):
            stripped = line.strip()
            if stripped.startswith(("-", "•", "*", "1", "2", "3")):
                points.append(re.sub(r'^[-•*\d.]+\s*', '', stripped))
        if not points:
            # Fallback: first 2 sentences
            sentences = re.split(r'(?<=[.!?])\s+', text)
            points = [s.strip() for s in sentences[:2] if s.strip()]
        return points[:5]


# Singleton
debate_agent = MultiAgentDebateMode()

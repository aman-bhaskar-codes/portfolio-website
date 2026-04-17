"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Owner Identity Cache (Tier 0 Memory)
═══════════════════════════════════════════════════════════

Pre-loaded facts about the portfolio owner.
Never fetched from the DB — always in-memory, always fast.
This is the "ground truth" that prevents hallucination.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

logger = logging.getLogger("portfolio.memory.owner")


@dataclass
class OwnerFact:
    """A single verified fact about the owner."""
    category: str       # "skill", "project", "experience", "education", "meta"
    key: str            # e.g. "primary_language"
    value: str          # e.g. "Python"
    confidence: float = 1.0  # 1.0 = verified by owner


@dataclass
class OwnerIdentity:
    """
    Complete owner identity — the AI's "self-knowledge".
    Loaded once at startup, never changes during runtime.
    """
    name: str = "Aman"
    title: str = "Software Engineer & AI Builder"
    current_status: str = "Building AI systems in public"
    availability: str = "Open to exciting opportunities"

    facts: list[OwnerFact] = field(default_factory=list)

    def add_fact(self, category: str, key: str, value: str) -> None:
        self.facts.append(OwnerFact(category=category, key=key, value=value))

    def get_facts_by_category(self, category: str) -> list[OwnerFact]:
        return [f for f in self.facts if f.category == category]

    def to_prompt_context(self) -> str:
        """Format all facts for prompt injection."""
        lines = [
            f"Name: {self.name}",
            f"Title: {self.title}",
            f"Status: {self.current_status}",
            f"Availability: {self.availability}",
        ]

        categories = set(f.category for f in self.facts)
        for cat in sorted(categories):
            lines.append(f"\n{cat.upper()}:")
            for fact in self.get_facts_by_category(cat):
                lines.append(f"  - {fact.key}: {fact.value}")

        return "\n".join(lines)


def build_default_identity() -> OwnerIdentity:
    """
    Build the default owner identity with core facts.
    In production, this would load from a YAML file or DB.
    """
    identity = OwnerIdentity()

    # Core skills
    identity.add_fact("skill", "primary_languages", "Python, TypeScript")
    identity.add_fact("skill", "frameworks", "FastAPI, Next.js, React")
    identity.add_fact("skill", "ai_stack", "LangGraph, Ollama, Qdrant, RAG")
    identity.add_fact("skill", "infrastructure", "Docker, PostgreSQL, Redis")

    # Key projects
    identity.add_fact("project", "antigravity_os",
                      "AI-powered portfolio system with local LLMs, hybrid RAG, "
                      "3-tier memory, knowledge graph, and visitor intelligence")

    # Meta facts
    identity.add_fact("meta", "personality",
                      "Warm, direct, technically precise, occasionally dry humor")
    identity.add_fact("meta", "communication_style",
                      "Ground every claim in evidence. Never hallucinate.")

    return identity


# Module-level singleton
owner_identity = build_default_identity()

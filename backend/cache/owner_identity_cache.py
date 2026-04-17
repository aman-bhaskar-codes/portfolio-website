"""
═══════════════════════════════════════════════════════════
Owner Identity Cache — Tier 0 Memory
═══════════════════════════════════════════════════════════

Permanent Redis hash of immutable owner facts.
Sub-1ms reads on every request. Updated only when owner
deliberately changes via admin endpoint.

Fields: name, current_role, top_skills, current_projects,
        contact_prefs, availability, bio_summary
"""

from __future__ import annotations

import json
import logging
from typing import Dict, Optional

logger = logging.getLogger("portfolio.cache.identity")


# ═══════════════════════════════════════════════════════════
# DEFAULT OWNER IDENTITY
# ═══════════════════════════════════════════════════════════

DEFAULT_OWNER_IDENTITY: Dict[str, str] = {
    "name": "Aman Bhaskar",
    "current_role": "Senior AI Architect",
    "bio_summary": (
        "AI engineer building cognitive platforms that bridge human intent "
        "and autonomous execution. Expert in LangGraph orchestration, hybrid RAG, "
        "multi-model LLM systems, and production-grade agent architectures."
    ),
    "top_skills": json.dumps([
        "LangGraph Agent Orchestration",
        "Hybrid RAG (HyDE + BM25 + RRF + Cross-Encoder)",
        "Multi-Model LLM Systems (Ollama)",
        "Production FastAPI + PostgreSQL + Redis",
        "3-Tier Memory Architecture",
        "Distributed Systems Design",
        "Next.js + React + Three.js Frontend",
    ]),
    "current_projects": json.dumps([
        "Agentic Portfolio (ANTIGRAVITY OS)",
        "AutoResearch Platform",
        "ForgeAI Engine",
    ]),
    "technologies": json.dumps([
        "Python", "TypeScript", "FastAPI", "Next.js", "LangGraph",
        "PostgreSQL", "Redis", "Qdrant", "Docker", "Kubernetes",
        "Ollama", "pgvector", "Celery", "Prometheus",
    ]),
    "availability": "Open to senior AI/ML engineering roles and technical co-founder opportunities",
    "contact_preferences": "Email or LinkedIn DM preferred",
    "engineering_philosophy": (
        "Build systems that are observable, self-healing, and gracefully degrading. "
        "Prefer raw SQL for performance-critical paths, ORMs for CRUD. "
        "Test the boundaries, not just the happy path. Ship fast, then harden."
    ),
    "years_experience": "5+",
    "location": "Available globally (remote)",
}

REDIS_KEY = "owner:identity"


class OwnerIdentityCache:
    """
    Tier 0 memory — permanent Redis hash with owner identity.
    Every request reads from this cache (sub-1ms).
    """

    def __init__(self, redis_client):
        self.redis = redis_client

    async def initialize(self):
        """Seed identity if not already present in Redis."""
        exists = await self.redis.exists(REDIS_KEY)
        if not exists:
            await self.redis.hset(REDIS_KEY, mapping=DEFAULT_OWNER_IDENTITY)
            logger.info("Seeded owner identity cache (Tier 0)")

    async def get_full_identity(self) -> Dict[str, str]:
        """Get all identity fields. Sub-1ms."""
        data = await self.redis.hgetall(REDIS_KEY)
        if not data:
            # Fallback to defaults if Redis empty
            return DEFAULT_OWNER_IDENTITY
        # Redis returns bytes in some configs — decode
        return {
            (k.decode() if isinstance(k, bytes) else k):
            (v.decode() if isinstance(v, bytes) else v)
            for k, v in data.items()
        }

    async def get_field(self, field: str) -> Optional[str]:
        """Get a single identity field."""
        value = await self.redis.hget(REDIS_KEY, field)
        if isinstance(value, bytes):
            return value.decode()
        return value

    async def update_field(self, field: str, value: str):
        """Update a single identity field (admin only)."""
        await self.redis.hset(REDIS_KEY, field, value)
        logger.info(f"Updated owner identity field: {field}")

    async def build_context_string(self) -> str:
        """
        Build a context string for system prompt injection.
        This is the Tier 0 data injected into EVERY response.
        """
        identity = await self.get_full_identity()

        parts = [
            f"Owner: {identity.get('name', 'Aman Bhaskar')}",
            f"Role: {identity.get('current_role', 'AI Architect')}",
            f"Bio: {identity.get('bio_summary', '')}",
            f"Availability: {identity.get('availability', 'Open to opportunities')}",
            f"Philosophy: {identity.get('engineering_philosophy', '')}",
        ]

        # Parse JSON arrays
        try:
            skills = json.loads(identity.get("top_skills", "[]"))
            parts.append(f"Top Skills: {', '.join(skills[:5])}")
        except (json.JSONDecodeError, TypeError):
            pass

        try:
            projects = json.loads(identity.get("current_projects", "[]"))
            parts.append(f"Current Projects: {', '.join(projects)}")
        except (json.JSONDecodeError, TypeError):
            pass

        return "\n".join(parts)

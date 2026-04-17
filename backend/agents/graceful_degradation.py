"""
═══════════════════════════════════════════════════════════
Graceful Degradation Chain (§14.3)
═══════════════════════════════════════════════════════════

5-tier fallback ensuring the portfolio ALWAYS responds:

  Tier 1: Ollama best model (qwen2.5:3b — quality)
  Tier 2: Ollama lighter model (llama3.2:3b — faster)
  Tier 3: Ollama minimal (phi4-mini — lightest)
  Tier 4: Static FAQ from Redis (pre-generated top 50)
  Tier 5: Static HTML responses (hardcoded, always available)

Degradation is invisible to the visitor — quality drops
but it never errors.
"""

from __future__ import annotations

import logging
from typing import Optional

import httpx

from backend.config.settings import settings

logger = logging.getLogger("portfolio.degradation")


# ═══════════════════════════════════════════════════════════
# MODEL TIERS
# ═══════════════════════════════════════════════════════════

MODEL_TIERS = [
    {"name": "qwen2.5:3b", "tier": 1, "label": "best quality"},
    {"name": "llama3.2:3b", "tier": 2, "label": "fast conversational"},
    {"name": "phi4-mini", "tier": 3, "label": "lightest local"},
]


# ═══════════════════════════════════════════════════════════
# STATIC FAQ (Tier 4 — always available in Redis)
# ═══════════════════════════════════════════════════════════

STATIC_FAQ = {
    "who is aman": (
        "I'm Aman Bhaskar, an AI architect building production-grade autonomous "
        "systems. I specialize in LangGraph agent orchestration, hybrid RAG, and "
        "multi-model LLM inference pipelines."
    ),
    "what do you do": (
        "I build cognitive platforms — systems where multiple AI models collaborate "
        "through structured graphs, retrieving from hybrid knowledge bases, and "
        "streaming responses in real-time."
    ),
    "tech stack": (
        "My core stack: Python, FastAPI, LangGraph, PostgreSQL (pgvector), Redis, "
        "Qdrant, Docker, Kubernetes. Frontend: Next.js, TypeScript, React, Three.js. "
        "Models: Ollama (qwen2.5, llama3.2, phi4-mini)."
    ),
    "projects": (
        "My main projects: ANTIGRAVITY OS (this agentic portfolio), AutoResearch "
        "(autonomous multi-agent research platform), and ForgeAI (self-healing "
        "code generation engine)."
    ),
    "availability": (
        "I'm currently open to senior AI/ML engineering roles and technical "
        "co-founder opportunities. Reach out via LinkedIn or email."
    ),
    "experience": (
        "5+ years building production systems. Expertise in distributed systems, "
        "RAG architecture, agent orchestration, and full-stack development. "
        "I've shipped systems handling 10k+ concurrent users."
    ),
    "contact": (
        "Best way to reach me is LinkedIn DM or email. I respond within 24 hours. "
        "Check my GitHub at github.com/aman-bhaskar-codes."
    ),
}

# Tier 5 — absolute fallback
STATIC_FALLBACK = (
    "Thanks for your interest! I'm Aman Bhaskar, an AI architect specializing "
    "in agent orchestration and production ML systems. My portfolio system is "
    "currently experiencing high load — please try again in a moment, or reach "
    "out on LinkedIn for a direct conversation."
)


# ═══════════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════════

async def check_ollama_health() -> bool:
    """Check if Ollama is responding."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.OLLAMA_URL}/api/tags")
            return resp.status_code == 200
    except Exception:
        return False


async def get_available_models() -> list[str]:
    """Get list of currently available Ollama models."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.OLLAMA_URL}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                return [m["name"] for m in data.get("models", [])]
    except Exception:
        pass
    return []


# ═══════════════════════════════════════════════════════════
# DEGRADATION ENGINE
# ═══════════════════════════════════════════════════════════

class GracefulDegradation:
    """
    Manages the 5-tier fallback chain.
    Automatically selects the best available response method.
    """

    def __init__(self, redis_client=None):
        self.redis = redis_client
        self._current_tier = 1

    async def select_model(self, preferred: Optional[str] = None) -> dict:
        """
        Select the best available model, falling through tiers.
        
        Returns:
            {"model": str, "tier": int, "method": "ollama"|"static_faq"|"static"}
        """
        # Check Ollama availability
        available = await get_available_models()

        if available:
            # Try preferred model first
            if preferred and preferred in available:
                self._current_tier = 1
                return {"model": preferred, "tier": 1, "method": "ollama"}

            # Fall through tiers
            for tier_info in MODEL_TIERS:
                if tier_info["name"] in available:
                    self._current_tier = tier_info["tier"]
                    logger.info(f"Degradation: using tier {tier_info['tier']} — {tier_info['name']}")
                    return {
                        "model": tier_info["name"],
                        "tier": tier_info["tier"],
                        "method": "ollama",
                    }

            # Ollama running but no expected models — use first available
            if available:
                self._current_tier = 3
                return {"model": available[0], "tier": 3, "method": "ollama"}

        # Tier 4: Static FAQ from Redis
        if self.redis:
            self._current_tier = 4
            logger.warning("Degradation: Ollama unavailable, falling back to static FAQ")
            return {"model": "static_faq", "tier": 4, "method": "static_faq"}

        # Tier 5: Hardcoded static
        self._current_tier = 5
        logger.error("Degradation: All AI services unavailable, using static fallback")
        return {"model": "static", "tier": 5, "method": "static"}

    async def get_static_response(self, query: str) -> str:
        """
        Get a static response from FAQ or hardcoded fallback.
        Used when Ollama is completely unavailable.
        """
        query_lower = query.lower()

        # Check Redis FAQ cache first
        if self.redis:
            cached = await self._check_redis_faq(query_lower)
            if cached:
                return cached

        # Check static FAQ
        for key, response in STATIC_FAQ.items():
            if key in query_lower:
                return response

        # Absolute fallback
        return STATIC_FALLBACK

    async def _check_redis_faq(self, query: str) -> Optional[str]:
        """Check Redis for cached FAQ responses."""
        try:
            # Check each FAQ key
            for key in STATIC_FAQ:
                if key in query:
                    cached = await self.redis.get(f"faq:{key}")
                    if cached:
                        return cached.decode() if isinstance(cached, bytes) else cached
        except Exception:
            pass
        return None

    async def seed_faq_to_redis(self):
        """Pre-seed FAQ responses to Redis for Tier 4 fallback."""
        if not self.redis:
            return
        try:
            for key, response in STATIC_FAQ.items():
                await self.redis.set(f"faq:{key}", response)
            logger.info(f"Seeded {len(STATIC_FAQ)} FAQ entries to Redis")
        except Exception as e:
            logger.warning(f"Failed to seed FAQ: {e}")

    @property
    def current_tier(self) -> int:
        return self._current_tier

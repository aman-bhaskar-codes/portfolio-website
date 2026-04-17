"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Model Router (§16)
═══════════════════════════════════════════════════════════

Decides which model handles each request.
Fallback chain: phi4-mini → qwen2.5:3b → llama3.2:3b → cloud (if key set)

INTENT_MODEL_MAP is the single source of truth for routing.
"""

from __future__ import annotations

import logging
from enum import Enum
from typing import Any

logger = logging.getLogger("portfolio.llm.router")


class ModelChoice(str, Enum):
    FAST = "llama3.2:3b"
    CODE = "qwen2.5:3b"
    DEEP = "phi4-mini:latest"
    VISION = "llava-phi3"
    EMBED = "nomic-embed-text"
    RERANK = "mxbai-rerank-large"
    CLOUD_FAST = "claude-haiku-4-5-20251001"
    CLOUD_SMART = "claude-sonnet-4-6"


# Intent → preferred model mapping
INTENT_MODEL_MAP: dict[str, ModelChoice] = {
    # Fast (conversational, simple queries)
    "small_talk": ModelChoice.FAST,
    "casual": ModelChoice.FAST,
    "out_of_scope": ModelChoice.FAST,
    "personal_info": ModelChoice.FAST,
    "social_proof": ModelChoice.FAST,

    # Deep (complex analysis, project synthesis)
    "projects": ModelChoice.DEEP,
    "interview_sim": ModelChoice.DEEP,
    "persona_synthesis": ModelChoice.DEEP,
    "dspy_optimization": ModelChoice.DEEP,

    # Code (technical depth, code walkthrough)
    "technical_skill": ModelChoice.CODE,
    "code_walkthrough": ModelChoice.CODE,
}


class ModelRouter:
    """
    Routes each request to the optimal model based on:
    1. Query intent (from router agent)
    2. Visitor persona (engineers get deeper models)
    3. Model availability (circuit breaker state)
    4. Cloud fallback (if Ollama is down + API key exists)
    """

    def __init__(self):
        self._cloud_api_key: str = ""
        self._ollama_available: bool = True

    def configure(
        self,
        cloud_api_key: str = "",
    ) -> None:
        self._cloud_api_key = cloud_api_key

    async def select_model(
        self,
        intent: str,
        persona: str = "casual",
        ollama_circuit_open: bool = False,
    ) -> str:
        """
        Select the best model for this request.

        Returns the model name string to pass to OllamaClient.
        """
        # If Ollama is down entirely
        if ollama_circuit_open:
            if self._cloud_api_key:
                logger.info("Ollama down, falling back to cloud")
                return ModelChoice.CLOUD_FAST.value
            else:
                # No cloud key — try smallest local model anyway
                logger.warning("Ollama down, no cloud key — trying FAST model")
                return ModelChoice.FAST.value

        # Get preferred model from intent map
        preferred = INTENT_MODEL_MAP.get(intent, ModelChoice.FAST)

        # Engineers and interview mode → always use deepest model
        if persona in ("senior_engineer", "engineering_manager"):
            if intent in ("projects", "technical_skill", "code_walkthrough"):
                preferred = ModelChoice.DEEP

        # Startup founders → deep for projects, fast for casual
        if persona == "startup_founder" and intent == "projects":
            preferred = ModelChoice.DEEP

        return preferred.value

    def get_embed_model(self) -> str:
        """Always use nomic-embed-text for embeddings."""
        return ModelChoice.EMBED.value

    def get_rerank_model(self) -> str:
        """Always use mxbai-rerank-large for reranking."""
        return ModelChoice.RERANK.value

    def get_vision_model(self) -> str:
        """Return the vision model."""
        return ModelChoice.VISION.value

    def is_cloud_model(self, model: str) -> bool:
        """Check if a model requires cloud API."""
        return model in (
            ModelChoice.CLOUD_FAST.value,
            ModelChoice.CLOUD_SMART.value,
        )


# Module-level singleton
model_router = ModelRouter()

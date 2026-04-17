# backend/llm/router.py
"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Model Router
═══════════════════════════════════════════════════════════

Maps intent + complexity → best Ollama model.
"""
import logging
from enum import Enum
from backend.config.settings import settings
from backend.llm.ollama_client import get_ollama

logger = logging.getLogger(__name__)


class Intent(str, Enum):
    SMALL_TALK = "small_talk"
    PERSONAL_INFO = "personal_info"
    PROJECTS = "projects"
    TECHNICAL = "technical_skill"
    CODE = "code_walkthrough"
    SOCIAL_PROOF = "social_proof"
    OUT_OF_SCOPE = "out_of_scope"


INTENT_TO_MODEL = {
    Intent.SMALL_TALK: settings.LLM_MODEL_MEDIUM,      # llama3.2:3b
    Intent.PERSONAL_INFO: settings.LLM_MODEL_MEDIUM,
    Intent.PROJECTS: settings.LLM_MODEL_MEDIUM,
    Intent.TECHNICAL: settings.LLM_MODEL_LIGHT,         # qwen2.5:3b
    Intent.CODE: settings.LLM_MODEL_LIGHT,
    Intent.SOCIAL_PROOF: settings.LLM_MODEL_MEDIUM,
    Intent.OUT_OF_SCOPE: settings.LLM_MODEL_MEDIUM,
}

COMPLEXITY_TO_MODEL = {
    "low": settings.LLM_MODEL_MEDIUM,       # llama3.2:3b
    "medium": settings.LLM_MODEL_LIGHT,     # qwen2.5:3b
    "high": settings.LLM_MODEL_HEAVY,       # phi4-mini
}


async def select_model(intent: str, complexity: str = "medium") -> str:
    """Select the best available model for this intent + complexity."""
    ollama = get_ollama()

    # Primary selection by intent
    try:
        primary = INTENT_TO_MODEL[Intent(intent)]
    except (ValueError, KeyError):
        primary = COMPLEXITY_TO_MODEL.get(complexity, settings.LLM_MODEL_MEDIUM)

    # Check if Ollama is available
    if await ollama.is_available():
        return primary

    # Last resort: smallest local model
    logger.warning("Ollama may be slow, using primary model anyway")
    return settings.LLM_MODEL_MEDIUM


def estimate_complexity(query: str) -> str:
    """Fast heuristic complexity estimation (<1ms, no LLM call)."""
    query_lower = query.lower()
    high_signals = ["architect", "design", "tradeoff", "distributed", "scale", "compare"]
    low_signals = ["hi", "hello", "thanks", "what is your", "tell me about"]

    if any(s in query_lower for s in high_signals) or len(query) > 300:
        return "high"
    if any(s in query_lower for s in low_signals) or len(query) < 50:
        return "low"
    return "medium"

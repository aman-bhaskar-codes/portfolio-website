"""
═══════════════════════════════════════════════════════════
Intelligent Model Router — ANTIGRAVITY OS v2 (§25.1)
═══════════════════════════════════════════════════════════

Routes every LLM call to the most efficient Ollama model.
Adapted for LOCAL-ONLY stack (no Anthropic, no OpenAI).

MODEL REGISTRY:
  MODEL_TIER_1 (HEAVY — best reasoning):
    phi4-mini (2.5GB)
    Use for: system design, interview sim, code walkthroughs,
             senior engineer depth, debate mode

  MODEL_TIER_2 (MEDIUM — fast conversational):
    llama3.2:3b (2.0GB)
    Use for: standard Q&A, persona responses, project descriptions

  MODEL_TIER_3 (LIGHT — instant):
    qwen2.5:3b (1.9GB)
    Use for: greetings, FAQ, routing, classification, simple lookups

ROUTING LOGIC:
  1. Mode overrides (interview → phi4-mini)
  2. Persona + depth routing
  3. Complexity heuristic (<1ms, no LLM call)
  4. Health-aware fallthrough
"""

from __future__ import annotations

import logging
import re
from enum import Enum
from typing import Optional

from pydantic import BaseModel

logger = logging.getLogger("portfolio.llm.router")


# ═══════════════════════════════════════════════════════════
# MODELS & ENUMS
# ═══════════════════════════════════════════════════════════

class OllamaModel(str, Enum):
    PHI4_MINI = "phi4-mini"
    LLAMA32 = "llama3.2:3b"
    QWEN25 = "qwen2.5:3b"


class ConversationMode(str, Enum):
    NORMAL = "normal"
    INTERVIEW_SIM = "interview_sim"
    CODE_WALKTHROUGH = "code_walkthrough"
    BUILD_WITH_ME = "build_with_me"
    DEBATE = "debate"
    STUMP = "stump"
    CLI = "cli"


class ModelSelection(BaseModel):
    model: str
    reason: str
    complexity_score: float = 0.0
    fallback_chain: list[str] = []


# ═══════════════════════════════════════════════════════════
# COMPLEXITY ESTIMATION
# ═══════════════════════════════════════════════════════════

# High complexity signals
HIGH_COMPLEXITY_WORDS = {
    "design", "architect", "architecture", "tradeoff", "trade-off",
    "compare", "versus", "vs", "distributed", "scalab", "concurrent",
    "consistency", "consensus", "replication", "partition",
    "microservice", "monolith", "event-driven", "cqrs",
    "kubernetes", "docker", "terraform", "ci/cd",
    "machine learning", "neural", "transformer", "embedding",
    "database", "indexing", "sharding", "optimization",
    "explain", "deep dive", "walkthrough", "how does",
    "pros and cons", "advantages", "disadvantages",
}

# Low complexity signals
LOW_COMPLEXITY_WORDS = {
    "hi", "hello", "hey", "thanks", "thank you", "bye",
    "ok", "okay", "sure", "yes", "no", "cool",
    "what is your name", "who are you", "where are you",
}

# Question depth markers
DEPTH_MARKERS = re.compile(
    r"(why|how|explain|what if|wouldn't|couldn't|shouldn't|"
    r"describe|elaborate|detail|walk me through)",
    re.IGNORECASE,
)


def estimate_query_complexity(query: str) -> float:
    """
    Fast heuristic (<1ms, no LLM call needed).
    Returns 0.0 (trivial) to 1.0 (extremely complex).
    """
    if not query:
        return 0.0

    score = 0.5  # Start at medium
    query_lower = query.lower().strip()
    words = query_lower.split()
    word_count = len(words)

    # ── High complexity signals ──

    # Length
    if len(query) > 300:
        score += 0.2
    elif len(query) > 150:
        score += 0.1

    # Domain keywords
    keyword_hits = sum(
        1 for kw in HIGH_COMPLEXITY_WORDS if kw in query_lower
    )
    score += min(keyword_hits * 0.1, 0.3)

    # Depth markers (why, how, explain...)
    depth_matches = len(DEPTH_MARKERS.findall(query_lower))
    score += min(depth_matches * 0.1, 0.2)

    # Multi-part questions
    question_marks = query.count("?")
    if question_marks > 1:
        score += 0.15

    # Code presence
    if "```" in query or "def " in query or "class " in query:
        score += 0.2

    # ── Low complexity signals ──

    # Single word
    if word_count <= 2:
        score -= 0.3

    # Greeting/farewell
    if any(word in query_lower for word in LOW_COMPLEXITY_WORDS):
        score -= 0.4

    # Very short
    if len(query) < 30:
        score -= 0.2

    return max(0.0, min(1.0, score))


# ═══════════════════════════════════════════════════════════
# MODEL ROUTER
# ═══════════════════════════════════════════════════════════

class ModelRouter:
    """
    Routes every query to the optimal Ollama model.
    """

    # Fallback chains per model
    FALLBACK_CHAINS = {
        OllamaModel.PHI4_MINI: [OllamaModel.LLAMA32, OllamaModel.QWEN25],
        OllamaModel.LLAMA32: [OllamaModel.QWEN25, OllamaModel.PHI4_MINI],
        OllamaModel.QWEN25: [OllamaModel.LLAMA32, OllamaModel.PHI4_MINI],
    }

    def select_model(
        self,
        query: str,
        visitor_persona: str = "casual",
        conversation_depth: int = 0,
        mode: ConversationMode = ConversationMode.NORMAL,
        available_models: Optional[list[str]] = None,
        bot_use_lighter: bool = False,
    ) -> ModelSelection:
        """
        Select the best model for this query.
        """
        available = set(available_models or [m.value for m in OllamaModel])

        # ── Mode overrides (always use strongest model) ──
        if mode in (
            ConversationMode.INTERVIEW_SIM,
            ConversationMode.CODE_WALKTHROUGH,
            ConversationMode.BUILD_WITH_ME,
            ConversationMode.DEBATE,
        ):
            return self._select_with_fallback(
                OllamaModel.PHI4_MINI,
                f"{mode.value}_requires_depth",
                available,
            )

        # ── Bot routing — force lighter model ──
        if bot_use_lighter:
            return self._select_with_fallback(
                OllamaModel.QWEN25,
                "suspected_bot_lighter_model",
                available,
            )

        # ── Stump mode — use strongest for best confidence scoring ──
        if mode == ConversationMode.STUMP:
            return self._select_with_fallback(
                OllamaModel.PHI4_MINI,
                "stump_mode_needs_confidence",
                available,
            )

        # ── CLI mode — medium model sufficient ──
        if mode == ConversationMode.CLI:
            return self._select_with_fallback(
                OllamaModel.LLAMA32,
                "cli_mode_medium",
                available,
            )

        # ── Complexity-based routing ──
        complexity = estimate_query_complexity(query)

        # Persona + depth boost
        if visitor_persona in ("senior_engineer", "technical_recruiter") and conversation_depth > 3:
            complexity = min(1.0, complexity + 0.2)

        if complexity > 0.7:
            # Complex → phi4-mini
            target = OllamaModel.PHI4_MINI
            reason = "complex_query"
        elif complexity > 0.3:
            # Medium → llama3.2:3b
            target = OllamaModel.LLAMA32
            reason = "medium_query"
        else:
            # Simple → qwen2.5:3b
            target = OllamaModel.QWEN25
            reason = "simple_query"

        selection = self._select_with_fallback(target, reason, available)
        selection.complexity_score = round(complexity, 2)
        return selection

    def _select_with_fallback(
        self,
        target: OllamaModel,
        reason: str,
        available: set[str],
    ) -> ModelSelection:
        """Try target model, fall through chain if unavailable."""
        # Try target
        if target.value in available:
            return ModelSelection(
                model=target.value,
                reason=reason,
                fallback_chain=[m.value for m in self.FALLBACK_CHAINS[target]],
            )

        # Fallback chain
        for fallback in self.FALLBACK_CHAINS[target]:
            if fallback.value in available:
                logger.warning(
                    f"Model {target.value} unavailable, "
                    f"falling back to {fallback.value}"
                )
                return ModelSelection(
                    model=fallback.value,
                    reason=f"{reason}_fallback",
                    fallback_chain=[],
                )

        # All models unavailable
        logger.error("All Ollama models unavailable!")
        return ModelSelection(
            model="",
            reason="all_models_unavailable",
        )


# Singleton
model_router = ModelRouter()

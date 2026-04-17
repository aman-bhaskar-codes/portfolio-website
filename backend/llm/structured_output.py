"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v3 — Structured Output Engine (§38)
═══════════════════════════════════════════════════════════

Wraps Ollama with Outlines for guaranteed JSON schema compliance.
At each decoding step, Outlines masks tokens that would violate
the Pydantic schema — guaranteeing 100% valid output.

When Outlines is unavailable, falls back to standard Ollama
with JSON mode + Pydantic validation + retry.
"""

from __future__ import annotations

import json
import logging
from typing import Any, TypeVar, Type

from pydantic import BaseModel

logger = logging.getLogger("portfolio.llm.structured_output")

T = TypeVar("T", bound=BaseModel)


# ═══════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS FOR STRUCTURED OUTPUT
# ═══════════════════════════════════════════════════════════

class VisitorPersonaClassification(BaseModel):
    """Guaranteed enum classification of visitor type."""
    persona: str          # Must be one of known personas
    confidence: float     # 0.0 to 1.0
    signals: list[str]    # Evidence for classification


class ProjectSummary(BaseModel):
    """Structured project summary for ingestion."""
    recruiter_one_liner: str    # Max 100 chars
    technical_deep_dive: str    # For engineers
    impact_statement: str       # Quantified if possible
    complexity_score: float     # 0.0 to 10.0


class KGEntityExtraction(BaseModel):
    """Knowledge graph entities extracted from text."""
    entities: list[dict[str, str]]     # [{name, type, description}]
    relations: list[dict[str, str]]    # [{source, target, relation}]


class ConversionSignalResult(BaseModel):
    """Conversion signal detection output."""
    has_intent: bool
    intent_type: str       # contact | brief | interview | walkthrough | none
    confidence: float
    suggested_action: str


class IntentClassificationResult(BaseModel):
    """Query intent classification."""
    intent: str            # chat | interview | code_walkthrough | brief | build_with_me | debate
    complexity: float      # 0.0 to 1.0
    requires_rag: bool
    requires_kg: bool


# ═══════════════════════════════════════════════════════════
# STRUCTURED OUTPUT ENGINE
# ═══════════════════════════════════════════════════════════

class StructuredOutputEngine:
    """
    Guaranteed schema-compliant output from local Ollama models.

    Strategy:
    1. If Outlines is available → constrained decoding (best)
    2. If not → Ollama JSON mode + Pydantic validation + retry

    All methods are defensive: on failure, return a safe default
    rather than crashing the entire pipeline.
    """

    def __init__(self, model_name: str = "qwen2.5:3b"):
        self.model_name = model_name
        self._outlines_available = False
        self._ollama_base_url = "http://localhost:11434"

        # Try to import Outlines
        try:
            import outlines
            self._outlines_available = True
            logger.info("✅ Outlines available — constrained decoding enabled")
        except ImportError:
            logger.info(
                "⚠️ Outlines not installed — using JSON mode fallback"
            )

    def configure(self, model_name: str, ollama_url: str) -> None:
        """Configure model and Ollama URL from settings."""
        self.model_name = model_name
        self._ollama_base_url = ollama_url

    async def generate_structured(
        self,
        prompt: str,
        schema: Type[T],
        max_retries: int = 3,
    ) -> T | None:
        """
        Generate structured output matching the given Pydantic schema.
        Returns None on complete failure (never raises).
        """
        # Try Outlines constrained decoding first
        if self._outlines_available:
            try:
                return await self._generate_with_outlines(prompt, schema)
            except Exception as e:
                logger.warning(f"Outlines generation failed: {e}, falling back")

        # Fallback: Ollama JSON mode + validation
        for attempt in range(max_retries):
            try:
                return await self._generate_with_json_mode(prompt, schema)
            except Exception as e:
                logger.warning(
                    f"JSON mode attempt {attempt + 1}/{max_retries} failed: {e}"
                )

        logger.error(f"All structured output attempts failed for schema {schema.__name__}")
        return None

    async def _generate_with_outlines(
        self, prompt: str, schema: Type[T]
    ) -> T:
        """Use Outlines constrained decoding for guaranteed schema compliance."""
        import outlines
        import outlines.models as models

        model = models.openai_compatible(
            model_name=self.model_name,
            base_url=f"{self._ollama_base_url}/v1",
            api_key="ollama",  # Ollama doesn't need a key
        )
        generator = outlines.generate.json(model, schema)
        result = generator(prompt)
        return result

    async def _generate_with_json_mode(
        self, prompt: str, schema: Type[T]
    ) -> T:
        """Fallback: Ollama JSON mode + Pydantic validation."""
        import httpx

        schema_json = json.dumps(schema.model_json_schema(), indent=2)
        enhanced_prompt = (
            f"{prompt}\n\n"
            f"Respond with ONLY valid JSON matching this schema:\n"
            f"{schema_json}\n\n"
            f"Output JSON only, no markdown, no explanation."
        )

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self._ollama_base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": enhanced_prompt,
                    "format": "json",
                    "stream": False,
                    "options": {"temperature": 0.1},
                },
            )
            response.raise_for_status()
            data = response.json()
            raw_text = data.get("response", "")

        # Parse and validate with Pydantic
        parsed = json.loads(raw_text)
        return schema.model_validate(parsed)

    # ───────────────────────────────────────────────────────
    # CONVENIENCE METHODS
    # ───────────────────────────────────────────────────────

    async def classify_persona(
        self, visitor_signals: str
    ) -> VisitorPersonaClassification | None:
        """Classify visitor persona from behavioral signals."""
        prompt = (
            "You are a visitor classification system for a software engineer's portfolio.\n"
            "Classify the visitor's persona from these signals:\n\n"
            f"{visitor_signals}\n\n"
            "Personas: senior_engineer, junior_developer, technical_recruiter, "
            "hiring_manager, startup_founder, student, curious_visitor\n"
            "Output confidence 0.0-1.0 and evidence signals."
        )
        return await self.generate_structured(
            prompt, VisitorPersonaClassification
        )

    async def classify_intent(
        self, query: str, conversation_history: str = ""
    ) -> IntentClassificationResult | None:
        """Classify query intent for routing."""
        prompt = (
            "Classify the intent of this visitor query to a software portfolio:\n\n"
            f"Query: {query}\n"
            f"History: {conversation_history[:500]}\n\n"
            "Intents: chat, interview, code_walkthrough, brief, build_with_me, debate\n"
            "Estimate complexity 0.0-1.0 and whether RAG/KG lookup is needed."
        )
        return await self.generate_structured(
            prompt, IntentClassificationResult
        )

    async def extract_kg_entities(
        self, text: str
    ) -> KGEntityExtraction | None:
        """Extract knowledge graph entities and relations from text."""
        prompt = (
            "Extract named entities and their relationships from this "
            "software engineering text:\n\n"
            f"{text[:2000]}\n\n"
            "Entity types: technology, project, skill, pattern, tool, concept\n"
            "Relation types: uses, part_of, related_to, built_with, implements"
        )
        return await self.generate_structured(prompt, KGEntityExtraction)

    async def detect_conversion_signal(
        self, message: str, persona: str
    ) -> ConversionSignalResult | None:
        """Detect conversion intent in visitor message."""
        prompt = (
            "Does this message from a portfolio visitor indicate conversion intent?\n\n"
            f"Message: {message}\n"
            f"Visitor persona: {persona}\n\n"
            "Intent types: contact, brief, interview, walkthrough, none\n"
            "A conversion signal means the visitor wants to take a next step."
        )
        return await self.generate_structured(
            prompt, ConversionSignalResult
        )


# Module-level singleton
structured_output_engine = StructuredOutputEngine()

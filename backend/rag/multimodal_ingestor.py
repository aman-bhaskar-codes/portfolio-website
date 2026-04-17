"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v3 — Local Multimodal Vision Pipeline (§37)
═══════════════════════════════════════════════════════════

Uses llava-phi3 (~4.2B params) via Ollama for all image understanding.
Zero external API calls. Zero cost per image.

Three use cases:
  1. Project screenshot ingestion → RAG chunks
  2. Architecture diagram analysis → KG entities
  3. Live visitor image context → conversation injection
"""

from __future__ import annotations

import base64
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger("portfolio.rag.multimodal")


@dataclass
class ImageDescription:
    """Structured description of a project screenshot or diagram."""
    interface_type: str = ""      # UI, terminal, dashboard, diagram, etc.
    technical_components: list[str] = field(default_factory=list)
    capabilities_demonstrated: list[str] = field(default_factory=list)
    engineer_summary: str = ""    # One-sentence for senior engineers
    recruiter_summary: str = ""   # One-sentence for non-technical recruiters
    raw_description: str = ""     # Full LLM output


@dataclass
class ArchitectureAnalysis:
    """Structured analysis of an architecture diagram."""
    components: list[dict[str, str]] = field(default_factory=list)
    data_flows: list[dict[str, str]] = field(default_factory=list)
    patterns: list[str] = field(default_factory=list)
    scale_indicators: list[str] = field(default_factory=list)
    technology_clues: list[str] = field(default_factory=list)
    raw_analysis: str = ""


class LocalVisionPipeline:
    """
    Uses llava-phi3 (via Ollama) for all image understanding.
    Zero external API calls. Zero cost per image.

    Graceful degradation: if vision model is not available,
    returns empty descriptions rather than crashing.
    """

    def __init__(self):
        self._model = "llava-phi3"
        self._ollama_url = "http://localhost:11434"
        self._available = False

    async def initialize(
        self, model: str = "llava-phi3", ollama_url: str = "http://localhost:11434"
    ) -> None:
        """Check if the vision model is available in Ollama."""
        self._model = model
        self._ollama_url = ollama_url

        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self._ollama_url}/api/tags")
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    model_names = [m.get("name", "").split(":")[0] for m in models]
                    if model.split(":")[0] in model_names:
                        self._available = True
                        logger.info(f"✅ Vision model available: {model}")
                    else:
                        logger.warning(
                            f"⚠️ Vision model '{model}' not found in Ollama. "
                            f"Available: {model_names}. "
                            f"Run: ollama pull {model}"
                        )
        except Exception as e:
            logger.warning(f"⚠️ Vision pipeline init failed (non-fatal): {e}")

    async def describe_project_screenshot(
        self,
        image_path: str | Path,
        project_name: str,
    ) -> ImageDescription:
        """
        Analyze a project screenshot and generate structured description.
        Used during project ingestion to create RAG chunks from images.
        """
        if not self._available:
            logger.debug("Vision model unavailable, returning empty description")
            return ImageDescription()

        prompt = (
            f'You are analyzing a screenshot from a software project called "{project_name}".\n\n'
            "Describe:\n"
            "1. What type of interface/output is shown (UI, terminal, dashboard, diagram, etc.)\n"
            "2. Key technical components visible (components, charts, data structures, APIs)\n"
            "3. What engineering capabilities this demonstrates\n"
            "4. One-sentence technical summary for a senior engineer\n"
            "5. One-sentence summary for a non-technical recruiter\n\n"
            "Be specific. Mention concrete technical details. Avoid vague descriptions."
        )

        try:
            raw = await self._generate_with_image(prompt, str(image_path))
            return self._parse_screenshot_description(raw)
        except Exception as e:
            logger.warning(f"Screenshot description failed: {e}")
            return ImageDescription()

    async def analyze_architecture_diagram(
        self,
        image_path: str | Path,
    ) -> ArchitectureAnalysis:
        """
        Analyze an architecture diagram and extract structured information.
        Used to build knowledge graph entries from visual documentation.
        """
        if not self._available:
            return ArchitectureAnalysis()

        prompt = (
            "Analyze this software architecture diagram.\n\n"
            "Extract and list:\n"
            "1. All system components (databases, services, queues, APIs, frontends)\n"
            "2. Data flow directions (A → B means A sends data to B)\n"
            "3. Architecture patterns used (microservices, CQRS, event-driven, etc.)\n"
            "4. Scale indicators (if any: sharding, replication, load balancers)\n"
            "5. Technology stack clues visible in the diagram\n\n"
            "Be concrete and specific about what you see."
        )

        try:
            raw = await self._generate_with_image(prompt, str(image_path))
            return self._parse_architecture_analysis(raw)
        except Exception as e:
            logger.warning(f"Architecture analysis failed: {e}")
            return ArchitectureAnalysis()

    async def describe_visitor_image(
        self,
        image_base64: str,
        context: str = "",
    ) -> str:
        """
        Describe an image pasted by a visitor in chat.
        Returns a natural language description for conversation injection.
        """
        if not self._available:
            return "I can't analyze images right now, but I'd love to hear you describe it!"

        prompt = (
            "A visitor pasted this image in a chat with a software engineer's portfolio AI.\n"
            f"{'Context: ' + context if context else ''}\n\n"
            "Describe what you see in this image in 2-3 sentences.\n"
            "Focus on any technical content (code, architecture, UI, data).\n"
            "Be conversational and helpful."
        )

        try:
            return await self._generate_with_image_base64(prompt, image_base64)
        except Exception as e:
            logger.warning(f"Visitor image description failed: {e}")
            return "I see you shared an image — could you tell me more about it?"

    # ───────────────────────────────────────────────────────
    # INTERNAL METHODS
    # ───────────────────────────────────────────────────────

    async def _generate_with_image(self, prompt: str, image_path: str) -> str:
        """Generate response from image file path."""
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")

        image_data = base64.b64encode(path.read_bytes()).decode("utf-8")
        return await self._generate_with_image_base64(prompt, image_data)

    async def _generate_with_image_base64(
        self, prompt: str, image_base64: str
    ) -> str:
        """Generate response from base64-encoded image."""
        import httpx

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self._ollama_url}/api/generate",
                json={
                    "model": self._model,
                    "prompt": prompt,
                    "images": [image_base64],
                    "stream": False,
                    "options": {"temperature": 0.3},
                },
            )
            response.raise_for_status()
            return response.json().get("response", "")

    def _parse_screenshot_description(self, raw: str) -> ImageDescription:
        """Best-effort parsing of screenshot description."""
        lines = raw.strip().split("\n")
        desc = ImageDescription(raw_description=raw)

        for line in lines:
            lower = line.lower().strip()
            if any(kw in lower for kw in ["interface", "output", "type"]):
                desc.interface_type = line.strip()
            elif any(kw in lower for kw in ["component", "api", "chart"]):
                desc.technical_components.append(line.strip())
            elif any(kw in lower for kw in ["capabilit", "demonstrat"]):
                desc.capabilities_demonstrated.append(line.strip())
            elif "senior" in lower or "engineer" in lower:
                desc.engineer_summary = line.strip()
            elif "recruiter" in lower or "non-technical" in lower:
                desc.recruiter_summary = line.strip()

        return desc

    def _parse_architecture_analysis(self, raw: str) -> ArchitectureAnalysis:
        """Best-effort parsing of architecture analysis."""
        return ArchitectureAnalysis(raw_analysis=raw)

    @property
    def is_available(self) -> bool:
        return self._available


# Module-level singleton
vision_pipeline = LocalVisionPipeline()

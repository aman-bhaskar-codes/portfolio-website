"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — HyDE Query Expansion (§10)
═══════════════════════════════════════════════════════════

Hypothetical Document Embedding:
Generate a hypothetical answer → embed it → use as search query.
This dramatically improves recall for vague or short queries.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("portfolio.rag.hyde")


class HyDEExpander:
    """
    Generates hypothetical document embeddings for better retrieval.
    
    Instead of embedding the raw query "What AI projects?", we first
    generate a hypothetical answer, then embed THAT for searching.
    This bridges the vocabulary gap between question and answer.
    """

    HYDE_PROMPT = (
        "Generate a short (2-3 sentence) answer to this question about "
        "a software engineer's portfolio. Don't use any real facts — "
        "just generate what an ideal answer MIGHT look like:\n\n"
        "Question: {query}\n\n"
        "Hypothetical answer:"
    )

    def __init__(self, ollama_client: Any, model: str = "llama3.2:3b"):
        self._ollama = ollama_client
        self._model = model

    async def expand(self, query: str) -> str:
        """
        Generate a hypothetical answer to use as an expanded query.
        
        Falls back to the original query if generation fails.
        """
        try:
            response = await self._ollama.generate(
                model=self._model,
                prompt=self.HYDE_PROMPT.format(query=query),
                options={"num_predict": 100, "temperature": 0.7},
            )
            expanded = response.get("response", "").strip()
            if expanded and len(expanded) > 10:
                logger.debug(f"HyDE expanded: '{query}' → '{expanded[:80]}...'")
                return expanded
        except Exception as e:
            logger.debug(f"HyDE expansion failed (using original query): {e}")

        return query


# Factory function
def create_hyde_expander(
    ollama_client: Any,
    model: str = "llama3.2:3b",
) -> HyDEExpander:
    return HyDEExpander(ollama_client, model)

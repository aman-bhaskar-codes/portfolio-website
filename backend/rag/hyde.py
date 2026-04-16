"""
HyDE — Hypothetical Document Embeddings.
Generates a hypothetical answer to the query, embeds it,
and uses that embedding for denser retrieval.
"""

import json
import logging

import httpx

from backend.config.settings import settings
from backend.config.constants import RAG_CONFIG
from backend.prompts.templates import HyDETemplate
from backend.rag.embedder import embedder

logger = logging.getLogger("portfolio.rag.hyde")

_hyde_template = HyDETemplate()


async def generate_hypothetical_document(query: str) -> str:
    """
    Generate a hypothetical answer to the query using a fast model.
    This answer is NOT returned to the user — it's embedded for retrieval.
    """
    prompt = _hyde_template.template.format(query=query)
    
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{settings.OLLAMA_URL}/api/generate",
                json={
                    "model": RAG_CONFIG["hyde_model"],
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": 150},
                },
            )
            response.raise_for_status()
            data = response.json()
            hypothetical = data.get("response", "").strip()
            
            if hypothetical:
                logger.debug(f"HyDE generated: '{hypothetical[:80]}...'")
                return hypothetical
            
    except Exception as e:
        logger.warning(f"HyDE generation failed, falling back to raw query: {e}")
    
    return query  # Fallback: use raw query


async def hyde_embed(query: str) -> list[float]:
    """
    Full HyDE pipeline: generate hypothetical doc → embed it.
    
    Returns:
        768-dim embedding of the hypothetical document
    """
    hypothetical_doc = await generate_hypothetical_document(query)
    
    # Embed the hypothetical document (not the raw query)
    embedding = await embedder.embed_text(hypothetical_doc)
    
    return embedding

"""
Embedding pipeline — nomic-embed-text via Ollama.
Produces 768-dimensional vectors for RAG and memory.
"""

import logging
from typing import Optional

import httpx

from backend.config.settings import settings

logger = logging.getLogger("portfolio.rag.embedder")


class Embedder:
    """
    Embedding client using Ollama's nomic-embed-text model.
    Supports single and batch embedding with configurable batch size.
    """

    def __init__(
        self,
        model: str = None,
        base_url: str = None,
        batch_size: int = None,
    ):
        self.model = model or settings.EMBED_MODEL
        self.base_url = base_url or settings.OLLAMA_URL
        self.batch_size = batch_size or settings.EMBED_BATCH_SIZE
        self._dimensions = settings.QDRANT_VECTOR_SIZE

    async def embed_text(self, text: str) -> list[float]:
        """
        Embed a single text string.
        
        Returns:
            768-dimensional float vector
        """
        if not text.strip():
            return [0.0] * self._dimensions

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/api/embed",
                json={"model": self.model, "input": text},
            )
            response.raise_for_status()
            data = response.json()
            
            # Ollama returns {"embeddings": [[...]]}
            embeddings = data.get("embeddings", [])
            if embeddings and len(embeddings) > 0:
                return embeddings[0]
            
            # Fallback: try older API format
            embedding = data.get("embedding", [])
            if embedding:
                return embedding
                
            logger.error(f"Unexpected embedding response format: {list(data.keys())}")
            return [0.0] * self._dimensions

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Embed a batch of texts efficiently.
        
        Args:
            texts: List of text strings to embed
        
        Returns:
            List of 768-dimensional float vectors
        """
        if not texts:
            return []

        results = []
        
        # Process in configured batch sizes
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i : i + self.batch_size]
            
            # Filter empty strings
            non_empty = [(j, t) for j, t in enumerate(batch) if t.strip()]
            
            if not non_empty:
                results.extend([[0.0] * self._dimensions] * len(batch))
                continue
            
            try:
                async with httpx.AsyncClient(timeout=60) as client:
                    response = await client.post(
                        f"{self.base_url}/api/embed",
                        json={
                            "model": self.model,
                            "input": [t for _, t in non_empty],
                        },
                    )
                    response.raise_for_status()
                    data = response.json()
                    embeddings = data.get("embeddings", [])
                    
                    # Map embeddings back to original indices
                    batch_results = [[0.0] * self._dimensions] * len(batch)
                    for idx, (orig_idx, _) in enumerate(non_empty):
                        if idx < len(embeddings):
                            batch_results[orig_idx] = embeddings[idx]
                    
                    results.extend(batch_results)
                    
            except Exception as e:
                logger.error(f"Batch embedding error: {e}")
                # Fall back to individual embeddings
                for _, text in non_empty:
                    try:
                        emb = await self.embed_text(text)
                        results.append(emb)
                    except Exception:
                        results.append([0.0] * self._dimensions)

        logger.info(f"Embedded {len(texts)} texts in {(len(texts) - 1) // self.batch_size + 1} batches")
        return results

    async def embed_query(self, query: str) -> list[float]:
        """
        Embed a search query. Alias for embed_text with query-specific logging.
        """
        logger.debug(f"Embedding query: '{query[:50]}...'")
        return await self.embed_text(query)


# ── Singleton ──
embedder = Embedder()

"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v3 — ColBERT Late-Interaction Retriever (§36)
═══════════════════════════════════════════════════════════

Three-stage retrieval pipeline:
  Stage 1 — Dense (Qdrant):    query → top-50 candidates (~20ms)
  Stage 2 — ColBERT (rerank):  top-50 → top-8 (~80ms)
  Stage 3 — Cross-encoder:     top-8 → top-4 (~50ms, complex queries only)

Graceful degradation: if ColBERT or cross-encoder unavailable,
falls back to dense retrieval only.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger("portfolio.rag.colbert")


@dataclass
class RerankedChunk:
    """A retrieved chunk with original + reranked scores."""
    content: str
    metadata: dict[str, Any] = field(default_factory=dict)
    dense_score: float = 0.0
    colbert_score: float = 0.0
    cross_encoder_score: float = 0.0
    final_score: float = 0.0
    chunk_id: str = ""


class ColBERTRetriever:
    """
    Late-interaction retrieval as Stage 2 of a multi-stage pipeline.

    ColBERT compares every query token to every document token,
    finding precise token-level matches that dense retrieval misses.
    This is critical for technical queries like "how did you handle
    the thundering herd problem in your cache layer?"

    All external dependencies are lazy-loaded and wrapped in
    try/except — the system never crashes if a model is missing.
    """

    def __init__(self):
        self._colbert = None
        self._cross_encoder = None
        self._colbert_available = False
        self._cross_encoder_available = False
        self._initialized = False

    async def initialize(
        self,
        colbert_model: str = "colbert-ir/colbertv2.0",
        cross_encoder_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2",
    ) -> None:
        """
        Lazy-initialize ColBERT and cross-encoder models.
        Called once at startup. Failures are non-fatal.
        """
        if self._initialized:
            return

        # ColBERT via RAGatouille
        try:
            from ragatouille import RAGPretrainedModel
            self._colbert = RAGPretrainedModel.from_pretrained(colbert_model)
            self._colbert_available = True
            logger.info(f"✅ ColBERT loaded: {colbert_model}")
        except Exception as e:
            logger.warning(f"⚠️ ColBERT unavailable (non-fatal): {e}")

        # Cross-encoder via sentence-transformers
        try:
            from sentence_transformers import CrossEncoder
            self._cross_encoder = CrossEncoder(
                cross_encoder_model, max_length=512
            )
            self._cross_encoder_available = True
            logger.info(f"✅ Cross-encoder loaded: {cross_encoder_model}")
        except Exception as e:
            logger.warning(f"⚠️ Cross-encoder unavailable (non-fatal): {e}")

        self._initialized = True

    async def retrieve(
        self,
        query: str,
        dense_candidates: list[dict[str, Any]],
        use_cross_encoder: bool = False,
        top_k_colbert: int = 8,
        top_k_final: int = 4,
    ) -> list[RerankedChunk]:
        """
        Multi-stage reranking of dense retrieval candidates.

        Args:
            query: The visitor's search query
            dense_candidates: Results from Qdrant dense search
                Each must have 'content', 'metadata', 'score' keys
            use_cross_encoder: Enable Stage 3 (complex queries only)
            top_k_colbert: How many to keep after ColBERT rerank
            top_k_final: How many to return after cross-encoder

        Returns:
            List of RerankedChunk with final scores
        """
        if not dense_candidates:
            return []

        # Convert to RerankedChunk format
        chunks = [
            RerankedChunk(
                content=c.get("content", ""),
                metadata=c.get("metadata", {}),
                dense_score=c.get("score", 0.0),
                chunk_id=c.get("id", ""),
            )
            for c in dense_candidates
        ]

        # Stage 2: ColBERT reranking
        if self._colbert_available and self._colbert is not None:
            try:
                chunks = await self._colbert_rerank(query, chunks, top_k_colbert)
            except Exception as e:
                logger.warning(f"ColBERT rerank failed, using dense scores: {e}")
                chunks = sorted(chunks, key=lambda c: c.dense_score, reverse=True)
                chunks = chunks[:top_k_colbert]
        else:
            # Fallback: just use dense scores
            chunks = sorted(chunks, key=lambda c: c.dense_score, reverse=True)
            chunks = chunks[:top_k_colbert]

        # Stage 3: Cross-encoder (optional, for complex queries)
        if (
            use_cross_encoder
            and self._cross_encoder_available
            and self._cross_encoder is not None
        ):
            try:
                chunks = await self._cross_encoder_rerank(
                    query, chunks, top_k_final
                )
            except Exception as e:
                logger.warning(f"Cross-encoder rerank failed: {e}")
                chunks = chunks[:top_k_final]
        else:
            chunks = chunks[:top_k_final]

        # Set final scores
        for chunk in chunks:
            chunk.final_score = (
                chunk.cross_encoder_score
                if chunk.cross_encoder_score > 0
                else chunk.colbert_score
                if chunk.colbert_score > 0
                else chunk.dense_score
            )

        return sorted(chunks, key=lambda c: c.final_score, reverse=True)

    async def _colbert_rerank(
        self,
        query: str,
        chunks: list[RerankedChunk],
        top_k: int,
    ) -> list[RerankedChunk]:
        """Stage 2: ColBERT late-interaction reranking."""
        documents = [c.content for c in chunks]

        # RAGatouille rerank returns list of {content, score, rank}
        results = self._colbert.rerank(
            query=query,
            documents=documents,
            k=min(top_k, len(documents)),
        )

        # Map scores back to chunks
        content_to_score: dict[str, float] = {}
        for r in results:
            content_to_score[r["content"]] = r["score"]

        for chunk in chunks:
            chunk.colbert_score = content_to_score.get(chunk.content, 0.0)

        # Sort by ColBERT score and take top_k
        reranked = sorted(chunks, key=lambda c: c.colbert_score, reverse=True)
        return reranked[:top_k]

    async def _cross_encoder_rerank(
        self,
        query: str,
        chunks: list[RerankedChunk],
        top_k: int,
    ) -> list[RerankedChunk]:
        """Stage 3: Cross-encoder reranking (most precise, most expensive)."""
        pairs = [(query, c.content) for c in chunks]
        scores = self._cross_encoder.predict(pairs)

        for chunk, score in zip(chunks, scores):
            chunk.cross_encoder_score = float(score)

        reranked = sorted(
            chunks, key=lambda c: c.cross_encoder_score, reverse=True
        )
        return reranked[:top_k]

    @property
    def is_colbert_available(self) -> bool:
        return self._colbert_available

    @property
    def is_cross_encoder_available(self) -> bool:
        return self._cross_encoder_available


# Module-level singleton
colbert_retriever = ColBERTRetriever()

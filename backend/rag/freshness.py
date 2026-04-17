"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Chunk Freshness Scoring
═══════════════════════════════════════════════════════════

Stale knowledge is a lie. Recent chunks score higher.
Exponential decay based on age — commits from yesterday
outrank docs from 6 months ago.
"""

from __future__ import annotations

import math
import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("portfolio.rag.freshness")


class FreshnessScorer:
    """
    Applies time-decay scoring to RAG chunks.
    
    Formula: freshness = base_score * decay_factor
    Where:  decay_factor = exp(-lambda * age_days)
    
    Default half-life: 30 days (configurable)
    - 0 days old  → 1.0x multiplier
    - 30 days old → 0.5x multiplier
    - 60 days old → 0.25x multiplier
    - 90 days old → 0.125x multiplier
    """

    def __init__(self, half_life_days: float = 30.0):
        self._half_life = half_life_days
        # lambda = ln(2) / half_life
        self._decay_lambda = math.log(2) / max(half_life_days, 1.0)

    def score(
        self,
        chunk: dict[str, Any],
        base_score: float = 1.0,
        now: datetime | None = None,
    ) -> float:
        """
        Calculate freshness-adjusted score for a chunk.
        
        Args:
            chunk: Must have 'updated_at' or 'created_at' in metadata
            base_score: The retrieval relevance score (from Qdrant/BM25)
            now: Current time (defaults to UTC now)
            
        Returns:
            Adjusted score = base_score * freshness_decay
        """
        if now is None:
            now = datetime.now(timezone.utc)

        # Extract timestamp from chunk metadata
        timestamp = self._extract_timestamp(chunk)
        if timestamp is None:
            # No timestamp → apply a mild penalty (0.7x)
            return base_score * 0.7

        # Calculate age in days
        age_days = max((now - timestamp).total_seconds() / 86400.0, 0.0)

        # Exponential decay
        decay = math.exp(-self._decay_lambda * age_days)

        return base_score * decay

    def rerank_by_freshness(
        self,
        chunks: list[dict[str, Any]],
        scores: list[float] | None = None,
        freshness_weight: float = 0.3,
    ) -> list[dict[str, Any]]:
        """
        Re-rank chunks by combining relevance and freshness.
        
        Combined score = (1 - freshness_weight) * relevance + freshness_weight * freshness
        
        Args:
            chunks: List of RAG chunks
            scores: Parallel list of relevance scores (default: all 1.0)
            freshness_weight: How much to weight freshness (0.0-1.0)
            
        Returns:
            Re-ranked list of chunks
        """
        if not chunks:
            return []

        if scores is None:
            scores = [1.0] * len(chunks)

        now = datetime.now(timezone.utc)
        scored: list[tuple[float, dict[str, Any]]] = []

        for chunk, relevance in zip(chunks, scores):
            freshness = self.score(chunk, base_score=1.0, now=now)
            combined = (1 - freshness_weight) * relevance + freshness_weight * freshness
            scored.append((combined, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [chunk for _, chunk in scored]

    def _extract_timestamp(self, chunk: dict[str, Any]) -> datetime | None:
        """Extract timestamp from chunk metadata."""
        metadata = chunk.get("metadata", chunk)

        for field in ("updated_at", "created_at", "last_modified", "timestamp"):
            val = metadata.get(field)
            if val is None:
                continue

            if isinstance(val, datetime):
                if val.tzinfo is None:
                    return val.replace(tzinfo=timezone.utc)
                return val

            if isinstance(val, str):
                try:
                    dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    return dt
                except (ValueError, TypeError):
                    continue

            if isinstance(val, (int, float)):
                try:
                    return datetime.fromtimestamp(val, tz=timezone.utc)
                except (ValueError, OSError):
                    continue

        return None


# Module-level singleton
freshness_scorer = FreshnessScorer(half_life_days=30.0)

"""
═══════════════════════════════════════════════════════════
Self-Healing Ingestion — Freshness Tracker (§5)
═══════════════════════════════════════════════════════════

Every RAG chunk has a freshness score. The system proactively
identifies and reschedules stale chunks.

Freshness = f(age, source_type, change_velocity)

Source-type TTLs:
  - GitHub file content:     12 hours
  - GitHub README:           24 hours
  - GitHub stats:            6 hours
  - LinkedIn about:          7 days
  - Resume PDF:              on_change_only
  - Personal bio:            on_change_only
  - Project descriptions:    72 hours

Semantic drift detection via cosine similarity < 0.92.
"""

from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.rag.freshness")


# ═══════════════════════════════════════════════════════════
# TTL CONFIGURATION
# ═══════════════════════════════════════════════════════════

SOURCE_TYPE_TTL: Dict[str, timedelta] = {
    "github_file": timedelta(hours=12),
    "github_readme": timedelta(hours=24),
    "github_stats": timedelta(hours=6),
    "github_commit": timedelta(hours=12),
    "linkedin": timedelta(days=7),
    "resume": timedelta(days=365),  # on_change_only, effectively
    "bio": timedelta(days=365),
    "project_description": timedelta(hours=72),
    "owner_content": timedelta(days=30),
}

# Active repos get shorter TTLs
VELOCITY_MULTIPLIER_ACTIVE = 0.5   # Commits in last 7 days
VELOCITY_MULTIPLIER_ARCHIVED = 5.0  # No commits in 90+ days

# Semantic drift threshold
DRIFT_THRESHOLD = 0.92  # cosine similarity below this = meaningful change


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class ChunkFreshness(BaseModel):
    chunk_id: str
    source_type: str
    last_checked: datetime
    last_content_hash: str = ""
    freshness_score: float = 1.0  # 0.0 = stale, 1.0 = fresh
    needs_reingest: bool = False
    semantic_drift_detected: bool = False


class SemanticDrift(BaseModel):
    chunk_id: str
    old_hash: str
    new_hash: str
    cosine_similarity: float
    drift_type: str  # "semantic" (meaning changed) or "stylistic" (form changed)
    needs_reingest: bool


# ═══════════════════════════════════════════════════════════
# FRESHNESS TRACKER
# ═══════════════════════════════════════════════════════════

class ChunkFreshnessTracker:
    """Track and maintain freshness of RAG chunks."""

    def __init__(self, embed_fn=None):
        """
        Args:
            embed_fn: async callable(text) -> List[float]
        """
        self.embed_fn = embed_fn

    def score_chunk_freshness(
        self,
        source_type: str,
        last_updated: datetime,
        is_active_repo: bool = False,
    ) -> float:
        """
        Compute freshness score for a chunk.
        Returns 0.0 (totally stale) to 1.0 (perfectly fresh).
        """
        ttl = SOURCE_TYPE_TTL.get(source_type, timedelta(hours=24))

        # Apply velocity multiplier
        if is_active_repo:
            ttl = timedelta(seconds=ttl.total_seconds() * VELOCITY_MULTIPLIER_ACTIVE)
        
        age = datetime.now(timezone.utc) - last_updated
        if age <= timedelta(0):
            return 1.0

        # Linear decay over TTL
        ratio = age / ttl
        score = max(0.0, 1.0 - ratio)
        return round(score, 3)

    def is_stale(
        self,
        source_type: str,
        last_updated: datetime,
        is_active_repo: bool = False,
    ) -> bool:
        """Check if a chunk is past its freshness TTL."""
        return self.score_chunk_freshness(source_type, last_updated, is_active_repo) <= 0.0

    async def detect_semantic_drift(
        self,
        old_content: str,
        new_content: str,
        chunk_id: str = "",
    ) -> SemanticDrift:
        """
        Detect if content change is semantic (meaning changed) or just stylistic.
        
        Method:
          1. Hash comparison (fast path — identical = skip)
          2. Embedding cosine similarity
          3. If cosine < 0.92 → SEMANTIC DRIFT (re-ingest with priority)
          4. If cosine >= 0.92 → stylistic only (update timestamp)
        """
        old_hash = hashlib.sha256(old_content.encode()).hexdigest()[:16]
        new_hash = hashlib.sha256(new_content.encode()).hexdigest()[:16]

        # Fast path: identical content
        if old_hash == new_hash:
            return SemanticDrift(
                chunk_id=chunk_id,
                old_hash=old_hash,
                new_hash=new_hash,
                cosine_similarity=1.0,
                drift_type="none",
                needs_reingest=False,
            )

        # Compute semantic similarity
        if self.embed_fn:
            try:
                old_emb = await self.embed_fn(old_content[:2000])
                new_emb = await self.embed_fn(new_content[:2000])
                similarity = self._cosine_similarity(old_emb, new_emb)
            except Exception as e:
                logger.warning(f"Embedding failed for drift detection: {e}")
                similarity = 0.0
        else:
            # Without embeddings, treat all content changes as semantic
            similarity = 0.0

        drift_type = "semantic" if similarity < DRIFT_THRESHOLD else "stylistic"
        needs_reingest = similarity < DRIFT_THRESHOLD

        if needs_reingest:
            logger.info(
                f"Semantic drift detected for {chunk_id}: "
                f"similarity={similarity:.3f} < threshold={DRIFT_THRESHOLD}"
            )

        return SemanticDrift(
            chunk_id=chunk_id,
            old_hash=old_hash,
            new_hash=new_hash,
            cosine_similarity=round(similarity, 4),
            drift_type=drift_type,
            needs_reingest=needs_reingest,
        )

    def compute_freshness_weighted_score(
        self,
        relevance_score: float,
        freshness_score: float,
        impact_score: float = 0.5,
    ) -> float:
        """
        Final retrieval score combining relevance, freshness, and impact.
        
        score = (relevance × 0.70) + (freshness × 0.20) + (impact × 0.10)
        """
        return (
            relevance_score * 0.70
            + freshness_score * 0.20
            + impact_score * 0.10
        )

    @staticmethod
    def _cosine_similarity(a: List[float], b: List[float]) -> float:
        """Cosine similarity between two vectors."""
        import numpy as np
        a_arr = np.array(a, dtype=np.float32)
        b_arr = np.array(b, dtype=np.float32)
        dot = np.dot(a_arr, b_arr)
        norm_a = np.linalg.norm(a_arr)
        norm_b = np.linalg.norm(b_arr)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(dot / (norm_a * norm_b))

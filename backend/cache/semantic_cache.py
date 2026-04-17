"""
═══════════════════════════════════════════════════════════
Semantic Query Cache (§14.1)
═══════════════════════════════════════════════════════════

Cache by MEANING, not exact text. Two semantically similar
queries hit the same cache entry.

"Tell me about your Python projects" and
"What Python work have you done?" → same cache hit.

Uses query embedding → cosine similarity search in Redis.
Expected hit rate: 35-50% on common questions.
"""

from __future__ import annotations

import json
import hashlib
import logging
import time
from typing import Dict, List, Optional

import numpy as np

logger = logging.getLogger("portfolio.cache.semantic")

CACHE_PREFIX = "sem_cache:"
CACHE_TTL = 4 * 3600  # 4 hours
SIMILARITY_THRESHOLD = 0.93  # cosine similarity for cache hit


class SemanticQueryCache:
    """
    Embedding-based query cache backed by Redis.
    
    Flow:
      1. Embed incoming query
      2. Search cached query embeddings for cosine > SIMILARITY_THRESHOLD
      3. Hit → return cached response (sub-10ms)
      4. Miss → run full pipeline, cache result with query embedding
    """

    def __init__(self, redis_client, embed_fn=None):
        """
        Args:
            redis_client: async Redis client
            embed_fn: async callable(text) -> List[float] (embedding function)
        """
        self.redis = redis_client
        self.embed_fn = embed_fn
        self._cache_keys_key = "sem_cache:keys"  # Set of all cached query keys

    async def get(
        self, query: str, persona: str = "casual"
    ) -> Optional[Dict]:
        """
        Look up a semantically similar cached response.
        Returns None on cache miss.
        """
        if not self.embed_fn:
            return None

        try:
            query_embedding = await self.embed_fn(query)
            
            # Get all cached query keys
            cached_keys = await self.redis.smembers(self._cache_keys_key)
            if not cached_keys:
                return None

            best_match = None
            best_similarity = 0.0

            for key in cached_keys:
                if isinstance(key, bytes):
                    key = key.decode()

                # Check persona match
                cached_data = await self.redis.get(f"{CACHE_PREFIX}{key}")
                if not cached_data:
                    # Expired — clean up
                    await self.redis.srem(self._cache_keys_key, key)
                    continue

                data = json.loads(cached_data if isinstance(cached_data, str) else cached_data.decode())
                
                # Skip if persona doesn't match
                if data.get("persona") != persona:
                    continue

                # Compute cosine similarity
                cached_embedding = data.get("embedding")
                if not cached_embedding:
                    continue

                similarity = self._cosine_similarity(query_embedding, cached_embedding)
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = data

            if best_match and best_similarity >= SIMILARITY_THRESHOLD:
                logger.info(
                    f"Semantic cache HIT: similarity={best_similarity:.3f}, "
                    f"original_query='{best_match.get('query', '')[:50]}...'"
                )
                return {
                    "response": best_match["response"],
                    "citations": best_match.get("citations", []),
                    "cached": True,
                    "similarity": round(best_similarity, 3),
                }

            return None

        except Exception as e:
            logger.warning(f"Semantic cache lookup failed: {e}")
            return None

    async def put(
        self,
        query: str,
        response: str,
        persona: str = "casual",
        citations: Optional[List] = None,
    ):
        """Cache a response with its query embedding."""
        if not self.embed_fn:
            return

        try:
            query_embedding = await self.embed_fn(query)
            cache_key = hashlib.md5(f"{query}:{persona}".encode()).hexdigest()[:16]

            data = {
                "query": query,
                "response": response,
                "persona": persona,
                "citations": citations or [],
                "embedding": query_embedding,
                "cached_at": time.time(),
            }

            await self.redis.set(
                f"{CACHE_PREFIX}{cache_key}",
                json.dumps(data),
                ex=CACHE_TTL,
            )
            await self.redis.sadd(self._cache_keys_key, cache_key)
            
            logger.debug(f"Semantic cache PUT: key={cache_key}, query='{query[:50]}...'")

        except Exception as e:
            logger.warning(f"Semantic cache put failed: {e}")

    async def invalidate_all(self):
        """Clear entire semantic cache."""
        keys = await self.redis.smembers(self._cache_keys_key)
        for key in keys:
            k = key.decode() if isinstance(key, bytes) else key
            await self.redis.delete(f"{CACHE_PREFIX}{k}")
        await self.redis.delete(self._cache_keys_key)
        logger.info("Semantic cache invalidated")

    @staticmethod
    def _cosine_similarity(a: List[float], b: List[float]) -> float:
        """Compute cosine similarity between two embedding vectors."""
        a_arr = np.array(a, dtype=np.float32)
        b_arr = np.array(b, dtype=np.float32)
        dot = np.dot(a_arr, b_arr)
        norm_a = np.linalg.norm(a_arr)
        norm_b = np.linalg.norm(b_arr)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(dot / (norm_a * norm_b))

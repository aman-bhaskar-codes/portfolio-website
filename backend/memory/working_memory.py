# backend/memory/working_memory.py
"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Working Memory (Tier 1: Redis)
═══════════════════════════════════════════════════════════

Per-session conversation history stored in Redis.
TTL: 2 hours, refreshed on each access (sliding window).
"""
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

DEFAULT_TTL = 7200  # 2 hours


class WorkingMemory:
    """Redis-backed conversation memory with sliding TTL."""

    def __init__(self, redis_client):
        self.redis = redis_client
        self.ttl = DEFAULT_TTL

    def _key(self, session_id: str) -> str:
        return f"wm:{session_id}"

    async def get(self, session_id: str) -> list[dict]:
        """Get conversation history for session. Refreshes TTL."""
        key = self._key(session_id)
        try:
            data = await self.redis.get(key)
            if data:
                await self.redis.expire(key, self.ttl)  # Sliding window
                return json.loads(data)
            return []
        except Exception as e:
            logger.warning(f"Working memory read failed: {e}")
            return []

    async def append(self, session_id: str, role: str, content: str) -> None:
        """Append a message to session history."""
        key = self._key(session_id)
        try:
            history = await self.get(session_id)
            history.append({"role": role, "content": content})

            # Keep last 20 turns (10 exchanges) to stay within token budget
            if len(history) > 20:
                history = history[-20:]

            await self.redis.set(key, json.dumps(history), ex=self.ttl)
        except Exception as e:
            logger.warning(f"Working memory write failed: {e}")

    async def clear(self, session_id: str) -> None:
        """Clear session history."""
        try:
            await self.redis.delete(self._key(session_id))
        except Exception as e:
            logger.warning(f"Working memory clear failed: {e}")

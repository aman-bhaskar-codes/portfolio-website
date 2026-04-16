"""
Working Memory (Tier 1) — Redis-backed short-term conversation buffer.
TTL: 2 hours, max 10 turns, max 2KB per session.
"""

import json
import logging
from typing import Optional

import redis.asyncio as aioredis

from backend.config.settings import settings
from backend.config.constants import MEMORY_CONFIG

logger = logging.getLogger("portfolio.memory.working")


def _session_key(session_id: str) -> str:
    return f"memory:session:{session_id}"


async def get_working_memory(session_id: str) -> list[dict]:
    """
    Retrieve working memory (recent conversation turns) for a session.
    
    Returns:
        List of message dicts: [{"role": "user", "content": "..."}, ...]
    """
    try:
        r = aioredis.from_url(settings.REDIS_URL)
        raw = await r.get(_session_key(session_id))
        await r.aclose()
        
        if raw:
            messages = json.loads(raw)
            return messages[-MEMORY_CONFIG["working_memory_max_turns"]:]
        
    except Exception as e:
        logger.error(f"Working memory read error: {e}")
    
    return []


async def update_working_memory(
    session_id: str,
    user_message: str,
    assistant_response: str,
) -> None:
    """
    Append a turn (user + assistant) to working memory.
    Enforces max turns and max bytes limits.
    """
    try:
        r = aioredis.from_url(settings.REDIS_URL)
        key = _session_key(session_id)
        
        # Read existing
        raw = await r.get(key)
        messages = json.loads(raw) if raw else []
        
        # Append new turn
        messages.append({"role": "user", "content": user_message})
        messages.append({"role": "assistant", "content": assistant_response})
        
        # Enforce max turns
        max_turns = MEMORY_CONFIG["working_memory_max_turns"]
        if len(messages) > max_turns * 2:
            messages = messages[-(max_turns * 2):]
        
        # Enforce max bytes
        serialized = json.dumps(messages)
        max_bytes = MEMORY_CONFIG["working_memory_max_bytes"]
        while len(serialized.encode()) > max_bytes and len(messages) > 2:
            messages = messages[2:]  # Drop oldest turn
            serialized = json.dumps(messages)
        
        # Write with TTL
        await r.setex(key, settings.REDIS_SESSION_TTL, serialized)
        await r.aclose()
        
        logger.debug(f"Working memory updated: session={session_id}, turns={len(messages)//2}")
        
    except Exception as e:
        logger.error(f"Working memory write error: {e}")


async def clear_working_memory(session_id: str) -> None:
    """Clear working memory for a session."""
    try:
        r = aioredis.from_url(settings.REDIS_URL)
        await r.delete(_session_key(session_id))
        await r.aclose()
    except Exception as e:
        logger.error(f"Working memory clear error: {e}")


async def get_turn_count(session_id: str) -> int:
    """Get the number of conversation turns in working memory."""
    messages = await get_working_memory(session_id)
    return len(messages) // 2

"""
Episodic Memory (Tier 2) — PostgreSQL + pgvector long-term episode storage.
Stores compressed conversation summaries with semantic embeddings.
"""

import json
import logging
from typing import Optional
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config.settings import settings
from backend.rag.embedder import embedder

logger = logging.getLogger("portfolio.memory.episodic")


async def store_episode(
    db: AsyncSession,
    user_id: str,
    session_id: str,
    summary: str,
    key_facts: list[str],
    topics: list[str],
) -> None:
    """
    Store a compressed conversation episode.
    Called by memory_manager every N turns.
    """
    try:
        # Embed the summary for semantic retrieval
        embedding = await embedder.embed_text(summary)
        
        await db.execute(
            text("""
                INSERT INTO user_episodes (user_id, session_id, summary, key_facts, topics_discussed, embedding)
                VALUES (:user_id, :session_id, :summary, :key_facts, :topics, :embedding)
            """),
            {
                "user_id": user_id,
                "session_id": session_id,
                "summary": summary,
                "key_facts": json.dumps(key_facts),
                "topics": json.dumps(topics),
                "embedding": str(embedding),
            },
        )
        await db.commit()
        
        logger.info(f"Episodic memory stored: user={user_id}, topics={topics}")
        
    except Exception as e:
        logger.error(f"Episodic memory store error: {e}")
        await db.rollback()


async def recall_episodes(
    db: AsyncSession,
    user_id: str,
    query: str,
    top_k: int = 3,
) -> list[dict]:
    """
    Retrieve relevant past episodes for a user using semantic search.
    
    Returns:
        List of episode dicts with summary, key_facts, topics
    """
    try:
        # Embed the query for semantic matching
        query_embedding = await embedder.embed_query(query)
        
        result = await db.execute(
            text("""
                SELECT summary, key_facts, topics_discussed, 
                       1 - (embedding <=> :embedding::vector) as similarity,
                       created_at
                FROM user_episodes
                WHERE user_id = :user_id
                ORDER BY embedding <=> :embedding::vector
                LIMIT :top_k
            """),
            {
                "user_id": user_id,
                "embedding": str(query_embedding),
                "top_k": top_k,
            },
        )
        
        episodes = []
        for row in result.fetchall():
            episodes.append({
                "summary": row[0],
                "key_facts": json.loads(row[1]) if isinstance(row[1], str) else row[1],
                "topics": json.loads(row[2]) if isinstance(row[2], str) else row[2],
                "similarity": float(row[3]) if row[3] else 0.0,
                "created_at": str(row[4]) if row[4] else "",
            })
        
        logger.debug(f"Recalled {len(episodes)} episodes for user={user_id}")
        return episodes
        
    except Exception as e:
        logger.error(f"Episodic memory recall error: {e}")
        return []


async def get_user_memory_summary(
    db: AsyncSession,
    user_id: str,
) -> str:
    """
    Get a concatenated summary of a user's past interactions.
    Used for the visitor memory slot in the system prompt.
    """
    try:
        result = await db.execute(
            text("""
                SELECT summary, topics_discussed
                FROM user_episodes
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT 5
            """),
            {"user_id": user_id},
        )
        
        rows = result.fetchall()
        if not rows:
            return ""
        
        summaries = []
        for row in rows:
            summary = row[0]
            topics = json.loads(row[1]) if isinstance(row[1], str) else row[1]
            summaries.append(f"{summary} (topics: {', '.join(topics)})")
        
        return " | ".join(summaries)
        
    except Exception as e:
        logger.error(f"Memory summary error: {e}")
        return ""

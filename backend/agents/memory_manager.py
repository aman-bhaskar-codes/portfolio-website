"""
Memory Manager Agent Node — orchestrates all 3 memory tiers.
Runs on every turn (async, fire-and-forget from graph).

Tier 1: Working Memory (Redis) — last 10 turns, TTL 2h
Tier 2: Episodic Memory (PostgreSQL) — compressed summaries every 10 turns
Tier 3: Semantic Memory (Qdrant) — distilled facts, updated daily

This module handles both READ (inject memory into context) and
WRITE (persist new memories after response generation).
"""

import json
import hashlib
import logging
from typing import Optional

import httpx

from backend.agents.state import AgentState
from backend.config.settings import settings
from backend.config.constants import MEMORY_CONFIG
from backend.memory.working import (
    get_working_memory,
    update_working_memory,
    get_turn_count,
)
from backend.memory.semantic import recall_user_memories, store_user_memory

logger = logging.getLogger("portfolio.agents.memory_manager")


# ═══════════════════════════════════════════════════════════
# LANGGRAPH NODE (called by the graph on every turn)
# ═══════════════════════════════════════════════════════════

async def memory_manager_node(state: AgentState) -> AgentState:
    """
    LangGraph node: read memories to enrich context, write new memories.

    READ phase (before response):
        - Pull working memory (Tier 1) from Redis
        - Query episodic memory (Tier 2) from PostgreSQL
        - Query semantic memory (Tier 3) from Qdrant
        - Assemble into memory_context string for the PromptFactory

    WRITE phase (after response, fire-and-forget):
        - Update working memory with current turn
        - Every N turns, compress and store episodic memory
        - Extract key facts for semantic memory

    Writes to state:
        - memory_context: assembled memory string
        - turn_count: current turn number
        - recent_topics: topics from memory
        - conversation_history: from working memory
    """
    session_id = state.get("session_id", "default")
    user_id = state.get("user_id", "anonymous")
    query = state.get("query", "")

    memory_parts = []

    # ── Tier 1: Working Memory (Redis) ──
    try:
        working = await get_working_memory(session_id)
        if working:
            state["conversation_history"] = working
            state["turn_count"] = len(working) // 2
            # Extract recent topics from conversation
            recent = _extract_recent_topics(working)
            state["recent_topics"] = recent
            memory_parts.append(
                f"Recent conversation ({len(working)//2} turns): "
                + "; ".join(
                    f'{m["role"]}: {m["content"][:80]}...'
                    for m in working[-4:]  # Last 2 turns
                )
            )
            logger.debug(f"Tier 1: loaded {len(working)} messages for session={session_id}")
    except Exception as e:
        logger.error(f"Tier 1 read error: {e}")

    # ── Tier 3: Semantic Memory (Qdrant) ──
    try:
        facts = await recall_user_memories(user_id, query, top_k=3)
        if facts:
            memory_parts.append(
                "Known about this visitor: " + " | ".join(facts)
            )
            logger.debug(f"Tier 3: recalled {len(facts)} facts for user={user_id}")
    except Exception as e:
        logger.error(f"Tier 3 read error: {e}")

    # ── Assemble memory context ──
    if memory_parts:
        state["memory_context"] = "\n".join(memory_parts)
    else:
        state["memory_context"] = "No prior memory for this visitor."

    return state


# ═══════════════════════════════════════════════════════════
# POST-RESPONSE WRITE (called after response generation)
# ═══════════════════════════════════════════════════════════

async def write_memories(state: AgentState) -> None:
    """
    Write memories after a response has been generated.
    Called asynchronously — never blocks the response stream.
    """
    session_id = state.get("session_id", "default")
    user_id = state.get("user_id", "anonymous")
    query = state.get("query", "")
    response = state.get("response", "")
    turn_count = state.get("turn_count", 0)

    if not query or not response:
        return

    # ── Tier 1: Update working memory ──
    try:
        await update_working_memory(session_id, query, response)
        logger.debug(f"Tier 1: updated working memory for session={session_id}")
    except Exception as e:
        logger.error(f"Tier 1 write error: {e}")

    # ── Tier 2: Episodic compression (every N turns) ──
    compress_interval = MEMORY_CONFIG["episodic_compression_interval"]
    if turn_count > 0 and turn_count % compress_interval == 0:
        try:
            await _compress_to_episodic(session_id, user_id)
            logger.info(f"Tier 2: compressed episode at turn {turn_count}")
        except Exception as e:
            logger.error(f"Tier 2 compression error: {e}")

    # ── Tier 3: Extract and store key facts ──
    try:
        facts = _extract_facts_from_turn(query, response)
        for fact in facts:
            await store_user_memory(user_id, fact)
        if facts:
            logger.debug(f"Tier 3: stored {len(facts)} facts for user={user_id}")
    except Exception as e:
        logger.error(f"Tier 3 write error: {e}")


# ═══════════════════════════════════════════════════════════
# ANONYMOUS USER ID GENERATION
# ═══════════════════════════════════════════════════════════

def generate_anonymous_id(ip: str, user_agent: str, date: str) -> str:
    """
    Generate a stable anonymous ID from device fingerprint.
    SHA256(ip + user_agent + date)[:16]
    """
    raw = f"{ip}:{user_agent}:{date}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


# ═══════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════

def _extract_recent_topics(messages: list[dict]) -> list[str]:
    """Extract topic keywords from recent conversation."""
    topic_keywords = {
        "project": "projects",
        "skill": "technical_skills",
        "experience": "experience",
        "github": "social_proof",
        "code": "code",
        "resume": "personal_info",
        "background": "personal_info",
        "demo": "demo",
        "architecture": "architecture",
    }

    topics = set()
    for msg in messages[-6:]:  # Last 3 turns
        content_lower = msg.get("content", "").lower()
        for keyword, topic in topic_keywords.items():
            if keyword in content_lower:
                topics.add(topic)

    return list(topics)[:5]


def _extract_facts_from_turn(query: str, response: str) -> list[str]:
    """
    Extract storable facts from a conversation turn.
    Simple heuristic — deeper extraction done by Celery batch job.
    """
    facts = []
    query_lower = query.lower()

    # Detect if user reveals information about themselves
    self_indicators = [
        "i am a", "i work", "i'm a", "my name", "i use",
        "i'm interested", "i need", "i want", "my company",
        "i build", "i develop", "my team",
    ]

    for indicator in self_indicators:
        if indicator in query_lower:
            # Extract the sentence containing the indicator
            sentences = query.split(".")
            for sentence in sentences:
                if indicator in sentence.lower():
                    fact = sentence.strip()
                    if len(fact) > 10:
                        facts.append(f"Visitor mentioned: {fact}")
                    break
            break  # Only extract one fact per turn to avoid noise

    return facts[:2]  # Cap at 2 facts per turn


async def _compress_to_episodic(session_id: str, user_id: str) -> None:
    """
    Compress working memory into an episodic summary using LLM.
    Stores the compressed episode in PostgreSQL.
    """
    from backend.memory.working import get_working_memory
    from backend.prompts.factory import prompt_factory

    messages = await get_working_memory(session_id)
    if not messages or len(messages) < 4:
        return

    # Generate compression prompt
    prompt = prompt_factory.build_memory_compression_prompt(messages)

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{settings.OLLAMA_URL}/api/generate",
                json={
                    "model": "llama3.2:3b",  # Fast model for compression
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3, "num_predict": 200},
                },
            )
            resp.raise_for_status()
            raw = resp.json().get("response", "").strip()

        # Parse the compression output
        try:
            data = json.loads(raw)
            summary = data.get("summary", raw)
            key_facts = data.get("key_facts", [])
            topics = data.get("topics", [])
        except json.JSONDecodeError:
            summary = raw
            key_facts = []
            topics = []

        # Store the episode (import here to avoid circular dep)
        from backend.db.session import async_session
        from backend.memory.episodic import store_episode

        async with async_session() as db:
            await store_episode(
                db=db,
                user_id=user_id,
                session_id=session_id,
                summary=summary,
                key_facts=key_facts,
                topics=topics,
            )

        logger.info(f"Episodic compression done: {len(summary)} char summary")

    except Exception as e:
        logger.error(f"Episodic compression failed: {e}")

"""
Semantic Long-Term Memory (Tier 3) — Qdrant-backed distilled user knowledge.
Stores high-level facts about returning visitors.
Updated daily via Celery batch job.
"""

import logging
from typing import Optional

from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance

from backend.config.settings import settings
from backend.rag.embedder import embedder

logger = logging.getLogger("portfolio.memory.semantic")

_client: Optional[QdrantClient] = None

COLLECTION = settings.QDRANT_COLLECTION_MEMORIES


def _get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(url=settings.QDRANT_URL)
        _ensure_collection()
    return _client


def _ensure_collection():
    """Create the user_memories collection if it doesn't exist."""
    client = _client
    try:
        collections = [c.name for c in client.get_collections().collections]
        if COLLECTION not in collections:
            client.create_collection(
                collection_name=COLLECTION,
                vectors_config=VectorParams(
                    size=settings.QDRANT_VECTOR_SIZE,
                    distance=Distance.COSINE,
                ),
            )
            logger.info(f"Created Qdrant collection: {COLLECTION}")
    except Exception as e:
        logger.error(f"Failed to ensure collection: {e}")


async def store_user_memory(user_id: str, fact: str, metadata: dict = None) -> None:
    """
    Store a distilled fact about a user in semantic memory.
    
    Example facts:
        "User works as a backend engineer"
        "User is interested in LangGraph and agentic systems"
    """
    try:
        embedding = await embedder.embed_text(fact)
        client = _get_client()
        
        import hashlib
        point_id = int(hashlib.sha256(f"{user_id}:{fact}".encode()).hexdigest()[:15], 16)
        
        client.upsert(
            collection_name=COLLECTION,
            points=[
                PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload={
                        "user_id": user_id,
                        "fact": fact,
                        "metadata": metadata or {},
                    },
                )
            ],
        )
        
        logger.debug(f"Stored semantic memory for user={user_id}: '{fact[:50]}...'")
        
    except Exception as e:
        logger.error(f"Semantic memory store error: {e}")


async def recall_user_memories(user_id: str, query: str, top_k: int = 3) -> list[str]:
    """
    Recall relevant facts about a user based on the current query.
    
    Returns:
        List of fact strings relevant to the query
    """
    try:
        embedding = await embedder.embed_query(query)
        client = _get_client()
        
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        
        results = client.search(
            collection_name=COLLECTION,
            query_vector=embedding,
            query_filter=Filter(
                must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
            ),
            limit=top_k,
        )
        
        facts = [hit.payload.get("fact", "") for hit in results if hit.score > 0.5]
        logger.debug(f"Recalled {len(facts)} semantic memories for user={user_id}")
        return facts
        
    except Exception as e:
        logger.error(f"Semantic memory recall error: {e}")
        return []

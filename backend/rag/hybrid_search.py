"""
Hybrid Search — Dense (Qdrant) + Sparse (BM25) retrieval.
Returns separate ranked lists for RRF fusion.
"""

import logging
from typing import Optional

from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from rank_bm25 import BM25Okapi

from backend.config.settings import settings
from backend.config.constants import RAG_CONFIG
from backend.rag.embedder import embedder
from backend.rag.hyde import hyde_embed

logger = logging.getLogger("portfolio.rag.hybrid_search")

# ── Qdrant Client (lazy singleton) ──
_qdrant_client: Optional[QdrantClient] = None


def _get_qdrant() -> QdrantClient:
    global _qdrant_client
    if _qdrant_client is None:
        _qdrant_client = QdrantClient(url=settings.QDRANT_URL)
    return _qdrant_client


# ── BM25 Index (rebuilt periodically) ──
_bm25_corpus: list[dict] = []
_bm25_index: Optional[BM25Okapi] = None


def rebuild_bm25_index(documents: list[dict]):
    """
    Rebuild the BM25 sparse index from a list of documents.
    Each document: {"chunk_id": str, "content": str, "source": str, ...}
    
    Should be called on startup and periodically via Celery.
    """
    global _bm25_corpus, _bm25_index
    
    _bm25_corpus = documents
    tokenized = [doc["content"].lower().split() for doc in documents]
    _bm25_index = BM25Okapi(tokenized)
    
    logger.info(f"BM25 index rebuilt with {len(documents)} documents")


async def dense_search(
    query_embedding: list[float],
    top_k: int = RAG_CONFIG["dense_top_k"],
    source_filter: Optional[str] = None,
) -> list[dict]:
    """
    Dense vector search via Qdrant.
    
    Returns:
        List of {"chunk_id", "content", "source", "source_type", "score", "rank"}
    """
    client = _get_qdrant()
    
    # Build optional filter
    query_filter = None
    if source_filter:
        query_filter = Filter(
            must=[FieldCondition(key="source_type", match=MatchValue(value=source_filter))]
        )
    
    try:
        results = client.search(
            collection_name=settings.QDRANT_COLLECTION_KNOWLEDGE,
            query_vector=query_embedding,
            limit=top_k,
            query_filter=query_filter,
            with_payload=True,
        )
        
        ranked = []
        for rank, hit in enumerate(results):
            payload = hit.payload or {}
            ranked.append({
                "chunk_id": payload.get("chunk_id", str(hit.id)),
                "content": payload.get("text", payload.get("content", "")),
                "source": payload.get("source", "unknown"),
                "source_type": payload.get("source_type", "document"),
                "entity_type": payload.get("entity_type", ""),
                "tags": payload.get("tags", []),
                "score": float(hit.score),
                "rank": rank + 1,
                "search_type": "dense",
            })
        
        logger.debug(f"Dense search returned {len(ranked)} results")
        return ranked
        
    except Exception as e:
        logger.error(f"Dense search error: {e}")
        return []


async def sparse_search(
    query: str,
    top_k: int = RAG_CONFIG["sparse_top_k"],
) -> list[dict]:
    """
    Sparse keyword search via BM25.
    
    Returns:
        List of {"chunk_id", "content", "source", "source_type", "score", "rank"}
    """
    global _bm25_index, _bm25_corpus
    
    if _bm25_index is None or not _bm25_corpus:
        logger.warning("BM25 index not initialized — sparse search skipped")
        return []
    
    tokenized_query = query.lower().split()
    scores = _bm25_index.get_scores(tokenized_query)
    
    # Get top-k indices sorted by score
    scored_indices = sorted(
        enumerate(scores), key=lambda x: x[1], reverse=True
    )[:top_k]
    
    ranked = []
    for rank, (idx, score) in enumerate(scored_indices):
        if score <= 0:
            continue
        doc = _bm25_corpus[idx]
        ranked.append({
            "chunk_id": doc.get("chunk_id", str(idx)),
            "content": doc.get("content", ""),
            "source": doc.get("source", "unknown"),
            "source_type": doc.get("source_type", "document"),
            "entity_type": doc.get("entity_type", ""),
            "tags": doc.get("tags", []),
            "score": float(score),
            "rank": rank + 1,
            "search_type": "sparse",
        })
    
    logger.debug(f"Sparse search returned {len(ranked)} results")
    return ranked


async def hybrid_search(
    query: str,
    use_hyde: bool = True,
    top_k: int = RAG_CONFIG["dense_top_k"],
    source_filter: Optional[str] = None,
) -> tuple[list[dict], list[dict]]:
    """
    Execute both dense and sparse search.
    
    Args:
        query: User's search query
        use_hyde: Whether to use HyDE for query expansion
        top_k: Number of results per search type
        source_filter: Optional filter by source_type
    
    Returns:
        (dense_results, sparse_results) — two ranked lists for RRF fusion
    """
    # 1. Get query embedding (with optional HyDE)
    if use_hyde:
        query_embedding = await hyde_embed(query)
    else:
        query_embedding = await embedder.embed_query(query)
    
    # 2. Run both searches concurrently
    import asyncio
    dense_results, sparse_results = await asyncio.gather(
        dense_search(query_embedding, top_k, source_filter),
        sparse_search(query, top_k),
    )
    
    logger.info(
        f"Hybrid search: dense={len(dense_results)}, sparse={len(sparse_results)}"
    )
    
    return dense_results, sparse_results

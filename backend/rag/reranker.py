"""
Cross-encoder reranker — reranks fused results using a cross-encoder model.
Uses sentence-transformers for high-quality relevance scoring.
"""

import logging
from typing import Optional

from backend.config.constants import RAG_CONFIG

logger = logging.getLogger("portfolio.rag.reranker")

# Lazy-loaded cross-encoder model
_reranker = None


def _get_reranker():
    """Lazy load the cross-encoder model (heavy, only load once)."""
    global _reranker
    if _reranker is None:
        try:
            from sentence_transformers import CrossEncoder
            model_name = RAG_CONFIG["reranker_model"]
            _reranker = CrossEncoder(model_name, max_length=512)
            logger.info(f"Cross-encoder loaded: {model_name}")
        except ImportError:
            logger.warning("sentence-transformers not installed — reranking disabled")
            return None
        except Exception as e:
            logger.error(f"Failed to load cross-encoder: {e}")
            return None
    return _reranker


def rerank(
    query: str,
    documents: list[dict],
    top_k: int = RAG_CONFIG["rerank_top_k"],
    diversity_limit: int = RAG_CONFIG["diversity_same_source_limit"],
) -> list[dict]:
    """
    Rerank documents using cross-encoder and apply diversity filtering.
    
    Args:
        query: The user's search query
        documents: List of fused search results (from RRF)
        top_k: Number of results to return after reranking
        diversity_limit: Max chunks from same source in top-3
    
    Returns:
        Top-k reranked documents with updated scores
    """
    if not documents:
        return []
    
    reranker = _get_reranker()
    
    if reranker is None:
        # Fallback: return top-k by existing score
        logger.info("Cross-encoder unavailable — using fused scores only")
        return documents[:top_k]
    
    # Score all query-document pairs
    pairs = [(query, doc["content"]) for doc in documents]
    
    try:
        scores = reranker.predict(pairs)
        
        # Attach reranker scores
        for doc, score in zip(documents, scores):
            doc["rerank_score"] = float(score)
            doc["pre_rerank_score"] = doc.get("score", 0.0)
            doc["score"] = float(score)
        
        # Sort by reranker score
        reranked = sorted(documents, key=lambda x: x["rerank_score"], reverse=True)
        
    except Exception as e:
        logger.error(f"Reranking failed: {e}")
        reranked = documents
    
    # Apply diversity filter: limit same source in top-3
    final = _apply_diversity(reranked, top_k, diversity_limit)
    
    # Re-assign ranks
    for i, doc in enumerate(final):
        doc["rank"] = i + 1
    
    logger.info(f"Reranked: {len(documents)} → {len(final)} results")
    return final


def _apply_diversity(
    documents: list[dict],
    top_k: int,
    diversity_limit: int,
) -> list[dict]:
    """
    Apply diversity filtering — no more than diversity_limit chunks
    from the same source in the top-3 positions.
    """
    result = []
    source_counts: dict[str, int] = {}
    
    for doc in documents:
        if len(result) >= top_k:
            break
        
        source = doc.get("source", "unknown")
        current_count = source_counts.get(source, 0)
        
        # In top-3 positions, enforce diversity limit
        if len(result) < 3 and current_count >= diversity_limit:
            continue
        
        result.append(doc)
        source_counts[source] = current_count + 1
    
    return result

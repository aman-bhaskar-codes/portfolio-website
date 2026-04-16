"""
Reciprocal Rank Fusion (RRF) — merges dense + sparse ranked lists.
"""

import logging
from backend.config.constants import RAG_CONFIG

logger = logging.getLogger("portfolio.rag.fusion")


def reciprocal_rank_fusion(
    *ranked_lists: list[dict],
    k: int = RAG_CONFIG["rrf_k"],
) -> list[dict]:
    """
    Merge multiple ranked lists using Reciprocal Rank Fusion.
    
    Formula: score(doc) = Σ 1 / (k + rank_i)
    
    Args:
        ranked_lists: Variable number of ranked result lists
        k: RRF constant (default 60, higher = more weight to lower ranks)
    
    Returns:
        Merged and re-ranked list sorted by fused score
    """
    fused_scores: dict[str, float] = {}
    doc_data: dict[str, dict] = {}
    
    for ranked_list in ranked_lists:
        for item in ranked_list:
            chunk_id = item["chunk_id"]
            rank = item.get("rank", 1)
            
            # RRF score contribution from this list
            rrf_score = 1.0 / (k + rank)
            fused_scores[chunk_id] = fused_scores.get(chunk_id, 0.0) + rrf_score
            
            # Keep the best version of the document data
            if chunk_id not in doc_data or item.get("score", 0) > doc_data[chunk_id].get("score", 0):
                doc_data[chunk_id] = item
    
    # Build fused results sorted by RRF score
    fused_results = []
    for chunk_id, fused_score in sorted(fused_scores.items(), key=lambda x: x[1], reverse=True):
        doc = doc_data[chunk_id].copy()
        doc["fused_score"] = fused_score
        doc["original_score"] = doc.get("score", 0.0)
        doc["score"] = fused_score  # Replace with fused score for downstream
        fused_results.append(doc)
    
    # Re-assign ranks
    for i, doc in enumerate(fused_results):
        doc["rank"] = i + 1
        doc["search_type"] = "fused"
    
    logger.info(f"RRF fusion: {len(fused_results)} unique documents from {len(ranked_lists)} lists")
    return fused_results

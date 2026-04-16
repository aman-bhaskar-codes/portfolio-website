"""
RAG Agent — retrieves and synthesizes knowledge from the portfolio corpus.
Uses hybrid search (HyDE + dense + BM25 + RRF + cross-encoder).
Model: phi4-mini for synthesis.
"""

import logging

from backend.agents.state import AgentState
from backend.rag.hybrid_search import hybrid_search
from backend.rag.fusion import reciprocal_rank_fusion
from backend.rag.reranker import rerank
from backend.config.constants import RAG_CONFIG

logger = logging.getLogger("portfolio.agents.rag")


async def rag_agent_node(state: AgentState) -> AgentState:
    """
    LangGraph node: retrieve relevant knowledge and prepare context.
    
    Pipeline:
        1. HyDE query expansion → embedding
        2. Dense search (Qdrant) + Sparse search (BM25)
        3. RRF fusion (merge ranked lists)
        4. Cross-encoder reranking (top-20 → top-5)
        5. Format chunks with citations
    
    Writes to state:
        - retrieved_chunks: list of top-k reranked chunks
        - hyde_used: whether HyDE was used
        - citations: source citations from retrieved chunks
    """
    query = state["query"]
    
    try:
        # 1-2. Hybrid search (HyDE + dense + sparse)
        dense_results, sparse_results = await hybrid_search(
            query=query,
            use_hyde=True,
            top_k=RAG_CONFIG["dense_top_k"],
        )
        
        state["hyde_used"] = True
        
        # 3. RRF Fusion
        fused = reciprocal_rank_fusion(dense_results, sparse_results)
        
        # 4. Cross-encoder reranking
        top_k = RAG_CONFIG["rerank_top_k"]
        reranked = rerank(
            query=query,
            documents=fused[:20],  # Send top-20 to reranker
            top_k=top_k,
        )
        
        # 5. Store results in state
        state["retrieved_chunks"] = reranked
        state["citations"] = list(set(
            chunk.get("source", "unknown") for chunk in reranked
        ))
        
        logger.info(
            f"RAG agent: retrieved {len(reranked)} chunks from "
            f"{len(dense_results)} dense + {len(sparse_results)} sparse results"
        )
        
    except Exception as e:
        logger.error(f"RAG agent error: {e}")
        state["retrieved_chunks"] = []
        state["citations"] = []
        state["error"] = f"RAG retrieval failed: {str(e)[:100]}"
    
    return state

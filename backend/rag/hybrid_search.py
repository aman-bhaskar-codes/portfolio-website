"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Hybrid Search Engine (§10)
═══════════════════════════════════════════════════════════

Full retrieval pipeline:
  1. HyDE query expansion
  2. Dense retrieval (Qdrant)
  3. Sparse retrieval (BM25)
  4. RRF fusion
  5. ColBERT/cross-encoder reranking
  6. Freshness scoring

Every RAG query flows through this engine.
"""

from __future__ import annotations

import logging
from typing import Any

import numpy as np

logger = logging.getLogger("portfolio.rag.hybrid_search")


class HybridSearchEngine:
    """
    Two-stage retrieval with fusion and reranking.
    
    Stage 1: Parallel dense (Qdrant) + sparse (BM25)
    Stage 2: RRF fusion → ColBERT rerank → freshness adjust
    """

    def __init__(
        self,
        ollama_client: Any,
        qdrant_client: Any | None = None,
        embed_model: str = "nomic-embed-text",
        collection_name: str = "portfolio_knowledge",
    ):
        self._ollama = ollama_client
        self._qdrant = qdrant_client
        self._embed_model = embed_model
        self._collection = collection_name

        # BM25 index (built during ingestion)
        self._bm25_index: Any | None = None
        self._bm25_docs: list[dict[str, Any]] = []

        # Lazy-loaded components
        self._hyde: Any | None = None
        self._colbert: Any | None = None
        self._freshness: Any | None = None

    def set_qdrant_client(self, client: Any) -> None:
        """Set Qdrant client (for deferred initialization)."""
        self._qdrant = client

    def build_bm25_index(self, documents: list[dict[str, Any]]) -> None:
        """Build BM25 sparse index from ingested documents."""
        try:
            from rank_bm25 import BM25Okapi

            self._bm25_docs = documents
            tokenized = [
                doc.get("content", "").lower().split()
                for doc in documents
            ]
            self._bm25_index = BM25Okapi(tokenized)
            logger.info(f"BM25 index built with {len(documents)} documents")
        except ImportError:
            logger.warning("rank-bm25 not installed, sparse search disabled")
        except Exception as e:
            logger.warning(f"BM25 index build failed: {e}")

    async def search(
        self,
        query: str,
        persona: str = "casual",
        top_k: int = 5,
        use_hyde: bool = True,
        use_colbert: bool = True,
        use_freshness: bool = True,
    ) -> list[dict[str, Any]]:
        """
        Full hybrid search pipeline.
        
        Args:
            query: User's question
            persona: Visitor persona (for future persona-aware retrieval)
            top_k: Number of results to return
            use_hyde: Enable HyDE query expansion
            use_colbert: Enable ColBERT reranking
            use_freshness: Enable freshness scoring
            
        Returns:
            List of top-k chunks with scores
        """
        # Step 1: HyDE expansion
        search_query = query
        if use_hyde:
            search_query = await self._hyde_expand(query)

        # Step 2: Embed the query
        query_vector = await self._embed(search_query)

        # Step 3: Dense retrieval (Qdrant) — top 20 candidates
        dense_results = await self._dense_search(query_vector, limit=20)

        # Step 4: Sparse retrieval (BM25) — top 20 candidates
        sparse_results = self._sparse_search(query, top_k=20)

        # Step 5: RRF Fusion
        fused = self._rrf_fusion(dense_results, sparse_results)

        if not fused:
            logger.debug(f"No results found for query: {query[:50]}")
            return []

        # Step 6: ColBERT reranking (if enabled)
        if use_colbert and len(fused) > top_k:
            fused = await self._colbert_rerank(query, fused, top_k=top_k)
        else:
            fused = fused[:top_k]

        # Step 7: Freshness adjustment
        if use_freshness:
            fused = self._apply_freshness(fused)

        return fused

    async def _hyde_expand(self, query: str) -> str:
        """Generate hypothetical document for better embedding."""
        if self._hyde is None:
            try:
                from backend.rag.hyde import HyDEExpander
                self._hyde = HyDEExpander(self._ollama)
            except ImportError:
                return query

        try:
            return await self._hyde.expand(query)
        except Exception:
            return query

    async def _embed(self, text: str) -> list[float]:
        """Generate embedding vector."""
        return await self._ollama.embed(self._embed_model, text)

    async def _dense_search(
        self, vector: list[float], limit: int = 20
    ) -> list[dict[str, Any]]:
        """Search Qdrant with dense vector."""
        if self._qdrant is None:
            return []

        try:
            results = await self._qdrant.search(
                collection_name=self._collection,
                query_vector=vector,
                limit=limit,
                with_payload=True,
            )
            return [
                {
                    "id": str(hit.id),
                    "score": float(hit.score),
                    "content": hit.payload.get("content", ""),
                    "metadata": {
                        k: v for k, v in hit.payload.items()
                        if k != "content"
                    },
                    "source": "dense",
                }
                for hit in results
            ]
        except Exception as e:
            logger.warning(f"Dense search failed: {e}")
            return []

    def _sparse_search(
        self, query: str, top_k: int = 20
    ) -> list[dict[str, Any]]:
        """BM25 sparse search."""
        if self._bm25_index is None or not self._bm25_docs:
            return []

        try:
            query_tokens = query.lower().split()
            scores = self._bm25_index.get_scores(query_tokens)
            top_indices = np.argsort(scores)[::-1][:top_k]

            return [
                {
                    "id": f"bm25_{i}",
                    "score": float(scores[i]),
                    "content": self._bm25_docs[i].get("content", ""),
                    "metadata": self._bm25_docs[i].get("metadata", {}),
                    "source": "sparse",
                }
                for i in top_indices
                if scores[i] > 0
            ]
        except Exception as e:
            logger.debug(f"BM25 search failed: {e}")
            return []

    def _rrf_fusion(
        self,
        dense: list[dict[str, Any]],
        sparse: list[dict[str, Any]],
        k: int = 60,
    ) -> list[dict[str, Any]]:
        """
        Reciprocal Rank Fusion: combines dense and sparse results.
        Score = sum(1 / (k + rank)) across both lists.
        """
        scores: dict[str, dict[str, Any]] = {}

        for rank, doc in enumerate(dense):
            doc_id = doc["id"]
            scores[doc_id] = {"score": 0.0, "doc": doc}
            scores[doc_id]["score"] += 1.0 / (k + rank + 1)

        for rank, doc in enumerate(sparse):
            doc_id = doc["id"]
            if doc_id not in scores:
                scores[doc_id] = {"score": 0.0, "doc": doc}
            scores[doc_id]["score"] += 1.0 / (k + rank + 1)

        sorted_docs = sorted(
            scores.values(), key=lambda x: x["score"], reverse=True
        )
        return [item["doc"] for item in sorted_docs]

    async def _colbert_rerank(
        self,
        query: str,
        candidates: list[dict[str, Any]],
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        """ColBERT late-interaction reranking."""
        if self._colbert is None:
            try:
                from backend.rag.colbert_retriever import ColBERTRetriever
                self._colbert = ColBERTRetriever()
            except ImportError:
                logger.debug("ColBERT not available, skipping rerank")
                return candidates[:top_k]

        try:
            texts = [c.get("content", "") for c in candidates]
            reranked_indices = await self._colbert.rerank(
                query=query,
                documents=texts,
                top_k=top_k,
            )
            return [candidates[i] for i in reranked_indices if i < len(candidates)]
        except Exception as e:
            logger.debug(f"ColBERT rerank failed, using RRF order: {e}")
            return candidates[:top_k]

    def _apply_freshness(
        self, chunks: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Apply freshness scoring to re-order chunks."""
        if self._freshness is None:
            try:
                from backend.rag.freshness import freshness_scorer
                self._freshness = freshness_scorer
            except ImportError:
                return chunks

        try:
            scores = [c.get("score", 1.0) for c in chunks]
            return self._freshness.rerank_by_freshness(
                chunks, scores, freshness_weight=0.2
            )
        except Exception:
            return chunks


# Test function (used by: make debug-rag)
async def test_search() -> None:
    """Quick self-test for the hybrid search engine."""
    from backend.llm.ollama_client import ollama_client

    engine = HybridSearchEngine(ollama_client=ollama_client)
    print("═══ Hybrid Search Engine Test ═══")

    # Test embedding
    try:
        vec = await ollama_client.embed("nomic-embed-text", "test query")
        print(f"✅ Embedding works: {len(vec)}-dim vector")
    except Exception as e:
        print(f"❌ Embedding failed: {e}")
        return

    # Test search (will return empty without Qdrant but shouldn't crash)
    try:
        results = await engine.search(
            "Tell me about your best AI project",
            use_hyde=False,
            use_colbert=False,
        )
        print(f"✅ Search returned {len(results)} results")
    except Exception as e:
        print(f"❌ Search failed: {e}")

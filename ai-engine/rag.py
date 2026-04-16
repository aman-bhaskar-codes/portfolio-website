
try:
    from sentence_transformers import SentenceTransformer
    from qdrant_client import QdrantClient
except ImportError:
    # Mock for environment where libs aren't installed yet
    class SentenceTransformer:
        def __init__(self, model): pass
        def encode(self, text): return [0.1] * 384
    class QdrantClient:
        def __init__(self, host, port): pass
        def search(self, **kwargs): return []

import logging

logger = logging.getLogger("ai-engine")

# Initialize Resources (Singleton Pattern)
# In prod, move these to a startup event
embedder = SentenceTransformer("all-MiniLM-L6-v2")
import os
qdrant_host = os.getenv("QDRANT_HOST", "localhost")
qdrant = QdrantClient(qdrant_host, port=6333)

async def retrieve_chunks(query: str, top_k=5):
    """
    Retrieves semantic chunks from Vector DB.
    """
    try:
        # 1. Embed Query
        vector = embedder.encode(query).tolist()

        # 2. Search Qdrant
        results = qdrant.search(
            collection_name="portfolio",
            query_vector=vector,
            limit=top_k
        )
        
        # 3. Format Results
        chunks = [r.payload["text"] for r in results]
        logger.info(f"Retrieved {len(chunks)} chunks for query: {query}")
        return chunks

    except Exception as e:
        logger.error(f"RAG Retrieval Failed: {e}")
        return [] # Fail safe to empty list

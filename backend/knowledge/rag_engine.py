from backend.llm.embedder import embedder
from backend.retrieval.hybrid_search import hybrid_search

async def retrieve(db, query: str):
    # Asynchronously get real embeddings
    emb = await embedder.embed_query(query)
    
    # Hybrid search uses both pgvector and keyword matches
    rows = await hybrid_search(
        db,
        emb,
        query,
        ["website", "identity", "project"]
    )
    
    if not rows:
        return [], 0.0
        
    scores = [r.get('similarity', 0) for r in rows]
    confidence = sum(scores) / len(scores) if scores else 0.0
    
    return rows, confidence

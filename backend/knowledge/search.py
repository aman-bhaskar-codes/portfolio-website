from backend.router.intent_router import detect_intent
from backend.router.category_router import categories_for_intent
from backend.llm.embedder import embedder
from backend.retrieval.hybrid_search import hybrid_search
from backend.ranking.scorer import sort_rows
from backend.ranking.reranker import rerank
from backend.context.token_budget import select_chunks

async def knowledge_search(db, query):
    intent = detect_intent(query)
    cats = categories_for_intent(intent)
    emb = await embedder.embed_query(query)
    rows = await hybrid_search(db, emb, query, cats)
    rows = sort_rows(rows)
    rows = rerank(rows, query)
    
    if not rows:
        return [], 0.0
    
    avg_score = sum(r.get('similarity', 0) for r in rows) / len(rows)
    return rows, avg_score

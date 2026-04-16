from backend.rag.retriever import search_multi
from backend.retrieval.keyword_search import keyword_search

async def hybrid_search(db, embedding: list[float], query: str, categories: list[str]):
    # Async Vector Search
    v = await search_multi(
        db,
        embedding,
        categories,
        limit=8,
    )

    # Async Exact Text Keyword DB scan
    k = await keyword_search(
        db,
        query,
        limit=4,
    )

    # Merge outputs avoiding duplicates
    seen = set()
    merged = []
    
    for row in (list(v) + list(k)):
        # Extract row identifier, assuming uuid string 'id'
        row_id = str(row.get('id', ''))
        if row_id not in seen:
            seen.add(row_id)
            # Ensure keyword matches have a similarity score
            # Vector matches already have this from the SQL query
            row_dict = dict(row)
            if 'similarity' not in row_dict:
                row_dict['similarity'] = 0.8
            merged.append(row_dict)

    return merged

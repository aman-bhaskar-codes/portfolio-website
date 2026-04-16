from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def retrieve_memory(db: AsyncSession, embedding: list[float], limit: int = 3):
    """Note: This supersedes/wraps the logic in rag/memory_merge.py for consistency"""
    sql = text("""
    SELECT *,
    (1 - (embedding <=> CAST(:embedding AS vector))) AS similarity
    FROM conversation_memory
    ORDER BY embedding <=> CAST(:embedding AS vector)
    LIMIT :limit
    """)

    emb_str = str(embedding).replace(" ", "")
    result = await db.execute(sql, {"embedding": emb_str, "limit": limit})
    
    return result.mappings().all()

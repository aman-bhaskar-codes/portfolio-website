from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def keyword_search(db: AsyncSession, query: str, limit: int = 5):
    sql = text("""
    SELECT *,
    0.0 AS similarity
    FROM knowledge_base
    WHERE content ILIKE :q
    LIMIT :limit
    """)

    result = await db.execute(
        sql,
        {
            "q": f"%{query}%",
            "limit": limit,
        },
    )

    return result.mappings().all()

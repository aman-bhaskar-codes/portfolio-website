from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def search_multi(db: AsyncSession, embedding: list[float], categories: list[str], limit: int = 6):
    sql = text("""
    SELECT *,
    (1 - (embedding <=> CAST(:embedding AS vector))) AS similarity
    FROM knowledge_base
    WHERE category = ANY(:categories)
    ORDER BY embedding <=> CAST(:embedding AS vector)
    LIMIT :limit
    """)

    # SQLAlchemy + asyncpg expects string formatted vector for raw text queries 
    # if not using the ORM Vector scalar
    emb_str = str(embedding).replace(" ", "")

    result = await db.execute(
        sql,
        {
            "embedding": emb_str,
            "categories": categories,
            "limit": limit,
        },
    )

    return result.mappings().all()

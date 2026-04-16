from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def clean_memory(db: AsyncSession, max_rows: int = 500):
    sql = text("""
    DELETE FROM conversation_memory
    WHERE id NOT IN (
        SELECT id
        FROM conversation_memory
        ORDER BY created_at DESC
        LIMIT :max_rows
    )
    """)

    await db.execute(sql, {"max_rows": max_rows})
    await db.commit()

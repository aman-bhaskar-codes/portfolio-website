from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.models import AssistantMemory
from backend.llm.embedder import embedder

async def store_memory(db: AsyncSession, text: str, importance: float):
    emb = await embedder.embed_query(text)

    row = AssistantMemory(
        content=text,
        embedding=emb,
        importance=importance,
    )

    db.add(row)
    await db.commit()

from backend.db.session import AsyncSessionLocal
from backend.db.models import Knowledge

from backend.llm.embedder import embedder


async def store_chunks(chunks: list, category: str, title: str, source: str, subcategory: str = None):

    async with AsyncSessionLocal() as db:
        for c in chunks:

            # Using our actual integrated async embedder
            emb = await embedder.embed_query(c)

            row = Knowledge(
                category=category,
                subcategory=subcategory,
                title=title,
                content=c,
                embedding=emb,
                source=source,
            )

            db.add(row)

        await db.commit()

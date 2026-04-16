from backend.ingestion.chunker import chunk_text
from backend.ingestion.cleaner import clean_text
from backend.ingestion.embed_store import store_chunks


async def load_identity(path, category):

    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
        
    text = clean_text(text)
    chunks = chunk_text(text)

    await store_chunks(
        chunks,
        category=category,
        title=path,
        source="identity",
    )

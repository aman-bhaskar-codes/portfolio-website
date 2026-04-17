# backend/scripts/seed_all.py
"""
Run with: docker exec antigravity-api python -m scripts.seed_all
Ingests all documents from /data/ into the RAG knowledge base.
"""
import asyncio
import logging
from pathlib import Path
from backend.db.connections import init_connections, close_connections

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATA_PATHS = [
    "/data/documents/",
    "/data/virtual_work/",
    "data/documents/",       # Local dev fallback
    "data/virtual_work/",
]


async def seed_all():
    logger.info("Starting data seeding...")
    await init_connections()

    from backend.rag.ingestor import Ingestor, Document
    ingestor = Ingestor()
    total_chunks = 0

    for base_path in DATA_PATHS:
        path = Path(base_path)
        if not path.exists():
            continue

        for ext in ["*.md", "*.txt", "*.pdf"]:
            for file in path.rglob(ext):
                try:
                    chunks = await ingestor.ingest_file(str(file))
                    total_chunks += chunks
                    logger.info(f"Ingested {file.name}: {chunks} chunks")
                except Exception as e:
                    logger.error(f"Failed to ingest {file.name}: {e}")

    logger.info(f"✅ Seeding complete: {total_chunks} total chunks ingested")
    await close_connections()


if __name__ == "__main__":
    asyncio.run(seed_all())

# backend/db/init_qdrant.py
"""
Ensures all Qdrant collections exist on startup.
"""
import logging
from qdrant_client.models import Distance, VectorParams, OptimizersConfigDiff
from backend.db.connections import get_qdrant
from backend.config.settings import settings

logger = logging.getLogger(__name__)

COLLECTIONS = {
    settings.QDRANT_COLLECTION_KNOWLEDGE: {
        "size": 768,
        "distance": Distance.COSINE,
    },
    "github_semantic": {
        "size": 768,
        "distance": Distance.COSINE,
    },
    settings.QDRANT_COLLECTION_MEMORIES: {
        "size": 768,
        "distance": Distance.COSINE,
    },
}


async def ensure_collections():
    """Create Qdrant collections if they don't exist."""
    try:
        client = get_qdrant()
    except RuntimeError:
        logger.warning("⚠️ Qdrant not connected, skipping collection setup")
        return

    existing = {c.name for c in (await client.get_collections()).collections}

    for name, config in COLLECTIONS.items():
        if name not in existing:
            await client.create_collection(
                collection_name=name,
                vectors_config=VectorParams(
                    size=config["size"],
                    distance=config["distance"],
                ),
                optimizers_config=OptimizersConfigDiff(
                    indexing_threshold=0,
                ),
            )
            logger.info(f"Created Qdrant collection: {name}")
        else:
            logger.info(f"Qdrant collection exists: {name}")

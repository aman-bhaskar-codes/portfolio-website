from typing import List, Type, Sequence, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.base import Base

async def get_similar_nodes(
    session: AsyncSession, 
    model: Type[Base], 
    query_embedding: List[float], 
    limit: int = 5,
    threshold: float = 0.5
) -> List[Any]:
    """Retrieve semantically similar nodes using cosine distance.
    Returns objects with a dynamically attached `_similarity_score`."""
    
    # We created IVFFlat indexes with `vector_cosine_ops`.
    # Cosine distance = 1 - Cosine similarity.
    distance_expr = model.embedding.cosine_distance(query_embedding).label("distance")
    
    stmt = (
        select(model, distance_expr)
        .filter(model.embedding.cosine_distance(query_embedding) < (1.0 - threshold))
        .order_by(distance_expr)
        .limit(limit)
    )
    result = await session.execute(stmt)
    
    nodes = []
    for row in result:
        node = row[0]
        distance = row[1]
        node._similarity_score = 1.0 - distance
        nodes.append(node)
        
    return nodes

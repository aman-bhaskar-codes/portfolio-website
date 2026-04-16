from typing import List, Type, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.db.base import Base

async def get_filtered_nodes(
    session: AsyncSession, 
    model: Type[Base],
    category_filter: str = None,
    # Example for recency threshold
    min_recency: float = None,
    limit: int = 20
) -> List[Any]:
    """Retrieve nodes based on exact metadata or scalar filters (like category)."""
    
    stmt = select(model)
    
    if hasattr(model, 'category') and category_filter:
        stmt = stmt.filter(model.category == category_filter)
        
    if hasattr(model, 'recency') and min_recency is not None:
        stmt = stmt.filter(model.recency >= min_recency)
        
    stmt = stmt.limit(limit)
    result = await session.execute(stmt)
    return result.scalars().all()

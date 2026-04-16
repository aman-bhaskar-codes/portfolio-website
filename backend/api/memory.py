from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.db.session import get_db
from backend.db.models import AssistantMemory

router = APIRouter()

@router.get("/")
async def list_recent_memories(db: AsyncSession = Depends(get_db), limit: int = 10):
    """Retrieve the recent long-term compressed memory states."""
    stmt = select(AssistantMemory).order_by(AssistantMemory.created_at.desc()).limit(limit)
    res = await db.execute(stmt)
    
    return {
        "memories": [
            {"id": str(m.id), "content": m.content, "created_at": m.created_at}
            for m in res.scalars()
        ]
    }

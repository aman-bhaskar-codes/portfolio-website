from sqlalchemy.ext.asyncio import AsyncSession
from backend.memory.memory_summarizer import summarize_memory
from backend.memory.importance_scorer import score_importance
from backend.memory.memory_store import store_memory

async def process_memory(db: AsyncSession, user: str, assistant: str, mode: str):
    if mode != "assistant":
        return

    summary = await summarize_memory(user, assistant)

    importance = score_importance(summary)

    # We only store memories that are deemed fairly important
    if importance < 0.4:
        return

    await store_memory(db, summary, importance)

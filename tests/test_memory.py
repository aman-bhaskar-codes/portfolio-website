# tests/test_memory.py
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))


@pytest.mark.asyncio
async def test_working_memory_operations():
    """Working memory must handle write/read/clear without crashing."""
    try:
        from backend.db.connections import init_connections, get_redis
        from backend.memory.working_memory import WorkingMemory

        await init_connections()
        redis = get_redis()
        memory = WorkingMemory(redis)

        sid = "test-memory-session"
        await memory.append(sid, "user", "Hello")
        await memory.append(sid, "assistant", "Hi!")

        turns = await memory.get(sid)
        assert len(turns) == 2
        assert turns[0]["role"] == "user"
        assert turns[1]["role"] == "assistant"

        await memory.clear(sid)
        turns = await memory.get(sid)
        assert len(turns) == 0
    except RuntimeError:
        pytest.skip("Redis not available")

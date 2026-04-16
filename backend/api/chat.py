"""
Chat API — SSE streaming endpoint powered by LangGraph agent pipeline.

Flow:
    1. Receive ChatRequest
    2. Run memory_manager_node (pre-read context)
    3. Run router_agent_node (classify intent)
    4. Run specialist agent (rag/social/code based on intent)
    5. Stream response tokens via SSE using response_synthesizer
    6. Fire-and-forget memory write after streaming completes

Each SSE event is a JSON line:
    data: {"token":"...", "done":false, "intent":"...", "model_used":"..."}
"""

import json
import time
import logging
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from backend.models.schemas import ChatRequest
from backend.agents.state import AgentState
from backend.agents.router_agent import router_agent_node
from backend.agents.rag_agent import rag_agent_node
from backend.agents.social_agent import social_agent_node
from backend.agents.code_agent import code_agent_node
from backend.agents.memory_manager import memory_manager_node, write_memories
from backend.agents.response_synthesizer import generate_streaming_response
from backend.config.constants import RAG_INTENTS, SOCIAL_INTENTS, CODE_INTENTS

router = APIRouter()
logger = logging.getLogger("portfolio.api.chat")


async def _run_pipeline_streaming(request: ChatRequest) -> AsyncGenerator[str, None]:
    """
    Execute the full agent pipeline with SSE token streaming.

    Instead of using graph.ainvoke() (which waits for full response),
    we manually step through the nodes so we can stream the final
    synthesizer output token-by-token.
    """
    start_time = time.time()

    # ── Initialize state ──
    state: AgentState = {
        "query": request.query,
        "session_id": request.session_id,
        "user_id": request.user_id,
        "conversation_id": request.conversation_id or str(uuid.uuid4())[:8],
        "deep_dive": request.deep_dive,
        "model_override": request.model_override,
        "conversation_history": [],
        "retrieved_chunks": [],
        "memory_context": "",
        "turn_count": 0,
        "recent_topics": [],
        "social_data": {},
        "code_output": "",
        "response": "",
        "citations": [],
        "error": None,
    }

    # ── Step 1: Memory Read (pre-load context) ──
    try:
        state = await memory_manager_node(state)
        logger.debug(f"Memory loaded: turn_count={state.get('turn_count', 0)}")
    except Exception as e:
        logger.error(f"Memory read failed (non-fatal): {e}")

    # ── Step 2: Router (intent classification) ──
    try:
        state = await router_agent_node(state)
        intent = state.get("intent", "small_talk")
        logger.info(f"Router: intent={intent}, confidence={state.get('confidence', 0):.2f}")
    except Exception as e:
        logger.error(f"Router failed: {e}")
        state["intent"] = "small_talk"
        intent = "small_talk"

    # ── Step 3: Specialist Agent (based on intent) ──
    try:
        if intent in RAG_INTENTS:
            state = await rag_agent_node(state)
            logger.info(f"RAG agent: {len(state.get('retrieved_chunks', []))} chunks retrieved")
        elif intent in SOCIAL_INTENTS:
            state = await social_agent_node(state)
            logger.info(f"Social agent: fetched {list(state.get('social_data', {}).keys())}")
        elif intent in CODE_INTENTS:
            state = await code_agent_node(state)
            logger.info(f"Code agent: {len(state.get('code_output', ''))} chars output")
        # small_talk / out_of_scope → skip specialist, go direct to synthesizer
    except Exception as e:
        logger.error(f"Specialist agent failed: {e}")
        state["error"] = str(e)

    # ── Step 4: Stream response ──
    async for chunk_json in generate_streaming_response(state):
        yield f"data: {chunk_json}\n\n"

    # ── Step 5: Write memories (fire-and-forget) ──
    import asyncio
    try:
        asyncio.create_task(write_memories(state))
    except Exception as e:
        logger.error(f"Memory write scheduling failed: {e}")

    # ── Final: log pipeline stats ──
    total_ms = int((time.time() - start_time) * 1000)
    logger.info(
        f"Pipeline complete: intent={intent}, model={state.get('model_used', '?')}, "
        f"total_latency={total_ms}ms"
    )


@router.post("/")
async def chat(request: ChatRequest):
    """
    Main chat endpoint — SSE streaming.

    Usage from frontend:
        const response = await fetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ query: '...', session_id: '...' }),
        });
        const reader = response.body.getReader();
        // Read SSE events...

    Each SSE event:
        data: {"token":"Hello","done":false}
        data: {"token":" world","done":false}
        data: {"token":"","done":true,"latency_ms":420,"citations":["github/repo"]}
    """
    logger.info(
        f"Chat request: query='{request.query[:80]}', "
        f"user={request.user_id}, session={request.session_id}"
    )

    return StreamingResponse(
        _run_pipeline_streaming(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering for SSE
        },
    )


@router.post("/stop")
async def stop_generation():
    """Stop current generation. Placeholder for interrupt signaling."""
    return {"status": "stop signal sent"}

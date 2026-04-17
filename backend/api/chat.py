# backend/api/chat.py
"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — SSE Chat Endpoint
═══════════════════════════════════════════════════════════

POST /api/chat → Server-Sent Events streaming response.
"""
import json
import logging
import uuid
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.config.settings import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    message: str = Field(..., max_length=2000)
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))


async def generate_sse_stream(request: ChatRequest, visitor_info: dict):
    """Generator that yields SSE-formatted tokens."""
    from backend.agents.graph import get_compiled_graph, get_fallback_pipeline

    graph = get_compiled_graph()

    # Use fallback if LangGraph unavailable
    if graph is None:
        graph = get_fallback_pipeline()

    # Load conversation history from working memory
    history = []
    try:
        from backend.db.connections import get_redis
        from backend.memory.working_memory import WorkingMemory
        redis = get_redis()
        memory = WorkingMemory(redis)
        history = await memory.get(request.session_id)
    except Exception as e:
        logger.warning(f"Could not load working memory: {e}")

    # Build initial state
    state = {
        "session_id": request.session_id,
        "user_id": None,
        "message": request.message,
        "visitor_persona": visitor_info.get("persona", "casual"),
        "company_context": visitor_info.get("company"),
        "visit_count": visitor_info.get("visit_count", 1),
        "working_memory": history,
        "episodic_summary": "",
        "stream_tokens": [],
    }

    try:
        full_response = ""
        async for chunk in graph.astream(state):
            for node_name, node_output in chunk.items():
                if "stream_tokens" in node_output:
                    for token in node_output["stream_tokens"]:
                        full_response += token
                        yield f"data: {json.dumps({'token': token})}\n\n"

                if "cited_sources" in node_output and node_output["cited_sources"]:
                    yield f"data: {json.dumps({'sources': node_output['cited_sources']})}\n\n"

        # If no tokens streamed, send final response
        if not full_response:
            final = state.get("final_response", "I couldn't generate a response. Try again?")
            yield f"data: {json.dumps({'token': final})}\n\n"
            full_response = final

        yield "data: [DONE]\n\n"

        # Save to working memory after streaming complete
        try:
            from backend.db.connections import get_redis
            from backend.memory.working_memory import WorkingMemory
            redis = get_redis()
            memory = WorkingMemory(redis)
            await memory.append(request.session_id, "user", request.message)
            await memory.append(request.session_id, "assistant", full_response)
        except Exception as e:
            logger.warning(f"Could not save to working memory: {e}")

    except Exception as e:
        logger.error(f"Chat stream error: {e}", exc_info=True)
        yield f"data: {json.dumps({'token': 'I ran into an issue. Please try again.'})}\n\n"
        yield "data: [DONE]\n\n"


@router.post("/chat")
async def chat_endpoint(request: ChatRequest, http_request: Request):
    """SSE streaming chat endpoint."""

    # Security: injection check
    try:
        from backend.security.injection_detector import scan_message
        scan = scan_message(request.message)
        if scan["severity"] == "critical":
            raise HTTPException(status_code=400, detail="Invalid input")
    except ImportError:
        pass  # Security module not available, proceed

    # Visitor classification
    visitor_info = {"persona": "casual", "visit_count": 1}
    try:
        from backend.intelligence.visitor_classifier import classify_visitor
        visitor_info = await classify_visitor(
            session_id=request.session_id,
            referrer=http_request.headers.get("referer", ""),
            ip=http_request.client.host if http_request.client else "",
            user_agent=http_request.headers.get("user-agent", ""),
        )
    except Exception as e:
        logger.debug(f"Visitor classification skipped: {e}")

    return StreamingResponse(
        generate_sse_stream(request, visitor_info),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )

"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Chat SSE API (§13)
═══════════════════════════════════════════════════════════

Main endpoint for the chat widget.
Runs the LangGraph master graph and streams tokens back via Server-Sent Events.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.agents.graph import run_agent

logger = logging.getLogger("portfolio.api.chat")

router = APIRouter(prefix="/api/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: str
    visitor_persona: str = "casual"
    company_context: str | None = None
    visit_count: int = 1


async def stream_agent_response(request: Request, payload: ChatRequest) -> Any:
    """Generator for Server-Sent Events streaming."""
    # Start graph execution in background task (for real implementation with LangGraph streaming)
    # For now, we simulate the token stream from the final_response.
    
    try:
        # Run agent graph
        result = await run_agent(
            message=payload.message,
            session_id=payload.session_id,
            visitor_persona=payload.visitor_persona,
            company_context=payload.company_context,
            visit_count=payload.visit_count,
        )

        final_response = result.get("final_response", "I'm sorry, I couldn't process that.")
        sources = result.get("cited_sources", [])

        # Send intent/metadata event first (useful for UI debugging/animations)
        meta_event = {
            "intent": result.get("intent", "unknown"),
            "conversion_action": result.get("conversion_action", "none")
        }
        yield f"data: {json.dumps(meta_event)}\n\n"

        # Stream tokens (simulated here — in production, tap into LangGraph streaming)
        # We chunk the response to simulate streaming if the LLM didn't stream directly.
        # If ollama client streaming is integrated to the graph, we'd yield tokens directly.
        words = final_response.split(" ")
        for i, word in enumerate(words):
            if await request.is_disconnected():
                logger.info(f"Client disconnected during stream (session: {payload.session_id})")
                return

            chunk = word + (" " if i < len(words) - 1 else "")
            
            data = {"token": chunk}
            if i == len(words) - 1 and sources:
                data["sources"] = sources
                
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(0.02)  # Tiny sleep for smooth simulation if buffered

    except Exception as e:
        logger.error(f"Streaming error: {e}")
        error_msg = json.dumps({"token": " [Connection issue, please try again]"})
        yield f"data: {error_msg}\n\n"
    
    finally:
        yield "data: [DONE]\n\n"


@router.post("")
async def chat_endpoint(request: Request, payload: ChatRequest) -> StreamingResponse:
    """
    POST /api/chat
    Streams AI response using Server-Sent Events.
    """
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    logger.info(f"Chat request from session: {payload.session_id}, Persona: {payload.visitor_persona}")

    return StreamingResponse(
        stream_agent_response(request, payload),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering
        },
    )

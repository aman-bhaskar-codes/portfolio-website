"""
LangGraph StateGraph — the core agentic orchestration graph.

Flow:
  router_agent → conditional edges → specialist agent → response_synthesizer → END
  memory_manager runs in parallel on every turn.
"""

import logging
from typing import Literal

from langgraph.graph import StateGraph, END

from backend.agents.state import AgentState
from backend.agents.router_agent import router_agent_node
from backend.agents.rag_agent import rag_agent_node
from backend.agents.social_agent import social_agent_node
from backend.agents.code_agent import code_agent_node
from backend.agents.memory_manager import memory_manager_node
from backend.agents.response_synthesizer import response_synthesizer_node
from backend.config.constants import RAG_INTENTS, SOCIAL_INTENTS, CODE_INTENTS

logger = logging.getLogger("portfolio.agents.graph")


def _route_by_intent(state: AgentState) -> str:
    """
    Conditional routing based on classified intent.
    Returns the name of the next node to execute.
    """
    intent = state.get("intent", "small_talk")
    
    if intent in RAG_INTENTS:
        return "rag_agent"
    elif intent in SOCIAL_INTENTS:
        return "social_agent"
    elif intent in CODE_INTENTS:
        # Code intents might also need RAG context
        return "code_agent"
    elif intent == "voice_interaction":
        # Voice handled at API layer (WebSocket), not in graph
        return "synthesizer"
    else:
        # small_talk, out_of_scope → direct to synthesizer
        return "synthesizer"


def build_agent_graph() -> StateGraph:
    """
    Build and compile the LangGraph StateGraph.
    
    Returns:
        Compiled graph ready for invocation
    """
    graph = StateGraph(AgentState)
    
    # ── Add Nodes ──
    graph.add_node("router", router_agent_node)
    graph.add_node("rag_agent", rag_agent_node)
    graph.add_node("social_agent", social_agent_node)
    graph.add_node("code_agent", code_agent_node)
    graph.add_node("memory_manager", memory_manager_node)
    graph.add_node("synthesizer", response_synthesizer_node)
    
    # ── Entry Point ──
    graph.set_entry_point("router")
    
    # ── Conditional Routing from Router ──
    graph.add_conditional_edges(
        "router",
        _route_by_intent,
        {
            "rag_agent": "rag_agent",
            "social_agent": "social_agent",
            "code_agent": "code_agent",
            "synthesizer": "synthesizer",
        },
    )
    
    # ── Specialist → Synthesizer ──
    graph.add_edge("rag_agent", "synthesizer")
    graph.add_edge("social_agent", "synthesizer")
    graph.add_edge("code_agent", "synthesizer")
    
    # ── Synthesizer → END ──
    graph.add_edge("synthesizer", END)
    
    logger.info("Agent graph built successfully")
    return graph.compile()


# ── Compiled Graph Singleton ──
agent_graph = build_agent_graph()


async def run_agent(
    query: str,
    session_id: str = "default",
    user_id: str = "anonymous",
    conversation_id: str = "",
    deep_dive: bool = False,
    model_override: str = None,
    conversation_history: list[dict] = None,
) -> AgentState:
    """
    Execute the agent graph with the given input.
    
    Args:
        query: User's message
        session_id: Session identifier
        user_id: User identifier
        conversation_id: Conversation thread ID
        deep_dive: Whether to generate extended response
        model_override: Force a specific model
        conversation_history: Recent conversation messages
    
    Returns:
        Final AgentState with response, citations, etc.
    """
    initial_state: AgentState = {
        "query": query,
        "session_id": session_id,
        "user_id": user_id,
        "conversation_id": conversation_id,
        "deep_dive": deep_dive,
        "model_override": model_override,
        "conversation_history": conversation_history or [],
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
    
    # Run the graph
    try:
        result = await agent_graph.ainvoke(initial_state)
        
        # Run memory manager async (fire-and-forget)
        import asyncio
        asyncio.create_task(_run_memory_async(result))
        
        return result
    except Exception as e:
        logger.error(f"Agent graph execution error: {e}")
        return {
            **initial_state,
            "response": f"I encountered an issue processing your request. Please try again.",
            "error": str(e),
        }


async def _run_memory_async(state: AgentState):
    """Fire-and-forget memory manager — never blocks the response."""
    try:
        await memory_manager_node(state)
    except Exception as e:
        logger.error(f"Memory manager error (non-blocking): {e}")

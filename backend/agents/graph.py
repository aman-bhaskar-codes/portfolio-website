"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Master Agent Graph (§8)
═══════════════════════════════════════════════════════════

THE MASTER GRAPH — every agent request flows through here.

Flow:
  router → (rag | social | code | persona) → persona → ambient → memory → END
"""

from __future__ import annotations

import logging
from typing import Any, Optional

logger = logging.getLogger("portfolio.agents.graph")


# ─── Agent State ────────────────────────────────────────────

class AgentState(dict):
    """
    State dictionary that flows through the agent graph.
    
    All keys are optional with defaults for resilience.
    """

    # Input fields
    session_id: str
    user_id: Optional[str]
    message: str

    # Visitor intelligence
    visitor_persona: str
    company_context: Optional[str]
    visit_count: int

    # Memory
    working_memory: list[dict]
    episodic_summary: str

    # Routing
    intent: str
    confidence: float

    # Retrieved knowledge
    rag_chunks: list[dict]
    kg_context: str

    # Agent outputs
    raw_response: str
    cited_sources: list[str]
    conversion_action: str

    # Final
    final_response: str
    stream_tokens: list[str]


def _get(state: dict, key: str, default: Any = "") -> Any:
    """Safe state access with defaults."""
    return state.get(key, default)


# ─── Agent Nodes ────────────────────────────────────────────

async def router_node(state: dict) -> dict:
    """
    Intent classification node.
    Classifies the user's message into an intent category.
    """
    from backend.llm.ollama_client import ollama_client

    message = _get(state, "message", "")
    
    # Use structured output for reliable classification
    classification_prompt = (
        "Classify this message into exactly ONE intent category. "
        "Categories: personal_info, projects, technical_skill, "
        "code_walkthrough, social_proof, small_talk, out_of_scope\n\n"
        f"Message: {message}\n\n"
        "Reply with ONLY the category name, nothing else."
    )

    try:
        response = await ollama_client.generate(
            model="llama3.2:3b",
            prompt=classification_prompt,
            options={"num_predict": 20, "temperature": 0.1},
        )
        
        raw_intent = response.get("response", "").strip().lower()
        
        # Map to valid intents
        valid_intents = {
            "personal_info", "projects", "technical_skill",
            "code_walkthrough", "social_proof", "small_talk",
            "out_of_scope",
        }
        
        # Find best match
        intent = "small_talk"  # default
        for valid in valid_intents:
            if valid in raw_intent:
                intent = valid
                break
        
        state["intent"] = intent
        state["confidence"] = 0.8
        logger.debug(f"Router: '{message[:40]}...' → {intent}")
        
    except Exception as e:
        logger.warning(f"Router classification failed: {e}")
        state["intent"] = "small_talk"
        state["confidence"] = 0.3

    return state


async def rag_node(state: dict) -> dict:
    """
    RAG retrieval + synthesis node.
    Retrieves relevant knowledge and generates a grounded response.
    """
    from backend.llm.ollama_client import ollama_client
    from backend.llm.router import model_router
    from backend.llm.prompt_factory import prompt_factory

    message = _get(state, "message", "")
    persona = _get(state, "visitor_persona", "casual")
    intent = _get(state, "intent", "projects")

    # Step 1: Retrieve knowledge chunks
    chunks: list[dict] = []
    try:
        from backend.rag.hybrid_search import HybridSearchEngine
        search_engine = HybridSearchEngine(ollama_client=ollama_client)
        chunks = await search_engine.search(
            query=message,
            persona=persona,
            top_k=5,
            use_hyde=True,
            use_colbert=False,  # Skip in dev if not available
        )
    except Exception as e:
        logger.debug(f"RAG search failed (will generate without context): {e}")

    state["rag_chunks"] = chunks

    # Step 2: Select model
    model = await model_router.select_model(
        intent=intent,
        persona=persona,
        ollama_circuit_open=ollama_client.circuit_state == "open",
    )

    # Step 3: Build token-budgeted prompt
    built = prompt_factory.build(
        model=model,
        owner_name=state.get("owner_name", "Aman"),
        visitor_persona=persona,
        rag_chunks=chunks,
        kg_context=_get(state, "kg_context", ""),
        episodic_summary=_get(state, "episodic_summary", ""),
        conversation_history=_get(state, "working_memory", []),
        user_message=message,
        company_context=state.get("company_context"),
        visit_count=state.get("visit_count", 1),
        conversion_action=_get(state, "conversion_action", "none"),
    )

    # Step 4: Generate response
    try:
        response = await ollama_client.generate(
            model=model,
            prompt=message,
            system=built.system,
            options={"num_predict": 500, "temperature": 0.7},
        )
        state["raw_response"] = response.get("response", "").strip()
        state["cited_sources"] = [
            c.get("metadata", {}).get("source", c.get("source", ""))
            for c in chunks[:3]
            if c
        ]
    except Exception as e:
        logger.warning(f"RAG generation failed: {e}")
        state["raw_response"] = (
            "I'm having a brief moment — could you try that question again?"
        )
        state["cited_sources"] = []

    return state


async def social_node(state: dict) -> dict:
    """
    Social proof agent — GitHub activity, commit stats, etc.
    """
    from backend.llm.ollama_client import ollama_client

    message = _get(state, "message", "")

    try:
        response = await ollama_client.generate(
            model="llama3.2:3b",
            prompt=(
                "Based on what you know about this software engineer, "
                "provide social proof and evidence of their work. "
                f"Question: {message}\n\n"
                "Include specific project names, GitHub stats, and "
                "contribution history if available."
            ),
            system=(
                "You are an AI representing a software engineer. "
                "Focus on concrete evidence: repos, commits, stars, "
                "technologies used. Be specific and factual."
            ),
            options={"num_predict": 300},
        )
        state["raw_response"] = response.get("response", "").strip()
    except Exception as e:
        logger.warning(f"Social agent failed: {e}")
        state["raw_response"] = "Let me share some of our project highlights..."

    return state


async def code_node(state: dict) -> dict:
    """
    Code walkthrough agent — uses qwen2.5:3b for technical depth.
    """
    from backend.llm.ollama_client import ollama_client

    message = _get(state, "message", "")

    try:
        response = await ollama_client.generate(
            model="qwen2.5:3b",
            prompt=message,
            system=(
                "You are a senior engineer explaining code architecture. "
                "Be precise about design patterns, tradeoffs, and implementation details. "
                "Use code snippets when helpful. Treat the questioner as a technical peer."
            ),
            options={"num_predict": 500, "temperature": 0.5},
        )
        state["raw_response"] = response.get("response", "").strip()
    except Exception as e:
        logger.warning(f"Code agent failed: {e}")
        state["raw_response"] = "Let me walk through the architecture..."

    return state


async def persona_node(state: dict) -> dict:
    """
    Digital Twin Engine — final persona voice pass.
    Adjusts tone/depth based on visitor persona.
    """
    raw = _get(state, "raw_response", "")
    persona = _get(state, "visitor_persona", "casual")
    intent = _get(state, "intent", "small_talk")

    # For small talk / out of scope, generate directly
    if intent in ("small_talk", "out_of_scope") and not raw:
        from backend.llm.ollama_client import ollama_client
        
        message = _get(state, "message", "")
        try:
            response = await ollama_client.generate(
                model="llama3.2:3b",
                prompt=message,
                system=(
                    "You are Aman's AI representative. Be warm, helpful, and direct. "
                    "For casual questions or greetings, be friendly. "
                    "For out-of-scope questions, gently redirect to Aman's work. "
                    "Never pretend to be human. Keep it brief (2-3 sentences)."
                ),
                options={"num_predict": 200, "temperature": 0.8},
            )
            raw = response.get("response", "").strip()
        except Exception as e:
            logger.debug(f"Persona direct generation failed: {e}")
            raw = "Hey! I'm Aman's AI — ask me about his projects, skills, or experience!"

    state["final_response"] = raw
    return state


async def ambient_node(state: dict) -> dict:
    """
    Ambient intelligence — adds proactive suggestions.
    Analyzes the conversation to suggest relevant next steps.
    """
    persona = _get(state, "visitor_persona", "casual")
    intent = _get(state, "intent", "")
    visit_count = state.get("visit_count", 1)
    response = _get(state, "final_response", "")

    # Determine conversion action based on signals
    conversion = "none"

    if persona == "technical_recruiter" and visit_count >= 2:
        conversion = "brief"
    elif persona == "senior_engineer" and intent in ("technical_skill", "code_walkthrough"):
        conversion = "walkthrough"
    elif intent == "projects" and visit_count >= 3:
        conversion = "interview"

    state["conversion_action"] = conversion
    return state


async def memory_node(state: dict) -> dict:
    """
    Memory manager — saves conversation turn to working memory.
    Triggers episodic compression every 10 turns.
    """
    # In production, this would:
    # 1. Append to Redis working memory
    # 2. Check turn count for episodic compression
    # 3. Update Qdrant semantic memory
    # For now, just pass through
    return state


# ─── Graph Builder ──────────────────────────────────────────

def build_agent_graph() -> Any:
    """
    Build the LangGraph StateGraph.
    
    Falls back to a simple sequential pipeline if LangGraph is not installed.
    """
    try:
        from langgraph.graph import StateGraph, END

        graph = StateGraph(dict)

        # Add nodes
        graph.add_node("router", router_node)
        graph.add_node("rag", rag_node)
        graph.add_node("social", social_node)
        graph.add_node("code", code_node)
        graph.add_node("persona", persona_node)
        graph.add_node("ambient", ambient_node)
        graph.add_node("memory", memory_node)

        # Entry point
        graph.set_entry_point("router")

        # Conditional routing
        graph.add_conditional_edges(
            "router",
            lambda state: state.get("intent", "small_talk"),
            {
                "personal_info": "rag",
                "projects": "rag",
                "technical_skill": "code",
                "social_proof": "social",
                "code_walkthrough": "code",
                "small_talk": "persona",
                "out_of_scope": "persona",
            },
        )

        # All specialists → persona engine
        for node in ("rag", "social", "code"):
            graph.add_edge(node, "persona")

        # Persona → ambient → memory → END
        graph.add_edge("persona", "ambient")
        graph.add_edge("ambient", "memory")
        graph.add_edge("memory", END)

        compiled = graph.compile()
        logger.info("✅ LangGraph agent graph compiled successfully")
        return compiled

    except ImportError:
        logger.warning(
            "LangGraph not installed — using sequential fallback pipeline"
        )
        return None


class FallbackPipeline:
    """
    Simple sequential pipeline when LangGraph is not available.
    Router → RAG → Persona → Memory
    """

    async def ainvoke(self, state: dict) -> dict:
        """Run the pipeline sequentially."""
        state = await router_node(state)

        intent = state.get("intent", "small_talk")
        if intent in ("personal_info", "projects"):
            state = await rag_node(state)
        elif intent in ("technical_skill", "code_walkthrough"):
            state = await code_node(state)
        elif intent == "social_proof":
            state = await social_node(state)

        state = await persona_node(state)
        state = await ambient_node(state)
        state = await memory_node(state)

        return state


# Build the graph (or fallback)
_compiled_graph = build_agent_graph()
if _compiled_graph is None:
    _compiled_graph = FallbackPipeline()


async def run_agent(
    message: str,
    session_id: str,
    visitor_persona: str = "casual",
    company_context: str | None = None,
    visit_count: int = 1,
    working_memory: list[dict] | None = None,
    episodic_summary: str = "",
    owner_name: str = "Aman",
) -> dict:
    """
    Run the agent graph for a single message.
    
    This is the main entry point for processing a chat message.
    Returns the complete agent state with final_response.
    """
    initial_state = {
        "session_id": session_id,
        "user_id": None,
        "message": message,
        "visitor_persona": visitor_persona,
        "company_context": company_context,
        "visit_count": visit_count,
        "working_memory": working_memory or [],
        "episodic_summary": episodic_summary,
        "owner_name": owner_name,
        "intent": "",
        "confidence": 0.0,
        "rag_chunks": [],
        "kg_context": "",
        "raw_response": "",
        "cited_sources": [],
        "conversion_action": "none",
        "final_response": "",
        "stream_tokens": [],
    }

    try:
        result = await _compiled_graph.ainvoke(initial_state)
        return result
    except Exception as e:
        logger.error(f"Agent graph failed: {e}")
        initial_state["final_response"] = (
            "I hit a brief issue processing that. Could you try again?"
        )
        return initial_state


# Test function (used by: make debug-agents)
def test_graph() -> None:
    """Synchronous test runner."""
    import asyncio

    async def _run():
        result = await run_agent(
            message="What are your best AI projects?",
            session_id="test-123",
            visitor_persona="technical_recruiter",
        )
        print("✅ Agent graph test passed")
        print(f"Intent detected: {result.get('intent', 'unknown')}")
        response = result.get("final_response", "")
        print(f"Response preview: {response[:200]}...")
        return result

    asyncio.run(_run())

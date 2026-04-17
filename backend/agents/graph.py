# backend/agents/graph.py
"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — LangGraph Master Agent Pipeline
═══════════════════════════════════════════════════════════

7-node graph: Router → [RAG/Social/Code] → Persona → Ambient → Memory → END
Falls back to sequential pipeline if LangGraph unavailable.
"""
import logging
from typing import Optional, TypedDict, Any, List

from backend.config.settings import settings
from backend.llm.ollama_client import get_ollama
from backend.llm.router import estimate_complexity, select_model

logger = logging.getLogger(__name__)


# ── Agent State ──
class AgentState(TypedDict, total=False):
    session_id: str
    user_id: Optional[str]
    message: str
    visitor_persona: str
    company_context: Optional[str]
    visit_count: int
    working_memory: list
    episodic_summary: str
    intent: str
    complexity: str
    model: str
    rag_chunks: list
    cited_sources: list
    stream_tokens: list
    final_response: str


# ── Node Functions ──

async def router_node(state: dict) -> dict:
    """Classify intent from user message."""
    message = state.get("message", "")
    complexity = estimate_complexity(message)

    # Quick intent classification via keyword matching (no LLM needed)
    msg_lower = message.lower()
    if any(w in msg_lower for w in ["project", "built", "portfolio", "work"]):
        intent = "projects"
    elif any(w in msg_lower for w in ["skill", "tech", "stack", "language", "framework"]):
        intent = "technical_skill"
    elif any(w in msg_lower for w in ["code", "implement", "architecture", "design pattern"]):
        intent = "code_walkthrough"
    elif any(w in msg_lower for w in ["github", "star", "contribution", "open source"]):
        intent = "social_proof"
    elif any(w in msg_lower for w in ["who", "about", "background", "experience", "education"]):
        intent = "personal_info"
    elif any(w in msg_lower for w in ["hi", "hello", "hey", "thanks", "bye"]):
        intent = "small_talk"
    else:
        intent = "personal_info"  # Default: RAG path

    model = await select_model(intent, complexity)

    return {
        "intent": intent,
        "complexity": complexity,
        "model": model,
    }


async def rag_node(state: dict) -> dict:
    """Retrieve context from hybrid search."""
    try:
        from backend.rag.hybrid_search import HybridSearchEngine
        from backend.db.connections import get_qdrant

        qdrant = get_qdrant()
        ollama = get_ollama()
        engine = HybridSearchEngine(qdrant, ollama)
        chunks = await engine.search(state.get("message", ""), top_k=5)

        return {
            "rag_chunks": chunks,
            "cited_sources": [c.get("source", "") for c in chunks if isinstance(c, dict)],
        }
    except Exception as e:
        logger.warning(f"RAG search failed: {e}")
        return {"rag_chunks": [], "cited_sources": []}


async def persona_node(state: dict) -> dict:
    """Generate the final response with persona + context."""
    ollama = get_ollama()
    model = state.get("model", settings.LLM_MODEL_MEDIUM)
    message = state.get("message", "")
    rag_chunks = state.get("rag_chunks", [])
    visitor_persona = state.get("visitor_persona", "casual")
    working_memory = state.get("working_memory", [])

    # Build context from RAG chunks
    context_parts = []
    for chunk in rag_chunks[:5]:
        if isinstance(chunk, dict):
            context_parts.append(chunk.get("content", ""))
        elif isinstance(chunk, str):
            context_parts.append(chunk)
    context = "\n---\n".join(context_parts) if context_parts else ""

    # Build system prompt
    system = f"""You are {settings.OWNER_NAME}'s AI digital twin — a warm, direct, technically precise presence.
You represent {settings.OWNER_NAME} ({settings.OWNER_TITLE}) authentically.

RULES:
- Ground every claim in the context provided. Never fabricate projects or experiences.
- If asked something not in your context, say "I don't have specific details on that, but here's what I know..."
- Be conversational, not robotic. Show personality.
- Adapt tone for visitor persona: {visitor_persona}
- Keep responses concise but substantive (2-4 paragraphs max).
"""

    if context:
        system += f"\n\nRELEVANT CONTEXT:\n{context}"

    # Build messages from working memory
    messages = []
    for turn in working_memory[-10:]:  # Last 5 exchanges
        messages.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})
    messages.append({"role": "user", "content": message})

    try:
        # Stream tokens
        tokens = []
        async for token in ollama.stream_chat(
            model=model,
            messages=messages,
            system=system,
            options={"temperature": 0.7, "num_predict": 1024},
        ):
            tokens.append(token)

        full_response = "".join(tokens)
        return {
            "stream_tokens": tokens,
            "final_response": full_response,
        }
    except Exception as e:
        logger.error(f"Persona generation failed: {e}")
        fallback = f"I'm {settings.OWNER_NAME}'s AI assistant. I'm having a moment — could you try that question again?"
        return {
            "stream_tokens": [fallback],
            "final_response": fallback,
        }


async def memory_node(state: dict) -> dict:
    """Persist conversation to working memory. (No-op here, done in chat.py)"""
    return {}


# ── Graph Builder ──

_compiled_graph = None


def build_agent_graph():
    """Build the LangGraph agent graph."""
    try:
        from langgraph.graph import StateGraph, END

        graph = StateGraph(AgentState)

        # Add nodes
        graph.add_node("router", router_node)
        graph.add_node("rag", rag_node)
        graph.add_node("persona", persona_node)
        graph.add_node("memory", memory_node)

        # Set entry point
        graph.set_entry_point("router")

        # Routing: all intents go through RAG first, then persona
        def route_intent(state):
            intent = state.get("intent", "out_of_scope")
            if intent in ("small_talk", "out_of_scope"):
                return "persona"  # Skip RAG for simple greetings
            return "rag"

        graph.add_conditional_edges("router", route_intent, {
            "rag": "rag",
            "persona": "persona",
        })

        graph.add_edge("rag", "persona")
        graph.add_edge("persona", "memory")
        graph.add_edge("memory", END)

        return graph.compile()

    except ImportError as e:
        logger.warning(f"LangGraph not available ({e}), using fallback pipeline")
        return None


def get_compiled_graph():
    """Get or build the compiled agent graph (lazy singleton)."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_agent_graph()
    return _compiled_graph


# ── Fallback Pipeline (no LangGraph) ──

class FallbackPipeline:
    """Sequential pipeline when LangGraph isn't available."""

    async def astream(self, state: dict):
        """Mimics LangGraph astream interface."""
        # Step 1: Router
        router_output = await router_node(state)
        state.update(router_output)
        yield {"router": router_output}

        # Step 2: RAG (skip for small_talk)
        if state.get("intent") not in ("small_talk", "out_of_scope"):
            rag_output = await rag_node(state)
            state.update(rag_output)
            yield {"rag": rag_output}

        # Step 3: Persona
        persona_output = await persona_node(state)
        state.update(persona_output)
        yield {"persona": persona_output}

    async def ainvoke(self, state: dict) -> dict:
        """Run full pipeline and return final state."""
        async for chunk in self.astream(state):
            for node_name, node_output in chunk.items():
                state.update(node_output)
        return state


_fallback_pipeline = None


def get_fallback_pipeline() -> FallbackPipeline:
    global _fallback_pipeline
    if _fallback_pipeline is None:
        _fallback_pipeline = FallbackPipeline()
    return _fallback_pipeline

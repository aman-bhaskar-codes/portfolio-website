"""
Code Agent — explains code, walks through architecture, runs demos.
Uses qwen2.5:3b for code reasoning.
"""

import logging
from pathlib import Path

import httpx

from backend.agents.state import AgentState
from backend.config.settings import settings

logger = logging.getLogger("portfolio.agents.code")


async def code_agent_node(state: AgentState) -> AgentState:
    """
    LangGraph node: handle code-related queries.
    
    Can:
        - Explain project architecture
        - Walk through code files
        - Answer technical questions with code context
    
    Writes to state:
        - code_output: formatted code explanation
        - model_used: qwen2.5:3b
    """
    query = state["query"]
    model = state.get("model_override") or "qwen2.5:3b"
    
    # Check if query references a specific file or project
    code_context = _gather_code_context(query, state.get("entities", []))
    
    # Build prompt with code context
    system_prompt = f"""You are an expert code analyst for {settings.OWNER_NAME}'s projects. 
You explain architecture decisions, code patterns, and technical implementations clearly.
Use code blocks with syntax highlighting when showing code.
Be specific, reference actual code structures, and explain the 'why' behind decisions."""

    user_prompt = query
    if code_context:
        user_prompt = f"""Code context from the project:

{code_context}

User question: {query}

Explain clearly with code examples where helpful. Reference the actual code structure above."""

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{settings.OLLAMA_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": user_prompt,
                    "system": system_prompt,
                    "stream": False,
                    "options": {"temperature": 0.3, "num_predict": 500},
                },
            )
            response.raise_for_status()
            result = response.json().get("response", "").strip()
        
        state["code_output"] = result
        state["model_used"] = model
        
        logger.info(f"Code agent: generated {len(result)} char response using {model}")
        
    except Exception as e:
        logger.error(f"Code agent error: {e}")
        state["code_output"] = ""
        state["error"] = f"Code agent failed: {str(e)[:100]}"
    
    return state


def _gather_code_context(query: str, entities: list[str]) -> str:
    """
    Gather relevant code context from the project based on query.
    Reads key files and returns a summarized context.
    """
    context_parts = []
    data_dir = Path("/app/data/virtual_work")
    
    # Check for specific file mentions in query
    query_lower = query.lower()
    
    # Architecture overview
    if any(kw in query_lower for kw in ["architecture", "structure", "overview", "how does"]):
        # Provide high-level project structure
        context_parts.append("""## Project Architecture
- Frontend: Next.js 14 (App Router, TypeScript) + Tailwind + Three.js
- Backend: FastAPI + LangGraph (agentic orchestration)
- RAG: Qdrant (dense) + BM25 (sparse) + Cross-encoder reranking
- Memory: Redis (working) + PostgreSQL (episodic) + Qdrant (semantic)
- Models: llama3.2:3b (router), qwen2.5:3b (code), phi4-mini (reasoning)""")
    
    # If virtual_work directory exists, scan for relevant files
    if data_dir.exists():
        for file_path in data_dir.rglob("*.py"):
            if any(entity.lower() in file_path.name.lower() for entity in entities):
                try:
                    content = file_path.read_text(errors="ignore")[:500]
                    context_parts.append(f"```python\n# {file_path.name}\n{content}\n```")
                except Exception:
                    pass
    
    return "\n\n".join(context_parts[:3])  # Limit to 3 context blocks

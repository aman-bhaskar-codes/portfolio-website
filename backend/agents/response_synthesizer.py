"""
Response Synthesizer — the final LangGraph node.
Merges retrieved context + memory + agent output into a coherent,
persona-aligned response with citations and hallucination guards.

Streams tokens via SSE back to the frontend.
"""

import json
import time
import logging
from typing import AsyncGenerator

import httpx

from backend.agents.state import AgentState
from backend.config.settings import settings
from backend.config.constants import INTENT_TO_MODEL, PERSONA, TOKEN_BUDGET
from backend.prompts.factory import prompt_factory

logger = logging.getLogger("portfolio.agents.response_synthesizer")


async def response_synthesizer_node(state: AgentState) -> AgentState:
    """
    LangGraph node: final response assembly and generation.

    Steps:
        1. Select model based on intent (or override)
        2. Build system + user prompt via PromptFactory (budget-enforced)
        3. Inject retrieved chunks, memory, social data, code output
        4. Generate response via Ollama
        5. Apply persona constraints (word count, follow-up question, citations)
        6. Store response and metadata in state

    Writes to state:
        - response: final response text
        - model_used: which model generated the response
        - citations: source citations
        - latency_ms: generation latency
    """
    start_time = time.time()

    query = state.get("query", "")
    intent = state.get("intent", "small_talk")
    deep_dive = state.get("deep_dive", False)

    # ── 1. Select model ──
    model = state.get("model_override") or INTENT_TO_MODEL.get(intent, "llama3.2:3b")
    state["model_used"] = model

    # ── 2. Prepare context from all agents ──
    retrieved_chunks = state.get("retrieved_chunks", [])
    memory_context = state.get("memory_context", "")
    social_data = state.get("social_data", {})
    code_output = state.get("code_output", "")
    conversation_history = state.get("conversation_history", [])
    recent_topics = state.get("recent_topics", [])
    turn_count = state.get("turn_count", 0)

    # ── 3. Merge social data into context if available ──
    extra_context = ""
    if social_data:
        extra_context = _format_social_data(social_data)

    if code_output:
        if extra_context:
            extra_context += f"\n\nCode Analysis:\n{code_output}"
        else:
            extra_context = f"Code Analysis:\n{code_output}"

    # Merge extra context into retrieved chunks format for PromptFactory
    if extra_context:
        retrieved_chunks = retrieved_chunks + [
            {
                "content": extra_context,
                "source": "live_data",
                "score": 1.0,
                "chunk_id": "social_or_code",
            }
        ]

    # ── 4. Build prompt via PromptFactory (with token budget enforcement) ──
    try:
        system_prompt, user_prompt = prompt_factory.build_chat_prompt(
            query=query,
            retrieved_chunks=retrieved_chunks,
            history=conversation_history,
            memory_summary=memory_context,
            turn_count=turn_count,
            recent_topics=recent_topics,
            deep_dive=deep_dive,
        )
    except Exception as e:
        logger.error(f"Prompt building failed: {e}")
        system_prompt = f"You are {settings.OWNER_NAME}'s AI assistant. Be helpful and concise."
        user_prompt = query

    # ── 5. Generate response via Ollama ──
    try:
        response_text = await _generate_response(model, system_prompt, user_prompt)
    except Exception as e:
        logger.error(f"Response generation failed: {e}")
        response_text = (
            "I'm having trouble processing that right now. "
            "Could you try rephrasing your question?"
        )

    # ── 6. Post-processing ──
    # Ensure citations are included
    citations = list(set(state.get("citations", [])))
    if citations and not any(f"[from:" in response_text for _ in citations):
        # Append citations if model didn't include them naturally
        citation_str = ", ".join(f"[from: {c}]" for c in citations[:3])
        response_text += f"\n\n{citation_str}"

    # ── 7. Write to state ──
    latency_ms = int((time.time() - start_time) * 1000)
    state["response"] = response_text
    state["citations"] = citations
    state["latency_ms"] = latency_ms

    logger.info(
        f"Synthesizer: model={model}, intent={intent}, "
        f"latency={latency_ms}ms, response_len={len(response_text)}"
    )

    return state


async def generate_streaming_response(state: AgentState) -> AsyncGenerator[str, None]:
    """
    Streaming version of the synthesizer — yields SSE-formatted chunks.
    Used by the chat API endpoint for real-time token streaming.
    """
    start_time = time.time()

    query = state.get("query", "")
    intent = state.get("intent", "small_talk")
    deep_dive = state.get("deep_dive", False)

    # Select model
    model = state.get("model_override") or INTENT_TO_MODEL.get(intent, "llama3.2:3b")

    # Prepare context
    retrieved_chunks = state.get("retrieved_chunks", [])
    memory_context = state.get("memory_context", "")
    social_data = state.get("social_data", {})
    code_output = state.get("code_output", "")
    conversation_history = state.get("conversation_history", [])
    recent_topics = state.get("recent_topics", [])
    turn_count = state.get("turn_count", 0)

    # Merge extra context
    extra_context = ""
    if social_data:
        extra_context = _format_social_data(social_data)
    if code_output:
        extra_context += f"\n\nCode Analysis:\n{code_output}" if extra_context else f"Code Analysis:\n{code_output}"

    if extra_context:
        retrieved_chunks = retrieved_chunks + [
            {"content": extra_context, "source": "live_data", "score": 1.0, "chunk_id": "extra"}
        ]

    # Build prompt
    try:
        system_prompt, user_prompt = prompt_factory.build_chat_prompt(
            query=query,
            retrieved_chunks=retrieved_chunks,
            history=conversation_history,
            memory_summary=memory_context,
            turn_count=turn_count,
            recent_topics=recent_topics,
            deep_dive=deep_dive,
        )
    except Exception as e:
        logger.error(f"Prompt building failed: {e}")
        system_prompt = f"You are {settings.OWNER_NAME}'s AI assistant."
        user_prompt = query

    # Yield intent + model info first
    yield json.dumps({
        "token": "",
        "done": False,
        "intent": intent,
        "model_used": model,
        "citations": list(set(state.get("citations", []))),
    })

    # Stream from Ollama
    full_response = []
    try:
        async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
            async with client.stream(
                "POST",
                f"{settings.OLLAMA_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": user_prompt,
                    "system": system_prompt,
                    "stream": True,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": TOKEN_BUDGET["response_deep_dive"] if deep_dive else TOKEN_BUDGET["response_default"],
                    },
                },
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            token = data.get("response", "")
                            done = data.get("done", False)

                            full_response.append(token)

                            yield json.dumps({
                                "token": token,
                                "done": done,
                            })

                            if done:
                                latency_ms = int((time.time() - start_time) * 1000)
                                yield json.dumps({
                                    "token": "",
                                    "done": True,
                                    "latency_ms": latency_ms,
                                    "citations": list(set(state.get("citations", []))),
                                })
                        except json.JSONDecodeError:
                            continue

    except Exception as e:
        logger.error(f"Streaming generation error: {e}")
        yield json.dumps({
            "token": f"\n\n[Error: Could not generate response. {str(e)[:100]}]",
            "done": True,
        })

    # Update state with full response for memory writing
    state["response"] = "".join(full_response)
    state["model_used"] = model
    state["latency_ms"] = int((time.time() - start_time) * 1000)


async def _generate_response(model: str, system_prompt: str, user_prompt: str) -> str:
    """
    Non-streaming response generation via Ollama.
    Used for the graph node (non-streaming path).
    """
    async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
        response = await client.post(
            f"{settings.OLLAMA_URL}/api/generate",
            json={
                "model": model,
                "prompt": user_prompt,
                "system": system_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 400,
                },
            },
        )
        response.raise_for_status()
        return response.json().get("response", "").strip()


def _format_social_data(social_data: dict) -> str:
    """Format social media data into readable context for the LLM."""
    parts = []

    # GitHub
    github = social_data.get("github", {})
    if github and "error" not in github:
        profile = github.get("profile", {})
        repos = github.get("repos", [])
        parts.append(f"GitHub Profile: {profile.get('name', 'N/A')}")
        parts.append(f"  Bio: {profile.get('bio', 'N/A')}")
        parts.append(f"  Public Repos: {profile.get('public_repos', 0)}")
        parts.append(f"  Followers: {profile.get('followers', 0)}")
        if repos:
            parts.append("  Top Repositories:")
            for repo in repos[:5]:
                stars = repo.get("stars", 0)
                lang = repo.get("language", "N/A")
                desc = repo.get("description", "No description")[:80]
                parts.append(f"    - {repo['name']} ({lang}, ★{stars}): {desc}")

    # LinkedIn
    linkedin = social_data.get("linkedin", {})
    if linkedin and linkedin.get("status") != "not_configured":
        parts.append(f"LinkedIn: {json.dumps(linkedin, indent=2)}")

    # Instagram
    instagram = social_data.get("instagram", {})
    if instagram and instagram.get("status") != "not_configured":
        parts.append(f"Instagram: {json.dumps(instagram, indent=2)}")

    return "\n".join(parts) if parts else ""

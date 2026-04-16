import asyncio
import json

from backend.router.intent_router import detect_intent
from backend.router.category_router import categories_for_intent
from backend.retrieval.hybrid_search import hybrid_search

from backend.ranking.scorer import sort_rows
from backend.ranking.reranker import rerank

from backend.context.token_budget import select_chunks
from backend.rag.context_builder import build_context

# LEVEL 4 MEMORY STACK
from backend.mem0_store.mem0_client import search_memory
from backend.graph_memory.neo4j_client import find_relations
from backend.memory.memory_manager import store_memory

from backend.llm.embedder import embedder
from backend.llm.generator import generator

from backend.policy.prompt_policy import rules
from backend.voice.voice_service import generate_voice


async def rag_chat(db, query: str, history: list, mode: str = "assistant", user_id: str = "aman"):
    # 1. Routing
    intent = detect_intent(query)
    cats = categories_for_intent(intent)

    # 2. Embedding
    emb = await embedder.embed_query(query)

    # 3. Hybrid Search (Vector + Keyword)
    rows = await hybrid_search(
        db,
        emb,
        query,
        cats,
    )

    # 4. Multi-Stage Ranking
    rows = sort_rows(rows)
    rows = rerank(rows, query)

    # 5. Token Budgeting Limit
    rows = select_chunks(rows)

    # 6. Scoped Memory Context (Mem0 Semantic Memory + Neo4j Graph Memory)
    mem_chunks = []
    graph_chunks = []
    
    if mode == "assistant":
        mem_chunks = search_memory(user_id, query)
        graph_chunks = find_relations(user_id)

    # 7. Context Merging Fusion
    ctx = build_context(rows, mem_chunks, graph_chunks)

    # 8. Governing Master Prompts & Policies
    from backend.rag.prompt_builder import load_prompt
    
    master = load_prompt("master.txt")
    if mode == "twin":
        mode_prompt = load_prompt("twin.txt")
    else:
        mode_prompt = load_prompt("assistant.txt")

    prompt = f"""
{master}
{mode_prompt}
{rules()}

Context:
{ctx}

History:
{history}

User:
{query}
"""

    # 9. LLM Generation and Streaming
    full_answer_chunks = []
    async for chunk in generator.generate_stream(prompt=prompt, system=""):
        from backend.voice.interrupt import should_stop
        if should_stop():
            break
            
        full_answer_chunks.append(chunk)
        yield json.dumps({"chunk": chunk, "voice": None}) + "\n"

    answer = "".join(full_answer_chunks)
    
    # 10. Background Meta-Learning RL Updates
    # Passing to new RL memory scorer graph engine
    def background_store():
        store_memory(user_id, query)
        store_memory(user_id, answer)
    
    asyncio.get_event_loop().run_in_executor(None, background_store)
    
    # 11. TTS Synthesis
    if mode == "assistant":
        voice_file = await generate_voice(answer, mode)
        if voice_file:
            yield json.dumps({"chunk": "", "voice": f"/api/voice/{voice_file}"}) + "\n"


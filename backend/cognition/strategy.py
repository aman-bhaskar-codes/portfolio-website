import json
from backend.llm.generator import generator
from backend.reasoning.tree_reasoner import reason

async def respond(strategy: str, query: str, context: str):
    """Executes the selected response strategy."""
    
    # Common generator helper
    async def _stream(prompt, sys):
        async for chunk in generator.generate_stream(prompt=prompt, system=sys):
            yield json.dumps({"chunk": chunk, "voice": None}) + "\n"

    MASTER_PROMPT = """You are Aman Bhaskar’s AI Assistant and Digital Twin.
Rule 1: If question is about Aman, his projects, identity, or website, use retrieved knowledge context.
Rule 2: If retrieved context is weak/empty, answer using general knowledge, but DO NOT invent facts about Aman.
Rule 3: For general questions unrelated to Aman, answer normally.
Rule 4: Never fabricate projects or links."""

    if strategy == "rag_primary":
        async for c in _stream(context + "\nUser: " + query, MASTER_PROMPT):
            yield c
            
    elif strategy == "rag_blended":
        async for c in _stream(context + "\nUser: " + query, MASTER_PROMPT):
            yield c
            
    elif strategy == "reasoning":
        # Tree of thought wrapper natively yields final chunks
        # Wrap reason to yield json chunks 
        full_thought = await reason(query, context)
        yield json.dumps({"chunk": full_thought, "voice": None}) + "\n"
        
    else:
        # "general"
        async for c in _stream(query, MASTER_PROMPT):
            yield c

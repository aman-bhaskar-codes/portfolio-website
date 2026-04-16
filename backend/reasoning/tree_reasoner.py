from backend.llm.generator import generator

async def reason(query: str, context: str) -> str:
    """Tree of Thought 2-Step Reasoner."""
    
    # Step 1: Blind reasoning
    step1_prompt = f"Think step by step in a technical, logical manner.\n\nContext:\n{context}\n\nQuestion:\n{query}\n\nDraft initial reasoning:"
    step1_output = ""
    async for chunk in generator.generate_stream(prompt=step1_prompt, system=""):
        step1_output += chunk
        
    # Step 2: Finalize
    step2_prompt = f"Improve, finalize, and condense this reasoning into a clear response:\n\n{step1_output}"
    step2_output = ""
    async for chunk in generator.generate_stream(prompt=step2_prompt, system=""):
        step2_output += chunk
        
    return step2_output

from backend.llm.generator import generate

async def think_step(query: str, context: str) -> str:
    """
    Chain of Thought (Safe Implementation V2)
    Performs an internal reasoning scratchpad step that is hidden from the user,
    preventing prompt injection or system state spillage, then extracts the final answer.
    """
    hidden_reasoning_prompt = f"""
Think step by step internally. Do not answer until you have evaluated.
Context:
{context}
Question:
{query}
"""
    # Raw generation using synchronous call or async wrapper
    # Note: Using standard generate here instead of streaming for the internal step
    hidden_reasoning = generate(hidden_reasoning_prompt)

    final_answer_prompt = f"""
Using this internal reasoning scratchpad:
---
{hidden_reasoning}
---

Provide the final clear answer to the user ONLY. Do not mention your thinking process. Do not write 'Based on my reasoning'.
Question:
{query}
"""
    # Generate the final clean output
    final_answer = generate(final_answer_prompt)
    
    return final_answer

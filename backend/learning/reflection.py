from backend.llm.generator import generator

async def reflect(query: str, answer: str) -> float:
    """Evaluates the helpfulness of the response on a 0 to 1 scale."""
    prompt = f"Rate the helpfulness of this response strictly from 0 to 1. Return ONLY the number.\n\nUser: {query}\nAnswer: {answer}"
    
    output = ""
    async for chunk in generator.generate_stream(prompt=prompt, system=""):
        output += chunk
        
    try:
        # Extract first valid float from LLM response
        score = float(''.join(c for c in output if c.isdigit() or c == '.'))
        return min(max(score, 0.0), 1.0)
    except ValueError:
        return 0.5

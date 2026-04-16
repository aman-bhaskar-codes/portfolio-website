from backend.llm.generator import generate

def self_check(query: str, answer: str) -> bool:
    """
    Self-Awareness Layer V2
    Validates clarity and helpfulness before allowing the string to yield.
    """
    prompt = f"""
Is this answer clear and helpful?

Q:{query}
A:{answer}

Answer yes or no.
"""
    result = generate(prompt).strip().lower()
    return "yes" in result

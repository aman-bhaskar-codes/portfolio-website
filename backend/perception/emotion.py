from backend.llm.generator import generate

def detect_emotion(query: str) -> str:
    """
    Emotional Intelligence Layer V2
    Detects the emotional tone of the user's message using an ultra-fast zero-shot LLM pass.
    """
    prompt = f"""
Detect emotional tone of this message.

Options:
neutral
curious
excited
confused
frustrated
sad
motivated

Message:
{query}

Return only one word.
"""
    return generate(prompt).strip().lower()

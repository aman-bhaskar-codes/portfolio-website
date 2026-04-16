from backend.mem0_store.mem0_client import add_memory
from backend.learning.reward import reward

def update(user: str, query: str, answer: str, score: float):
    """Commits high-value interactions back into Mem0 long-term memory."""
    if reward(score):
        # Truncate answer to prevent blowing up the vector db tokens
        truncated_answer = answer[:300] + "..." if len(answer) > 300 else answer
        summary = f"User asked: {query}. AI reasoned successfully: {truncated_answer}"
        add_memory(user, summary)

"""
Token budget enforcement using tiktoken.
Measures, compresses, and trims to stay under model limits.
"""

import tiktoken
from typing import Optional

# Use cl100k_base (GPT-4 tokenizer) — reasonable proxy for Ollama models
_encoder = tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    """Count tokens in a text string using cl100k_base encoding."""
    if not text:
        return 0
    return len(_encoder.encode(text))


def truncate_to_tokens(text: str, max_tokens: int) -> str:
    """Truncate text to fit within max_tokens."""
    if not text:
        return ""
    tokens = _encoder.encode(text)
    if len(tokens) <= max_tokens:
        return text
    truncated = _encoder.decode(tokens[:max_tokens])
    return truncated


def compress_history(messages: list[dict], max_tokens: int) -> str:
    """
    Compress conversation history to fit within token budget.
    Strategy: keep most recent messages, summarize older ones.
    
    Args:
        messages: list of {"role": str, "content": str}
        max_tokens: maximum tokens allowed for history
    
    Returns:
        Compressed history string
    """
    if not messages:
        return ""

    # Build history from most recent, working backwards
    result_parts = []
    current_tokens = 0

    for msg in reversed(messages):
        role = msg.get("role", "user").upper()
        content = msg.get("content", "")
        entry = f"{role}: {content}"
        entry_tokens = count_tokens(entry)

        if current_tokens + entry_tokens > max_tokens:
            # Can't fit more — add truncated summary marker
            remaining = max_tokens - current_tokens - 10  # 10 tokens for marker
            if remaining > 20:
                truncated = truncate_to_tokens(entry, remaining)
                result_parts.append(f"[earlier] {truncated}...")
            break

        result_parts.append(entry)
        current_tokens += entry_tokens

    result_parts.reverse()
    return "\n".join(result_parts)


def trim_context(chunks: list[dict], max_tokens: int) -> list[dict]:
    """
    Trim retrieved context chunks to fit within token budget.
    Keeps highest-scored chunks first.
    
    Args:
        chunks: list of {"content": str, "source": str, "score": float}
        max_tokens: maximum tokens allowed for context
    
    Returns:
        Trimmed list of chunks that fit within budget
    """
    if not chunks:
        return []

    # Assume chunks are already sorted by relevance score (descending)
    result = []
    current_tokens = 0

    for chunk in chunks:
        content = chunk.get("content", "")
        source = chunk.get("source", "unknown")
        score = chunk.get("score", 0.0)

        # Format: [Source: xxx | Score: 0.xxx]
        formatted = f"[Source: {source} | Score: {score:.3f}]\n{content}"
        chunk_tokens = count_tokens(formatted)

        if current_tokens + chunk_tokens > max_tokens:
            # Try truncating this chunk to fill remaining space
            remaining = max_tokens - current_tokens - 20
            if remaining > 50:
                truncated_content = truncate_to_tokens(content, remaining)
                result.append({
                    **chunk,
                    "content": truncated_content,
                    "truncated": True,
                })
            break

        result.append(chunk)
        current_tokens += chunk_tokens

    return result

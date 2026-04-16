from backend.llm.generator import generator


async def summarize_memory(user: str, assistant: str) -> str:
    prompt = f"""
Summarize this interaction in one sentence.

User: {user}
Assistant: {assistant}
"""

    chunks = []
    async for chunk in generator.generate_stream(prompt=prompt, system=""):
        chunks.append(chunk)

    out = "".join(chunks)
    return out.strip()

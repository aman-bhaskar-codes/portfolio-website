from backend.llm.generator import generator

async def think(query, context):
    prompt = f"""
Think step by step.

Context:
{context}

Question:
{query}

Reason step by step.
"""
    full_text = ""
    async for chunk in generator.generate_stream(prompt=prompt, system=""):
        full_text += chunk
    return full_text

async def reason(query, ctx):
    a = await think(query, ctx)
    b = await think(query, a)
    return b

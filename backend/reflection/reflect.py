from backend.llm.generator import generator

async def reflect(q, a):
    prompt = f"""
Was this answer good?

Q:{q}
A:{a}

Short evaluation.
"""
    full_text = ""
    async for chunk in generator.generate_stream(prompt=prompt, system=""):
        full_text += chunk
    return full_text

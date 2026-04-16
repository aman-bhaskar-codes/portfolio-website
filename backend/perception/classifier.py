from backend.llm.generator import generator

async def classify(query: str) -> str:
    prompt = f"""
Classify this query into one of:

- identity
- project
- website
- personal
- general
- technical
- complex

Query: {query}
Return only category, no formatting or markdown.
"""
    # Use generator to fetch full classification
    full_text = ""
    async for chunk in generator.generate_stream(prompt=prompt, system=""):
        full_text += chunk
        
    return full_text.strip().lower()

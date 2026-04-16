import os

def load_prompt(filename: str) -> str:
    path = os.path.join(os.getcwd(), "backend", "prompts", filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    return ""

def build_prompt(mode, context, history, query):
    master = load_prompt("master.txt")

    if mode == "twin":
        mode_prompt = load_prompt("twin.txt")
    else:
        mode_prompt = load_prompt("assistant.txt")

    prompt = f"""
{master}

{mode_prompt}

Context:
{context}

History:
{history}

User:
{query}
"""
    return prompt

from mem0 import Memory
import os

MAIN_MODEL = os.getenv("MAIN_MODEL", "qwen2.5:3b")

config = {
    "llm": {
        "provider": "ollama",
        "config": {
            "model": MAIN_MODEL,
            "temperature": 0.0
        }
    },
    "embedder": {
        "provider": "ollama",
        "config": {
            "model": "nomic-embed-text:latest"
        }
    }
}

memory = Memory.from_config(config_dict=config)

def add_memory(user: str, text: str):
    memory.add(
        text,
        user_id=user,
    )

def search_memory(user: str, query: str):
    return memory.search(
        query,
        user_id=user,
    )

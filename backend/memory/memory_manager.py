from backend.mem0_store.mem0_client import add_memory, search_memory
from backend.graph_memory.neo4j_client import add_relation
from backend.rl_memory.scorer import score_memory

def store_memory(user: str, text: str):
    s = score_memory(text)

    if s < 0.4:
        return

    add_memory(user, text)

    # simple relation
    if "project" in text.lower():
        add_relation(user, "project", "talked")

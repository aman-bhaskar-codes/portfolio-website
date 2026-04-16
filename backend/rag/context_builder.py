from backend.context.token_budget import MAX_TOKENS

def build_context(rag_chunks, mem_chunks, graph_chunks):
    parts = []

    for r in rag_chunks:
        content_val = r.get("content", "") if hasattr(r, 'get') else getattr(r, 'content', '')
        source_val = r.get("source", "Unknown") if hasattr(r, 'get') else getattr(r, 'source', 'Unknown')
        parts.append(f"Source: {source_val}\nContent:\n{content_val}")

    for m in mem_chunks:
        # mem0 returns dicts natively
        parts.append(f"Memory:\n{m.get('text', '')}")

    for g in graph_chunks:
        parts.append(f"Graph Relation:\n→ {g}")

    return "\n\n".join(parts)[:MAX_TOKENS]

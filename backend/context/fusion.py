def fuse(rag, mem, pref, graph, history):
    parts = []
    
    for r in rag:
        parts.append(getattr(r, "content", str(r)))
        
    for m in mem:
        if isinstance(m, dict) and "text" in m:
            parts.append(m["text"])
        else:
            parts.append(str(m))

    for p in pref:
        if isinstance(p, dict) and "text" in p:
            parts.append(p["text"])
        else:
            parts.append(str(p))

    for g in graph:
        parts.append(str(g))

    if isinstance(history, list):
        for h in history:
            parts.append(str(h))
    elif history:
        parts.append(str(history))

    return "\n".join(parts)

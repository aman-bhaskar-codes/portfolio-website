MAX_TOKENS = 1500

def select_chunks(rows):
    total = 0
    out = []

    for r in rows:
        content_val = r.get("content", "") if hasattr(r, 'get') else getattr(r, 'content', '')
        size = len(str(content_val))

        if total + size > MAX_TOKENS:
            break

        out.append(r)
        total += size

    return out

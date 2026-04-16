def rerank(rows, query: str):
    q = query.lower()
    scored = []

    for r in rows:
        bonus = 0.0
        
        content_val = r.get("content", "") if hasattr(r, 'get') else getattr(r, 'content', '')
        cat_val = r.get("category", "") if hasattr(r, 'get') else getattr(r, 'category', '')
        sim_val = r.get("similarity", 0.5) if hasattr(r, 'get') else getattr(r, 'similarity', 0.5)
        
        sim = float(sim_val) if sim_val is not None else 0.5

        if q in str(content_val).lower():
            bonus += 0.2

        if cat_val == "website":
            bonus += 0.1

        scored.append(
            (sim + bonus, r)
        )

    scored.sort(
        reverse=True,
        key=lambda x: x[0],
    )

    return [r for _, r in scored]

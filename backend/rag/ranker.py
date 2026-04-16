def rank_chunks(rows):
    scored = []

    for r in rows:
        sim = r.get('similarity', 0.0)
        imp = r.get('importance') or 0.5
        rec = r.get('recency') or 0.5

        score = sim * 0.6 + imp * 0.2 + rec * 0.2

        scored.append((score, r))

    scored.sort(reverse=True, key=lambda x: x[0])

    return [r for _, r in scored]

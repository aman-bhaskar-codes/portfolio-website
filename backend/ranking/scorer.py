def score(row):
    sim = row.get("similarity", 0.5) if hasattr(row, 'get') else getattr(row, 'similarity', 0.5)
    imp = row.get("importance", 0.5) if hasattr(row, 'get') else getattr(row, 'importance', 0.5)
    rec = row.get("recency", 0.5) if hasattr(row, 'get') else getattr(row, 'recency', 0.5)

    # Coerce to float just in case
    sim = float(sim) if sim is None else float(sim)
    imp = float(imp) if imp is None else float(imp)
    rec = float(rec) if rec is None else float(rec)

    return (sim * 0.6) + (imp * 0.2) + (rec * 0.2)

def sort_rows(rows):
    scored = []
    
    for r in rows:
        scored.append((score(r), r))

    scored.sort(
        reverse=True,
        key=lambda x: x[0],
    )

    return [r for _, r in scored]

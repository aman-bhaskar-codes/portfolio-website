def score_importance(text: str) -> float:
    t = text.lower()
    score = 0.3

    if "project" in t:
        score += 0.2
    if "architecture" in t:
        score += 0.2
    if "remember" in t:
        score += 0.3
    if "important" in t:
        score += 0.3
    if "update" in t:
        score += 0.2

    return min(score, 1.0)

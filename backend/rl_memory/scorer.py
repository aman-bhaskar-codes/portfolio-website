def score_memory(text: str):
    score = 0.3

    text_lower = text.lower()
    
    if "project" in text_lower:
        score += 0.2

    if "important" in text_lower:
        score += 0.3

    if "update" in text_lower:
        score += 0.2

    return min(score, 1.0)

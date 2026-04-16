def evaluate_confidence(confidence: float) -> str:
    """Evaluates the mathematical RAG confidence into a routing tier."""
    if confidence > 0.65:
        return "strong"
    if confidence > 0.4:
        return "medium"
    return "weak"

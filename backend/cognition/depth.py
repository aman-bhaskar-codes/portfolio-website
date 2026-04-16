def decide_depth(query: str) -> str:
    """
    Adaptive Intelligence Layer V2
    Dynamically routes reasoning depth based on length heuristics and explicit requests.
    """
    query_lower = query.lower()

    if len(query.split()) > 25:
        return "deep"

    if "explain in detail" in query_lower or "deep dive" in query_lower:
        return "deep"

    if "step by step" in query_lower or "architectural analysis" in query_lower:
        return "deep"

    return "normal"

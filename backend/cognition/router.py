def route(category: str, rag_level: str, complex_flag: bool) -> str:
    """Smart fusion decision router."""
    if category in ["identity", "project", "website"]:
        if rag_level == "strong":
            return "rag_primary"
        return "rag_blended"
        
    if complex_flag:
        return "reasoning"
        
    return "general"

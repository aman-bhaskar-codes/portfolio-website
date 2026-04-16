def is_complex(query: str) -> bool:
    """Heuristic proxy for query complexity based on word count."""
    return len(query.split()) > 18

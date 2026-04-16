CATEGORIES = [
    "identity",
    "project",
    "system",
    "governance",
    "saas",
    "research",
    "memory",
    "general",
]


def classify_intent(query: str) -> str:

    q = query.lower()

    if "project" in q or "repo" in q:
        return "project"

    if "who are you" in q or "aman" in q:
        return "identity"

    if "architecture" in q or "system" in q:
        return "system"

    if "governance" in q:
        return "governance"

    if "saas" in q:
        return "saas"

    if "remember" in q:
        return "memory"

    return "general"

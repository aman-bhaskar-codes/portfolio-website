
import re

def classify_intent(query: str) -> str:
    """
    Fast lightweight intent classifier.
    Prioritizes <1ms latency over deep reasoning.
    Fallback to 'general' if uncertain.
    """
    q = query.lower().strip()

    # 1. Portfolio / Identity (Highest Priority)
    if any(x in q for x in ["who are you", "your name", "aman", "bhaskar", "resume", "cv", "contact", "email", "github", "linkedin"]):
        return "portfolio"
    
    if any(x in q for x in ["project", "work", "experience", "built", "portfolio", "case study"]):
        return "portfolio"

    # 2. Technical / Architecture (Hybrid Potential)
    if any(x in q for x in ["stack", "tech", "architecture", "design", "system", "code", "typescript", "react", "next.js", "python", "fastapi", "rag", "vector", "embedding"]):
        return "hybrid"

    # 3. Knowledge / General (Base Model)
    if any(x in q for x in ["what is", "explain", "how does", "define", "meaning of"]):
        # But check if it's about portfolio tech specifically
        if "architecture" in q or "stack" in q:
            return "hybrid"
        return "general"

    # 4. Low Value / Filter
    if len(q) < 3:
        return "low_value"
    
    if any(x in q for x in ["hello", "hi", "hey", "yo"]):
        return "chitchat"

    # Default Fallback
    return "general"

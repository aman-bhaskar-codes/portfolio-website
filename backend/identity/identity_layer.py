from backend.identity.identity_data import SOCIAL

def check_identity(query):

    q = query.lower()

    if "github" in q:
        return SOCIAL["github"]

    if "linkedin" in q:
        return SOCIAL["linkedin"]

    if "instagram" in q:
        return SOCIAL["instagram"]
        
    if "twitter" in q or " x" in q:
        return SOCIAL["x"]

    return None

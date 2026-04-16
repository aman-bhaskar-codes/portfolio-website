from typing import Optional, Dict, Any

async def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetches the persistent user profile containing tracked preferences and behavior traits.
    """
    if not user_id:
        return None
        
    from prisma import Prisma
    db = Prisma()
    await db.connect()
    
    try:
        profile = await db.userprofile.find_unique(where={"userId": user_id})
        if profile:
            return profile.model_dump()
        return None
    finally:
        await db.disconnect()

async def update_interaction(user_id: str):
    """
    Increments the global interaction count for the adaptive behavior layer.
    """
    if not user_id:
        return
        
    from prisma import Prisma
    db = Prisma()
    await db.connect()
    try:
        await db.userprofile.update(
            where={"userId": user_id},
            data={"interactionCount": {"increment": 1}}
        )
    finally:
        await db.disconnect()

def adaptive_prompt(profile: Optional[Dict[str, Any]]) -> str:
    """
    Injects persistent profiling traits into the AI interaction prompt constraints.
    """
    if not profile:
        return ""
        
    modifiers = []
    
    style = profile.get("preferredStyle")
    if style == "short":
        modifiers.append("Respond concisely.")
    elif style == "detailed":
        modifiers.append("Explain deeply.")
        
    level = profile.get("expertiseLevel")
    if level == "beginner":
        modifiers.append("Explain in simple language.")
    elif level == "expert" or level == "advanced":
        modifiers.append("Provide deep technical detail.")
        
    emotion = profile.get("emotionalPattern")
    if emotion == "calm":
        modifiers.append("Maintain a very steady, calm demeanor.")
    elif emotion == "curious":
        modifiers.append("Match the user's inquisitive curiosity.")
    elif emotion == "excited":
        modifiers.append("Be highly enthusiastic.")
        
    if len(modifiers) == 0:
        return ""
        
    return "### USER ADAPTIVE MODIFIERS:\n" + "\n".join(modifiers) + "\n\n"

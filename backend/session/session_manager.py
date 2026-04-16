import json
from backend.redis_cache.redis_client import set_session, get_session
from backend.llm.generator import generate

def get_history(user: str) -> str:
    s = get_session(user)
    if s:
        try:
            data = json.loads(s)
            if isinstance(data, dict) and "history" in data:
                return data["history"]
            return str(data)
        except:
            return s
    return ""

def compress_history(history: str) -> str:
    """
    Conversational Awareness Layer V2
    Summarizes raw interaction logs to prevent bloated prompt injection.
    """
    if len(history.split()) < 100:
        return history
        
    prompt = f"""
Summarize this conversation briefly. Keep key facts intact.

{history}
"""
    return generate(prompt).strip()

def save_history(user: str, history: str):
    compressed = compress_history(history)
    set_session(user, json.dumps({"history": compressed}))

async def summarize_conversation(conversation_id: str):
    """
    Enterprise Upgrade: Replaces history blobs by explicitly generating
    a title/summary for the conversation and storing it in `conversations.title`.
    """
    if not conversation_id:
        return
        
    from prisma import Prisma
    db = Prisma()
    await db.connect()
    try:
        messages = await db.message.find_many(
            where={"conversationId": conversation_id},
            order={"createdAt": "asc"}
        )
        if not messages:
            return
            
        history_text = "\\n".join([f"{m.role}: {m.content}" for m in messages])
        
        prompt = f"Summarize the core topic of this conversation in a extremely short maximum 5-word title:\\n\\n{history_text}"
        title = generate(prompt).strip().replace('"', '')
        
        await db.conversation.update(
            where={"id": conversation_id},
            data={"title": title}
        )
        return title
    except Exception as e:
        print(f"[SUMMARY ERROR]: {e}")
    finally:
        await db.disconnect()

from mem0 import Memory

mem = Memory()

def save_pref(user, text):

    if "like" in text or "prefer" in text:

        mem.add(
            text,
            user_id=user,
        )

def get_pref(user, query):

    return mem.search(
        query,
        user_id=user,
    )

import redis

# Use an async fallback wrapper around redis if needed via redis.asyncio
# But here we provision synchronous base connections explicitly requested
r = redis.Redis(
    host="localhost",
    port=6379,
    decode_responses=True,
)

def set_session(user: str, data: str):
    r.set(user, data)

def get_session(user: str):
    return r.get(user)

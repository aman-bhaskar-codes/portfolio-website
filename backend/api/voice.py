# backend/api/voice.py
"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Voice WebSocket Endpoint
═══════════════════════════════════════════════════════════
"""
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.agents.voice_handler import get_voice_handler
from backend.api.chat import generate_sse_stream, ChatRequest
from backend.config.settings import settings
from backend.db.connections import get_redis
import time

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/voice")
async def voice_endpoint(websocket: WebSocket):
    """
    WebSocket voice endpoint.
    Client sends: binary audio bytes
    Server sends: JSON transcript, streaming tokens, binary audio response
    """
    if not settings.FEATURE_VOICE_MODE:
        await websocket.close(code=1000, reason="Voice mode disabled")
        return

    client_ip = websocket.client.host if websocket.client else "127.0.0.1"
    try:
        redis = get_redis()
        key = f"rl:ws:voice:{client_ip}"
        current = int(time.time())
        async with redis.pipeline(transaction=True) as pipe:
            pipe.zremrangebyscore(key, 0, current - 60)
            pipe.zadd(key, {str(current): current})
            pipe.zcard(key)
            pipe.expire(key, 60)
            results = await pipe.execute()
            count = results[2]
        if count > 10:
            await websocket.close(code=1008, reason="Rate limit exceeded")
            return
    except RuntimeError:
        pass

    await websocket.accept()
    voice = get_voice_handler()

    try:
        while True:
            audio_bytes = await websocket.receive_bytes()
            
            if len(audio_bytes) > 2 * 1024 * 1024:  # 2MB max
                await websocket.send_json({"type": "error", "msg": "Audio payload too large"})
                continue

            # Transcribe
            text = await voice.transcribe(audio_bytes)
            if not text:
                await websocket.send_json({"type": "error", "msg": "Could not transcribe audio"})
                continue

            await websocket.send_json({"type": "transcript", "text": text})

            # Generate response
            chat_req = ChatRequest(message=text)
            full_response = ""

            async for chunk in generate_sse_stream(chat_req, {"persona": "casual"}):
                if chunk.startswith("data: "):
                    data = chunk[6:].strip()
                    if data == "[DONE]":
                        break
                    try:
                        parsed = json.loads(data)
                        if "token" in parsed:
                            token = parsed["token"]
                            full_response += token
                            await websocket.send_json({"type": "token", "token": token})
                    except json.JSONDecodeError:
                        pass

            # Synthesize audio
            if full_response:
                audio_response = await voice.synthesize(full_response)
                if audio_response:
                    await websocket.send_json({"type": "audio_start"})
                    chunk_size = 65536
                    for i in range(0, len(audio_response), chunk_size):
                        await websocket.send_bytes(audio_response[i:i + chunk_size])
                    await websocket.send_json({"type": "audio_end"})

    except WebSocketDisconnect:
        logger.info("Voice WebSocket disconnected")
    except Exception as e:
        logger.error(f"Voice WebSocket error: {e}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass

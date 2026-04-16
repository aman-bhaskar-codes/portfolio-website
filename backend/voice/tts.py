import edge_tts
import asyncio


async def speak(text, file):

    communicate = edge_tts.Communicate(
        text,
        voice="en-US-AriaNeural",
    )

    await communicate.save(file)

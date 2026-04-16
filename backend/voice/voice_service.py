from backend.voice.tts import speak


def allow_voice(mode):
    if mode == "assistant":
        return True
    return False

async def generate_voice(text, mode="assistant"):
    if not allow_voice(mode):
        return None

    file = "voice.mp3"

    await speak(text, file)

    return file

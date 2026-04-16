import httpx
import json
import os
from backend.config.settings import settings

class LLMGenerator:
    def __init__(self, model_name: str = None, base_url: str = settings.OLLAMA_URL):
        # Support options: phi3:mini, gemma:2b, qwen2.5:3b, mistral:7b
        self.model_name = model_name or os.getenv("MAIN_MODEL", "qwen2.5:3b")
        self.base_url = base_url

    async def generate_stream(self, prompt: str, system: str = ""):
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST", 
                f"{self.base_url}/api/generate", 
                json={"model": self.model_name, "prompt": prompt, "system": system, "stream": True},
                timeout=60.0
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    from backend.voice.interrupt import should_stop
                    if should_stop():
                        break
                    if line:
                        chunk = json.loads(line)
                        yield chunk.get("response", "")

generator = LLMGenerator()

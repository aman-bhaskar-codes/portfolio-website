# backend/llm/ollama_client.py
"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Async Ollama Client
═══════════════════════════════════════════════════════════

Every LLM call goes through this client. No exceptions.
"""
import json
import logging
import httpx
from typing import AsyncGenerator, Optional
from backend.config.settings import settings

logger = logging.getLogger(__name__)


class OllamaClient:
    """Async Ollama client with timeout and lazy connection."""

    def __init__(self):
        self.base_url = settings.OLLAMA_URL
        self.timeout = settings.OLLAMA_TIMEOUT
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(self.timeout),
            )
        return self._client

    async def generate(
        self,
        model: str,
        prompt: str,
        system: Optional[str] = None,
        options: Optional[dict] = None,
    ) -> str:
        """Non-streaming generation. Returns full response string."""
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": options or {},
        }
        if system:
            payload["system"] = system

        try:
            response = await self.client.post("/api/generate", json=payload)
            response.raise_for_status()
            return response.json()["response"]
        except Exception as e:
            logger.error(f"Ollama generate failed: {e}")
            raise

    async def chat(
        self,
        model: str,
        messages: list,
        system: Optional[str] = None,
        options: Optional[dict] = None,
    ) -> str:
        """Non-streaming chat. Returns assistant content string."""
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": options or {},
        }
        if system:
            payload["system"] = system

        try:
            response = await self.client.post("/api/chat", json=payload)
            response.raise_for_status()
            return response.json()["message"]["content"]
        except Exception as e:
            logger.error(f"Ollama chat failed: {e}")
            raise

    async def stream_chat(
        self,
        model: str,
        messages: list,
        system: Optional[str] = None,
        options: Optional[dict] = None,
    ) -> AsyncGenerator[str, None]:
        """Streaming chat — yields tokens one at a time."""
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": options or {},
        }
        if system:
            payload["system"] = system

        async with self.client.stream("POST", "/api/chat", json=payload) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    token = data.get("message", {}).get("content", "")
                    if token:
                        yield token
                    if data.get("done"):
                        break
                except json.JSONDecodeError:
                    continue

    async def embed(self, text: str, model: Optional[str] = None) -> list[float]:
        """Generate embedding for text. Returns 768-dim vector."""
        embed_model = model or settings.EMBED_MODEL
        payload = {
            "model": embed_model,
            "prompt": text,
        }
        try:
            response = await self.client.post("/api/embeddings", json=payload)
            response.raise_for_status()
            return response.json()["embedding"]
        except Exception as e:
            logger.error(f"Ollama embed failed: {e}")
            raise

    async def is_available(self) -> bool:
        """Check if Ollama is reachable."""
        try:
            response = await self.client.get("/api/tags", timeout=5.0)
            return response.status_code == 200
        except Exception:
            return False

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()


# Module-level singleton
_ollama_client: Optional[OllamaClient] = None


def get_ollama() -> OllamaClient:
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = OllamaClient()
    return _ollama_client

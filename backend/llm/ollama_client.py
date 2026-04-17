"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Async Ollama Client
═══════════════════════════════════════════════════════════

Circuit-broken, retry-capable async client for Ollama.
Handles: generate, embeddings, chat (streaming + non-streaming).
Every external call goes through this client — never call Ollama directly.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any, AsyncGenerator

import httpx

logger = logging.getLogger("portfolio.llm.ollama")


class OllamaClientError(Exception):
    """Raised when Ollama call fails after retries."""
    pass


class CircuitOpenError(Exception):
    """Raised when circuit breaker is open."""
    pass


class CircuitBreaker:
    """Simple circuit breaker for Ollama calls."""

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
    ):
        self._failure_count = 0
        self._failure_threshold = failure_threshold
        self._recovery_timeout = recovery_timeout
        self._last_failure_time = 0.0
        self._state = "closed"  # closed, open, half-open

    def is_open(self) -> bool:
        if self._state == "open":
            if time.time() - self._last_failure_time > self._recovery_timeout:
                self._state = "half-open"
                return False
            return True
        return False

    def record_success(self) -> None:
        self._failure_count = 0
        self._state = "closed"

    def record_failure(self) -> None:
        self._failure_count += 1
        self._last_failure_time = time.time()
        if self._failure_count >= self._failure_threshold:
            self._state = "open"
            logger.warning(
                f"Circuit breaker OPEN after {self._failure_count} failures. "
                f"Recovery in {self._recovery_timeout}s"
            )

    @property
    def state(self) -> str:
        # Re-check in case recovery timeout passed
        if self._state == "open" and not self.is_open():
            return "half-open"
        return self._state


class AsyncOllamaClient:
    """
    Async Ollama client with circuit breaker, retry, and streaming.

    Usage:
        client = AsyncOllamaClient("http://localhost:11434")
        response = await client.generate("llama3.2:3b", "Say hello")
        embedding = await client.embed("nomic-embed-text", "some text")
        async for token in client.stream("llama3.2:3b", "Tell me about AI"):
            print(token, end="")
    """

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        timeout: float = 120.0,
        max_retries: int = 2,
    ):
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._max_retries = max_retries
        self._cb = CircuitBreaker()
        self._available_models: set[str] = set()

    async def check_availability(self) -> bool:
        """Check if Ollama is reachable and list available models."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(f"{self._base_url}/api/tags")
                if r.status_code == 200:
                    models = r.json().get("models", [])
                    self._available_models = {
                        m.get("name", "").split(":")[0]
                        for m in models
                    }
                    self._cb.record_success()
                    return True
        except Exception:
            self._cb.record_failure()
        return False

    def is_model_available(self, model: str) -> bool:
        """Check if a specific model is pulled."""
        base = model.split(":")[0]
        return base in self._available_models

    async def generate(
        self,
        model: str,
        prompt: str,
        system: str = "",
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Non-streaming generation. Returns full response dict."""
        if self._cb.is_open():
            raise CircuitOpenError("Ollama circuit breaker is open")

        payload: dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "stream": False,
        }
        if system:
            payload["system"] = system
        if options:
            payload["options"] = options

        return await self._post("/api/generate", payload)

    async def chat(
        self,
        model: str,
        messages: list[dict[str, str]],
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Non-streaming chat. Returns full response dict."""
        if self._cb.is_open():
            raise CircuitOpenError("Ollama circuit breaker is open")

        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": False,
        }
        if options:
            payload["options"] = options

        return await self._post("/api/chat", payload)

    async def stream(
        self,
        model: str,
        prompt: str,
        system: str = "",
        options: dict[str, Any] | None = None,
    ) -> AsyncGenerator[str, None]:
        """Streaming generation — yields tokens one at a time."""
        if self._cb.is_open():
            raise CircuitOpenError("Ollama circuit breaker is open")

        payload: dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "stream": True,
        }
        if system:
            payload["system"] = system
        if options:
            payload["options"] = options

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                async with client.stream(
                    "POST",
                    f"{self._base_url}/api/generate",
                    json=payload,
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                token = data.get("response", "")
                                if token:
                                    yield token
                                if data.get("done", False):
                                    break
                            except json.JSONDecodeError:
                                continue
            self._cb.record_success()
        except Exception as e:
            self._cb.record_failure()
            logger.warning(f"Ollama stream failed: {e}")
            raise OllamaClientError(f"Streaming failed: {e}") from e

    async def stream_chat(
        self,
        model: str,
        messages: list[dict[str, str]],
        options: dict[str, Any] | None = None,
    ) -> AsyncGenerator[str, None]:
        """Streaming chat — yields tokens one at a time."""
        if self._cb.is_open():
            raise CircuitOpenError("Ollama circuit breaker is open")

        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": True,
        }
        if options:
            payload["options"] = options

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                async with client.stream(
                    "POST",
                    f"{self._base_url}/api/chat",
                    json=payload,
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                msg = data.get("message", {})
                                token = msg.get("content", "")
                                if token:
                                    yield token
                                if data.get("done", False):
                                    break
                            except json.JSONDecodeError:
                                continue
            self._cb.record_success()
        except Exception as e:
            self._cb.record_failure()
            raise OllamaClientError(f"Chat stream failed: {e}") from e

    async def embed(self, model: str, text: str) -> list[float]:
        """Generate embedding vector for text."""
        if self._cb.is_open():
            raise CircuitOpenError("Ollama circuit breaker is open")

        result = await self._post("/api/embeddings", {
            "model": model,
            "prompt": text,
        })
        return result.get("embedding", [])

    async def _post(self, path: str, payload: dict) -> dict[str, Any]:
        """POST with retry logic."""
        last_error: Exception | None = None

        for attempt in range(self._max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self._timeout) as client:
                    r = await client.post(
                        f"{self._base_url}{path}",
                        json=payload,
                    )
                    r.raise_for_status()
                    self._cb.record_success()
                    return r.json()
            except Exception as e:
                last_error = e
                self._cb.record_failure()
                if attempt < self._max_retries:
                    wait = 2 ** attempt
                    logger.debug(f"Ollama retry {attempt + 1}, waiting {wait}s")
                    await asyncio.sleep(wait)

        raise OllamaClientError(
            f"Ollama failed after {self._max_retries + 1} attempts: {last_error}"
        )

    @property
    def circuit_state(self) -> str:
        return self._cb.state

    @property
    def base_url(self) -> str:
        return self._base_url


# Module-level singleton
ollama_client = AsyncOllamaClient()

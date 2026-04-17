"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v3 — LangFuse Deep Tracer (§41)
═══════════════════════════════════════════════════════════

Full span tracing for every LLM call — see the complete prompt,
retrieved chunks, latency breakdown, token costs, and response
quality — all in the self-hosted LangFuse UI.

Trace structure:
  Trace: visitor_session_{id}
  ├── Span: persona_classification        (5ms)
  ├── Span: rag_retrieval
  │   ├── Generation: embed_query        (8ms)
  │   ├── Span: qdrant_search           (15ms)
  │   ├── Span: colbert_rerank          (80ms)
  │   └── Span: cross_encoder_rerank    (50ms)
  ├── Span: kg_query                    (10ms)
  ├── Generation: llm_response
  │   ├── Model: qwen2.5:3b
  │   ├── Prompt tokens: 1,847
  │   ├── Completion tokens: 412
  │   └── Latency: 2.3s
  └── Span: conversion_signal_detection (2ms)
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator
from uuid import uuid4

logger = logging.getLogger("portfolio.observability.langfuse")


class LangFuseTracer:
    """
    LangFuse tracing wrapper for all LLM and RAG operations.

    Every LangGraph node execution is traced.
    Every LLM call has full prompt/response/token visibility.

    What you can see in LangFuse UI:
      - Full system prompt (with persona injection)
      - Every RAG chunk retrieved (with scores)
      - LLM response + latency + token count
      - Total cost per conversation
      - Which prompts were DSPy-optimized vs human-written
      - Visitor persona per trace (for filtering)
    """

    def __init__(self):
        self._client = None
        self._available = False

    async def initialize(
        self,
        host: str = "http://localhost:3001",
        public_key: str = "",
        secret_key: str = "",
    ) -> None:
        """Initialize LangFuse client."""
        if not public_key or not secret_key:
            logger.info("⚠️ LangFuse keys not set — tracing disabled")
            return

        try:
            from langfuse import Langfuse

            self._client = Langfuse(
                public_key=public_key,
                secret_key=secret_key,
                host=host,
            )
            self._available = True
            logger.info(f"✅ LangFuse tracer initialized: {host}")
        except Exception as e:
            logger.warning(f"⚠️ LangFuse init failed (non-fatal): {e}")

    def create_trace(
        self,
        session_id: str,
        visitor_id: str = "",
        persona: str = "",
        tags: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> "TraceContext":
        """
        Create a new trace for a visitor interaction.
        Returns a TraceContext that can create child spans.
        """
        return TraceContext(
            client=self._client,
            available=self._available,
            session_id=session_id,
            visitor_id=visitor_id,
            persona=persona,
            tags=tags or [],
            metadata=metadata or {},
        )

    async def log_llm_call(
        self,
        trace_id: str,
        model: str,
        prompt: str,
        response: str,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        latency_ms: float = 0.0,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Log a standalone LLM call (outside a trace context)."""
        if not self._available or not self._client:
            return

        try:
            self._client.generation(
                trace_id=trace_id,
                name="llm_call",
                model=model,
                input=prompt[:5000],
                output=response[:5000],
                usage={
                    "input": prompt_tokens,
                    "output": completion_tokens,
                },
                metadata=metadata or {},
            )
        except Exception as e:
            logger.debug(f"LangFuse log_llm_call failed: {e}")

    async def flush(self) -> None:
        """Flush pending events to LangFuse server."""
        if self._available and self._client:
            try:
                self._client.flush()
            except Exception as e:
                logger.debug(f"LangFuse flush failed: {e}")

    async def shutdown(self) -> None:
        """Shutdown LangFuse client gracefully."""
        if self._available and self._client:
            try:
                self._client.flush()
                self._client.shutdown()
                logger.info("✅ LangFuse tracer shut down")
            except Exception as e:
                logger.debug(f"LangFuse shutdown: {e}")

    @property
    def is_available(self) -> bool:
        return self._available


class TraceContext:
    """
    Context manager for tracing a single visitor interaction.
    Creates child spans for each processing step.
    """

    def __init__(
        self,
        client: Any,
        available: bool,
        session_id: str,
        visitor_id: str = "",
        persona: str = "",
        tags: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
    ):
        self._client = client
        self._available = available
        self._trace = None
        self._trace_id = str(uuid4())
        self._session_id = session_id
        self._visitor_id = visitor_id
        self._persona = persona
        self._tags = tags or []
        self._metadata = metadata or {}

        if self._available and self._client:
            try:
                self._trace = self._client.trace(
                    id=self._trace_id,
                    session_id=session_id,
                    user_id=visitor_id,
                    tags=self._tags + [persona] if persona else self._tags,
                    metadata={
                        **self._metadata,
                        "persona": persona,
                    },
                )
            except Exception as e:
                logger.debug(f"Failed to create trace: {e}")

    @asynccontextmanager
    async def span(
        self, name: str, metadata: dict[str, Any] | None = None
    ) -> AsyncGenerator["SpanHandle", None]:
        """Create a child span within this trace."""
        handle = SpanHandle(
            trace=self._trace,
            name=name,
            metadata=metadata or {},
            available=self._available,
        )
        handle.start()
        try:
            yield handle
        finally:
            handle.end()

    def generation(
        self,
        name: str,
        model: str,
        prompt: str,
        response: str,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Log an LLM generation within this trace."""
        if not self._available or not self._trace:
            return

        try:
            self._trace.generation(
                name=name,
                model=model,
                input=prompt[:5000],
                output=response[:5000],
                usage={
                    "input": prompt_tokens,
                    "output": completion_tokens,
                },
                metadata=metadata or {},
            )
        except Exception as e:
            logger.debug(f"Failed to log generation: {e}")

    def update(
        self, output: str | None = None, metadata: dict[str, Any] | None = None
    ) -> None:
        """Update the trace with final output."""
        if not self._available or not self._trace:
            return

        try:
            update_kwargs: dict[str, Any] = {}
            if output:
                update_kwargs["output"] = output[:5000]
            if metadata:
                update_kwargs["metadata"] = metadata
            if update_kwargs:
                self._trace.update(**update_kwargs)
        except Exception as e:
            logger.debug(f"Failed to update trace: {e}")

    @property
    def trace_id(self) -> str:
        return self._trace_id


class SpanHandle:
    """Handle for a single span within a trace."""

    def __init__(
        self,
        trace: Any,
        name: str,
        metadata: dict[str, Any],
        available: bool,
    ):
        self._trace = trace
        self._name = name
        self._metadata = metadata
        self._available = available
        self._span = None
        self._start_time = 0.0

    def start(self) -> None:
        self._start_time = time.time()
        if self._available and self._trace:
            try:
                self._span = self._trace.span(
                    name=self._name, metadata=self._metadata
                )
            except Exception:
                pass

    def end(self, output: str | None = None) -> None:
        duration_ms = (time.time() - self._start_time) * 1000
        if self._span:
            try:
                update_kwargs: dict[str, Any] = {
                    "metadata": {
                        **self._metadata,
                        "duration_ms": round(duration_ms, 1),
                    }
                }
                if output:
                    update_kwargs["output"] = output[:5000]
                self._span.update(**update_kwargs)
                self._span.end()
            except Exception:
                pass

    @property
    def duration_ms(self) -> float:
        return (time.time() - self._start_time) * 1000


# Module-level singleton
langfuse_tracer = LangFuseTracer()

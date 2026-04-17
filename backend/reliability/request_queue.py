"""
═══════════════════════════════════════════════════════════
Priority Request Queue — ANTIGRAVITY OS v2 (§22.4)
═══════════════════════════════════════════════════════════

All LLM requests are queued before dispatch.
Prevents thundering herd on Ollama.

Priority Lanes (higher = served first):
  PRIORITY 5 (CRITICAL):   Returning visitor + active conversation
  PRIORITY 4 (HIGH):       Visitor from recognized company
  PRIORITY 3 (NORMAL):     First-time visitor with active chat
  PRIORITY 2 (LOW):        Background freshness sweeps
  PRIORITY 1 (BACKGROUND): Webhook-triggered re-ingestion

Load Shedding:
  Queue depth > 50:  Drop PRIORITY 1 tasks
  Queue depth > 100: Drop PRIORITY 1-2 tasks
  Queue depth > 200: Return instant static response to new sessions
  Queue depth > 500: Activate Tier 4 (static FAQ only)

The user NEVER sees a 503. They see a slightly simpler response.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from enum import IntEnum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.reliability.queue")


# ═══════════════════════════════════════════════════════════
# PRIORITY LEVELS
# ═══════════════════════════════════════════════════════════

class Priority(IntEnum):
    BACKGROUND = 1   # Webhook re-ingestion
    LOW = 2          # Freshness sweeps
    NORMAL = 3       # First-time visitor chat
    HIGH = 4         # Recognized company visitor
    CRITICAL = 5     # Returning visitor + active conversation


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class LLMRequest(BaseModel):
    """A queued LLM request with priority and context."""
    job_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:12])
    priority: int = Priority.NORMAL
    model: str = ""
    prompt: str = ""
    system_prompt: str = ""
    visitor_id: str = ""
    session_id: str = ""
    visitor_persona: str = "casual"
    created_at: float = Field(default_factory=time.time)
    timeout_seconds: float = 30.0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class QueueStats(BaseModel):
    """Queue metrics for dashboards."""
    depth: int = 0
    depth_by_priority: Dict[str, int] = Field(default_factory=dict)
    load_shed_level: int = 0  # 0=normal, 1-4=shedding
    oldest_item_age_seconds: float = 0.0
    processed_total: int = 0
    shed_total: int = 0


# ═══════════════════════════════════════════════════════════
# LOAD SHEDDING THRESHOLDS
# ═══════════════════════════════════════════════════════════

SHED_THRESHOLDS = {
    50:  {"drop_below_priority": Priority.LOW,    "level": 1},
    100: {"drop_below_priority": Priority.NORMAL, "level": 2},
    200: {"static_for_new": True,                 "level": 3},
    500: {"tier4_all": True,                      "level": 4},
}


# ═══════════════════════════════════════════════════════════
# PRIORITY REQUEST QUEUE
# ═══════════════════════════════════════════════════════════

class PriorityRequestQueue:
    """
    In-memory priority queue for LLM requests.
    For Redis-backed persistence in production, swap the internal
    data structure with Redis sorted sets.
    """

    def __init__(self, max_depth: int = 1000):
        self.max_depth = max_depth
        self._queue: List[LLMRequest] = []
        self._lock = asyncio.Lock()
        self._event = asyncio.Event()

        # Metrics
        self._processed_total = 0
        self._shed_total = 0

    async def enqueue(self, request: LLMRequest) -> Optional[str]:
        """
        Add request to queue. Returns job_id or None if shed.
        """
        async with self._lock:
            depth = len(self._queue)

            # Check load shedding
            shed_result = self._should_shed(depth, request)
            if shed_result:
                self._shed_total += 1
                logger.warning(
                    f"Load shed: dropped {request.job_id} "
                    f"(priority={request.priority}, depth={depth}, "
                    f"reason={shed_result})"
                )
                return None

            # Insert sorted by priority (descending) + time (ascending)
            inserted = False
            for i, existing in enumerate(self._queue):
                if request.priority > existing.priority:
                    self._queue.insert(i, request)
                    inserted = True
                    break
            if not inserted:
                self._queue.append(request)

            self._event.set()

            logger.debug(
                f"Enqueued {request.job_id} at priority {request.priority}, "
                f"queue depth: {len(self._queue)}"
            )
            return request.job_id

    async def dequeue(self, timeout: float = 5.0) -> Optional[LLMRequest]:
        """
        Pop highest priority request. Blocks up to timeout seconds.
        """
        # Wait for items
        try:
            await asyncio.wait_for(self._event.wait(), timeout=timeout)
        except asyncio.TimeoutError:
            return None

        async with self._lock:
            if not self._queue:
                self._event.clear()
                return None

            request = self._queue.pop(0)
            self._processed_total += 1

            if not self._queue:
                self._event.clear()

            # Check if request has expired
            age = time.time() - request.created_at
            if age > request.timeout_seconds:
                logger.warning(
                    f"Request {request.job_id} expired after {age:.1f}s "
                    f"(timeout={request.timeout_seconds}s)"
                )
                return await self.dequeue(timeout=0.1)  # Try next

            return request

    async def get_stats(self) -> QueueStats:
        """Get queue metrics."""
        async with self._lock:
            depth = len(self._queue)
            by_priority: Dict[str, int] = {}
            oldest_age = 0.0

            for req in self._queue:
                level = Priority(req.priority).name
                by_priority[level] = by_priority.get(level, 0) + 1
                age = time.time() - req.created_at
                if age > oldest_age:
                    oldest_age = age

            shed_level = 0
            for threshold in sorted(SHED_THRESHOLDS.keys()):
                if depth > threshold:
                    shed_level = SHED_THRESHOLDS[threshold]["level"]

            return QueueStats(
                depth=depth,
                depth_by_priority=by_priority,
                load_shed_level=shed_level,
                oldest_item_age_seconds=round(oldest_age, 1),
                processed_total=self._processed_total,
                shed_total=self._shed_total,
            )

    def _should_shed(self, depth: int, request: LLMRequest) -> Optional[str]:
        """Check if this request should be shed under load."""
        if depth >= self.max_depth:
            return "queue_full"

        if depth > 500:
            return "tier4_all"  # Everything goes static

        if depth > 200 and request.metadata.get("is_new_session"):
            return "static_for_new_sessions"

        if depth > 100 and request.priority <= Priority.LOW:
            return "drop_low_priority"

        if depth > 50 and request.priority <= Priority.BACKGROUND:
            return "drop_background"

        return None


def compute_request_priority(
    visitor_persona: str = "casual",
    visit_count: int = 1,
    is_active_conversation: bool = False,
    is_background_task: bool = False,
    company_recognized: bool = False,
) -> int:
    """
    Compute request priority from visitor context.
    Used by the chat API before enqueueing.
    """
    if is_background_task:
        return Priority.BACKGROUND

    # Base priority
    priority = Priority.NORMAL

    # Returning visitor in active conversation → critical
    if visit_count > 1 and is_active_conversation:
        priority = Priority.CRITICAL
    # Recognized company → high
    elif company_recognized:
        priority = Priority.HIGH
    # Active conversation → normal+
    elif is_active_conversation:
        priority = Priority.NORMAL

    return priority


# Singleton
request_queue = PriorityRequestQueue()

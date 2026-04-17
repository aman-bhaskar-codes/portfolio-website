"""
═══════════════════════════════════════════════════════════
Multi-Layer Rate Limiter — ANTIGRAVITY OS v2 (§23.6)
═══════════════════════════════════════════════════════════

Four independent rate limit layers using sliding window counters:

  Layer 1 — IP Rate Limit (anti-DDoS):
    60 req/min per IP, burst 100

  Layer 2 — Session Rate Limit (anti-spam):
    20 chat messages per 10 minutes per session

  Layer 3 — API Endpoint Rate Limit:
    /api/chat:           20 req/min
    /api/brief/generate: 3 req/hour
    /api/github/tree:    30 req/min
    /api/health:         unlimited

  Layer 4 — LLM Token Budget (capacity):
    50k output tokens per session
    100k output tokens per day per IP

IMPORTANT: Rate limit errors NEVER surface as errors.
They appear as friendly messages in the chat UI.
"""

from __future__ import annotations

import hashlib
import logging
import time
from dataclasses import dataclass, field
from typing import Dict, Optional

from pydantic import BaseModel

logger = logging.getLogger("portfolio.security.rate_limiter")


# ═══════════════════════════════════════════════════════════
# RESULT
# ═══════════════════════════════════════════════════════════

class RateLimitResult(BaseModel):
    allowed: bool = True
    layer: str = ""
    retry_after_seconds: float = 0.0
    friendly_message: str = ""
    remaining: int = -1


# ═══════════════════════════════════════════════════════════
# SLIDING WINDOW COUNTER (in-memory; Redis in production)
# ═══════════════════════════════════════════════════════════

@dataclass
class SlidingWindowCounter:
    """Token bucket / sliding window rate limiter."""
    key: str
    limit: int
    window_seconds: float
    timestamps: list = field(default_factory=list)

    def check_and_increment(self) -> tuple[bool, int]:
        """
        Check if under limit, and increment if so.
        Returns (allowed, remaining).
        """
        now = time.time()
        cutoff = now - self.window_seconds

        # Prune old entries
        self.timestamps = [t for t in self.timestamps if t > cutoff]

        remaining = self.limit - len(self.timestamps)
        if remaining <= 0:
            return False, 0

        self.timestamps.append(now)
        return True, remaining - 1


# ═══════════════════════════════════════════════════════════
# ENDPOINT LIMITS
# ═══════════════════════════════════════════════════════════

ENDPOINT_LIMITS: Dict[str, tuple[int, float]] = {
    "/api/chat": (20, 60),              # 20 / min
    "/api/brief/generate": (3, 3600),   # 3 / hour
    "/api/github/tree": (30, 60),       # 30 / min
    "/api/webhooks/github": (30, 60),   # 30 / min
    "/api/ambient/suggestion": (10, 60),# 10 / min
    "/api/kg/skills": (30, 60),         # 30 / min
    "/api/kg/constellation": (10, 60),  # 10 / min
    "/api/cli/command": (30, 60),       # 30 / min
    # /api/health: unlimited (not listed)
}

# Friendly messages per layer
FRIENDLY_MESSAGES = {
    "ip": "You're exploring fast! Give me a moment to catch up...",
    "session": "Let me process what we've discussed so far — one moment!",
    "endpoint": "That feature is getting some rest. Try again in a minute!",
    "token_budget": (
        "We've had a great conversation! I might give shorter answers "
        "for the rest of this session to keep things running smoothly."
    ),
}


# ═══════════════════════════════════════════════════════════
# MULTI-LAYER RATE LIMITER
# ═══════════════════════════════════════════════════════════

class MultiLayerRateLimiter:
    """
    Four independent rate limit layers.
    Never returns a 503. Always a friendly message.
    """

    def __init__(self):
        self._ip_counters: Dict[str, SlidingWindowCounter] = {}
        self._session_counters: Dict[str, SlidingWindowCounter] = {}
        self._endpoint_counters: Dict[str, SlidingWindowCounter] = {}
        self._token_usage: Dict[str, int] = {}  # session/IP → tokens used

    def check(
        self,
        ip: str = "",
        session_id: str = "",
        endpoint: str = "",
    ) -> RateLimitResult:
        """
        Check all applicable rate limit layers.
        Returns first failed layer or an allowed result.
        """
        ip_hash = self._hash_ip(ip)

        # Layer 1: IP rate limit
        if ip_hash:
            result = self._check_ip(ip_hash)
            if not result.allowed:
                return result

        # Layer 2: Session rate limit
        if session_id:
            result = self._check_session(session_id)
            if not result.allowed:
                return result

        # Layer 3: Endpoint rate limit
        if endpoint and endpoint in ENDPOINT_LIMITS:
            result = self._check_endpoint(ip_hash or session_id, endpoint)
            if not result.allowed:
                return result

        return RateLimitResult(allowed=True)

    def record_tokens(self, session_id: str, ip: str, tokens: int):
        """Record token usage for Layer 4 budget tracking."""
        session_key = f"session:{session_id}"
        ip_key = f"ip_day:{self._hash_ip(ip)}:{self._today()}"

        self._token_usage[session_key] = (
            self._token_usage.get(session_key, 0) + tokens
        )
        self._token_usage[ip_key] = (
            self._token_usage.get(ip_key, 0) + tokens
        )

    def check_token_budget(
        self, session_id: str, ip: str
    ) -> RateLimitResult:
        """Layer 4: Check if session/IP has exhausted token budget."""
        session_key = f"session:{session_id}"
        ip_key = f"ip_day:{self._hash_ip(ip)}:{self._today()}"

        session_tokens = self._token_usage.get(session_key, 0)
        ip_day_tokens = self._token_usage.get(ip_key, 0)

        if session_tokens > 50_000:
            return RateLimitResult(
                allowed=False,
                layer="token_budget",
                friendly_message=FRIENDLY_MESSAGES["token_budget"],
            )

        if ip_day_tokens > 100_000:
            return RateLimitResult(
                allowed=False,
                layer="token_budget",
                friendly_message=FRIENDLY_MESSAGES["token_budget"],
            )

        return RateLimitResult(allowed=True)

    # ═══════════════════════════════════════════════════════
    # LAYER IMPLEMENTATIONS
    # ═══════════════════════════════════════════════════════

    def _check_ip(self, ip_hash: str) -> RateLimitResult:
        """Layer 1: 60 req/min per IP, burst 100."""
        if ip_hash not in self._ip_counters:
            self._ip_counters[ip_hash] = SlidingWindowCounter(
                key=ip_hash, limit=100, window_seconds=60
            )
        counter = self._ip_counters[ip_hash]
        allowed, remaining = counter.check_and_increment()

        if not allowed:
            logger.warning(f"IP rate limit hit: {ip_hash}")
            return RateLimitResult(
                allowed=False,
                layer="ip",
                retry_after_seconds=5.0,
                friendly_message=FRIENDLY_MESSAGES["ip"],
                remaining=0,
            )
        return RateLimitResult(allowed=True, remaining=remaining)

    def _check_session(self, session_id: str) -> RateLimitResult:
        """Layer 2: 20 messages per 10 minutes per session."""
        if session_id not in self._session_counters:
            self._session_counters[session_id] = SlidingWindowCounter(
                key=session_id, limit=20, window_seconds=600
            )
        counter = self._session_counters[session_id]
        allowed, remaining = counter.check_and_increment()

        if not allowed:
            logger.info(f"Session rate limit hit: {session_id}")
            return RateLimitResult(
                allowed=False,
                layer="session",
                retry_after_seconds=30.0,
                friendly_message=FRIENDLY_MESSAGES["session"],
                remaining=0,
            )
        return RateLimitResult(allowed=True, remaining=remaining)

    def _check_endpoint(self, key: str, endpoint: str) -> RateLimitResult:
        """Layer 3: Per-endpoint limits."""
        limit, window = ENDPOINT_LIMITS[endpoint]
        counter_key = f"{key}:{endpoint}"

        if counter_key not in self._endpoint_counters:
            self._endpoint_counters[counter_key] = SlidingWindowCounter(
                key=counter_key, limit=limit, window_seconds=window
            )
        counter = self._endpoint_counters[counter_key]
        allowed, remaining = counter.check_and_increment()

        if not allowed:
            logger.info(f"Endpoint rate limit: {endpoint} for {key}")
            return RateLimitResult(
                allowed=False,
                layer="endpoint",
                retry_after_seconds=min(window / 2, 60),
                friendly_message=FRIENDLY_MESSAGES["endpoint"],
                remaining=0,
            )
        return RateLimitResult(allowed=True, remaining=remaining)

    @staticmethod
    def _hash_ip(ip: str) -> str:
        if not ip:
            return ""
        return hashlib.sha256(ip.encode()).hexdigest()[:16]

    @staticmethod
    def _today() -> str:
        import datetime
        return datetime.date.today().isoformat()


# Singleton
rate_limiter = MultiLayerRateLimiter()

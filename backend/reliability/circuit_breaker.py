"""
═══════════════════════════════════════════════════════════
Circuit Breaker — ANTIGRAVITY OS v2 (§22.2)
═══════════════════════════════════════════════════════════

Production-grade circuit breaker for every external dependency.
Prevents cascading failures. Never trusts infrastructure unconditionally.

States:
  CLOSED   → Normal: requests flow through
  OPEN     → Failed: requests blocked, caller falls to next tier
  HALF_OPEN → Probing: one request allowed to test recovery

Every external call — Ollama, Qdrant, PostgreSQL, Redis, GitHub API —
must go through its own circuit breaker.
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Dict, Optional, TypeVar

logger = logging.getLogger("portfolio.reliability.circuit_breaker")

T = TypeVar("T")


# ═══════════════════════════════════════════════════════════
# STATE MACHINE
# ═══════════════════════════════════════════════════════════

class CircuitState(Enum):
    CLOSED = "closed"       # Normal: requests flow through
    OPEN = "open"           # Failed: requests blocked, fallback used
    HALF_OPEN = "half_open" # Testing: one probe request allowed


# ═══════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════

@dataclass
class CircuitBreakerConfig:
    """Configuration for a circuit breaker instance."""
    failure_threshold: int = 5        # Failures before opening
    success_threshold: int = 2        # Successes to close from HALF_OPEN
    timeout_seconds: float = 60.0     # Seconds to stay OPEN before probing
    half_open_max_calls: int = 1      # Max concurrent probes in HALF_OPEN
    excluded_exceptions: tuple = ()   # Exceptions that don't count as failures


# ═══════════════════════════════════════════════════════════
# ERRORS
# ═══════════════════════════════════════════════════════════

class CircuitOpenError(Exception):
    """Raised when circuit is OPEN and requests are blocked."""

    def __init__(self, service_name: str, retry_after: float = 0):
        self.service_name = service_name
        self.retry_after = retry_after
        super().__init__(
            f"{service_name} circuit is OPEN. "
            f"Retry after {retry_after:.1f}s"
        )


# ═══════════════════════════════════════════════════════════
# CIRCUIT BREAKER
# ═══════════════════════════════════════════════════════════

class CircuitBreaker:
    """
    Production-grade circuit breaker with state machine.

    Usage:
        cb = CircuitBreaker("ollama_primary", CircuitBreakerConfig(
            failure_threshold=3,
            timeout_seconds=30
        ))

        try:
            result = await cb.call(ollama_client.generate, prompt)
        except CircuitOpenError:
            # Fallback to next degradation tier
            result = await fallback_response(prompt)
    """

    def __init__(self, service_name: str, config: Optional[CircuitBreakerConfig] = None):
        self.service_name = service_name
        self.config = config or CircuitBreakerConfig()

        # State
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._half_open_calls = 0
        self._last_failure_time: float = 0
        self._last_state_change: float = time.monotonic()

        # Metrics
        self._total_calls = 0
        self._total_failures = 0
        self._total_successes = 0
        self._total_rejected = 0

        # Lock for state transitions
        self._lock = asyncio.Lock()

    @property
    def state(self) -> CircuitState:
        return self._state

    async def call(self, func: Callable, *args: Any, **kwargs: Any) -> Any:
        """
        Execute a function through the circuit breaker.

        Raises CircuitOpenError if the circuit is OPEN and timeout
        hasn't elapsed yet.
        """
        self._total_calls += 1

        async with self._lock:
            if self._state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    self._transition_to(CircuitState.HALF_OPEN)
                else:
                    self._total_rejected += 1
                    retry_after = self.config.timeout_seconds - (
                        time.monotonic() - self._last_failure_time
                    )
                    raise CircuitOpenError(self.service_name, max(0, retry_after))

            if self._state == CircuitState.HALF_OPEN:
                if self._half_open_calls >= self.config.half_open_max_calls:
                    self._total_rejected += 1
                    raise CircuitOpenError(self.service_name, 5.0)
                self._half_open_calls += 1

        # Execute the call
        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result
        except Exception as e:
            if isinstance(e, self.config.excluded_exceptions):
                # Don't count excluded exceptions as failures
                await self._on_success()
                raise
            await self._on_failure(e)
            raise

    async def _on_success(self):
        """Handle successful call."""
        async with self._lock:
            self._total_successes += 1

            if self._state == CircuitState.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.config.success_threshold:
                    self._transition_to(CircuitState.CLOSED)
                    logger.info(
                        f"🟢 Circuit CLOSED for {self.service_name} — "
                        f"service recovered after {self._success_count} successful probes"
                    )
            elif self._state == CircuitState.CLOSED:
                # Reset failure count on success
                self._failure_count = 0

    async def _on_failure(self, error: Exception):
        """Handle failed call."""
        async with self._lock:
            self._total_failures += 1
            self._failure_count += 1
            self._last_failure_time = time.monotonic()

            if self._state == CircuitState.HALF_OPEN:
                # Probe failed — back to OPEN
                self._transition_to(CircuitState.OPEN)
                logger.warning(
                    f"🔴 Circuit re-OPENED for {self.service_name} — "
                    f"probe failed: {error}"
                )
            elif self._state == CircuitState.CLOSED:
                if self._failure_count >= self.config.failure_threshold:
                    self._transition_to(CircuitState.OPEN)
                    logger.error(
                        f"🔴 Circuit OPENED for {self.service_name} — "
                        f"{self._failure_count} consecutive failures. "
                        f"Last error: {error}"
                    )

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to probe on HALF_OPEN."""
        elapsed = time.monotonic() - self._last_failure_time
        return elapsed >= self.config.timeout_seconds

    def _transition_to(self, new_state: CircuitState):
        """Transition to a new state with cleanup."""
        old_state = self._state
        self._state = new_state
        self._last_state_change = time.monotonic()

        if new_state == CircuitState.CLOSED:
            self._failure_count = 0
            self._success_count = 0
            self._half_open_calls = 0
        elif new_state == CircuitState.HALF_OPEN:
            self._success_count = 0
            self._half_open_calls = 0
        elif new_state == CircuitState.OPEN:
            self._success_count = 0
            self._half_open_calls = 0

    def get_metrics(self) -> Dict[str, Any]:
        """Return circuit breaker metrics for dashboards."""
        return {
            "service": self.service_name,
            "state": self._state.value,
            "failure_count": self._failure_count,
            "total_calls": self._total_calls,
            "total_failures": self._total_failures,
            "total_successes": self._total_successes,
            "total_rejected": self._total_rejected,
            "uptime_since_last_change": round(
                time.monotonic() - self._last_state_change, 1
            ),
        }

    def __repr__(self) -> str:
        return (
            f"CircuitBreaker({self.service_name}, "
            f"state={self._state.value}, "
            f"failures={self._failure_count}/{self.config.failure_threshold})"
        )


# ═══════════════════════════════════════════════════════════
# CIRCUIT BREAKER REGISTRY
# ═══════════════════════════════════════════════════════════

CIRCUIT_BREAKERS: Dict[str, CircuitBreaker] = {
    # LLM inference — fast timeout, low threshold (critical path)
    "ollama_primary": CircuitBreaker(
        "ollama_primary",
        CircuitBreakerConfig(failure_threshold=3, timeout_seconds=30),
    ),
    "ollama_secondary": CircuitBreaker(
        "ollama_secondary",
        CircuitBreakerConfig(failure_threshold=3, timeout_seconds=30),
    ),
    "ollama_light": CircuitBreaker(
        "ollama_light",
        CircuitBreakerConfig(failure_threshold=3, timeout_seconds=30),
    ),

    # Vector store
    "qdrant": CircuitBreaker(
        "qdrant",
        CircuitBreakerConfig(failure_threshold=5, timeout_seconds=45),
    ),

    # Database — very fast recovery expected
    "postgres": CircuitBreaker(
        "postgres",
        CircuitBreakerConfig(failure_threshold=3, timeout_seconds=20),
    ),

    # Cache — fastest recovery
    "redis": CircuitBreaker(
        "redis",
        CircuitBreakerConfig(failure_threshold=3, timeout_seconds=15),
    ),

    # External API — generous timeout (rate limits, outages)
    "github_api": CircuitBreaker(
        "github_api",
        CircuitBreakerConfig(failure_threshold=5, timeout_seconds=120),
    ),
}


def get_circuit_breaker(service: str) -> CircuitBreaker:
    """Get circuit breaker by service name. Raises KeyError if unknown."""
    if service not in CIRCUIT_BREAKERS:
        raise KeyError(
            f"No circuit breaker registered for '{service}'. "
            f"Available: {list(CIRCUIT_BREAKERS.keys())}"
        )
    return CIRCUIT_BREAKERS[service]


def get_all_circuit_metrics() -> list[dict]:
    """Get metrics from all circuit breakers for the health dashboard."""
    return [cb.get_metrics() for cb in CIRCUIT_BREAKERS.values()]

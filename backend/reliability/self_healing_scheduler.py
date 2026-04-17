"""
═══════════════════════════════════════════════════════════
Self-Healing Scheduler — ANTIGRAVITY OS v2 (§22.5)
═══════════════════════════════════════════════════════════

Every scheduled task has:
  - Max retry count with exponential backoff
  - Dead letter queue for permanent failures
  - Auto-alerting on consecutive failures
  - Graceful skip on dependency unavailability
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

from backend.reliability.circuit_breaker import CIRCUIT_BREAKERS, CircuitState

logger = logging.getLogger("portfolio.reliability.scheduler")


# ═══════════════════════════════════════════════════════════
# BACKOFF STRATEGIES
# ═══════════════════════════════════════════════════════════

class BackoffStrategy(Enum):
    EXPONENTIAL = "exponential"       # 1min, 2min, 4min, 8min...
    LINEAR = "linear"                 # 5min, 10min, 15min...
    FIXED = "fixed"                   # Same delay every time


def compute_backoff(strategy: BackoffStrategy, attempt: int, base: float = 60.0) -> float:
    """Compute wait time in seconds for a retry attempt."""
    if strategy == BackoffStrategy.EXPONENTIAL:
        return min(base * (2 ** attempt), 1800)  # Cap at 30 min
    elif strategy == BackoffStrategy.LINEAR:
        return min(base * (attempt + 1), 1800)
    else:
        return base


# ═══════════════════════════════════════════════════════════
# TASK POLICY
# ═══════════════════════════════════════════════════════════

@dataclass
class TaskPolicy:
    """Retry and failure handling policy for a scheduled task."""
    name: str
    schedule_description: str
    max_retries: int = 3
    backoff: BackoffStrategy = BackoffStrategy.EXPONENTIAL
    backoff_base_seconds: float = 60.0
    skip_if_services_down: List[str] = field(default_factory=list)
    alert_after_consecutive_failures: int = 3


# ═══════════════════════════════════════════════════════════
# DEAD LETTER ENTRY
# ═══════════════════════════════════════════════════════════

@dataclass
class DeadLetterEntry:
    """Permanently failed task — for review."""
    task_name: str
    error: str
    attempts: int
    failed_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    context: Dict[str, Any] = field(default_factory=dict)


# ═══════════════════════════════════════════════════════════
# TASK POLICIES REGISTRY
# ═══════════════════════════════════════════════════════════

TASK_POLICIES: Dict[str, TaskPolicy] = {
    "freshness_sweep": TaskPolicy(
        name="freshness_sweep",
        schedule_description="every 30 minutes",
        max_retries=3,
        backoff=BackoffStrategy.EXPONENTIAL,
        backoff_base_seconds=300,  # 5min, 10min, 20min
        skip_if_services_down=["qdrant", "postgres"],
        alert_after_consecutive_failures=3,
    ),
    "github_sync": TaskPolicy(
        name="github_sync",
        schedule_description="every 6 hours",
        max_retries=5,
        backoff=BackoffStrategy.LINEAR,
        backoff_base_seconds=600,  # 10min increments
        skip_if_services_down=["github_api"],
        alert_after_consecutive_failures=2,
    ),
    "kg_builder": TaskPolicy(
        name="kg_builder",
        schedule_description="nightly at 2am",
        max_retries=2,
        backoff=BackoffStrategy.EXPONENTIAL,
        backoff_base_seconds=600,
        skip_if_services_down=["postgres"],
        alert_after_consecutive_failures=5,
    ),
    "conversion_analysis": TaskPolicy(
        name="conversion_analysis",
        schedule_description="weekly on Sunday midnight",
        max_retries=1,
        backoff=BackoffStrategy.FIXED,
        backoff_base_seconds=3600,  # Retry after 1 hour
        skip_if_services_down=[],
        alert_after_consecutive_failures=10,
    ),
    "opportunity_scan": TaskPolicy(
        name="opportunity_scan",
        schedule_description="daily at 6am",
        max_retries=2,
        backoff=BackoffStrategy.EXPONENTIAL,
        backoff_base_seconds=1800,
        skip_if_services_down=[],
        alert_after_consecutive_failures=3,
    ),
    "portfolio_update_proposals": TaskPolicy(
        name="portfolio_update_proposals",
        schedule_description="weekly on Monday 9am",
        max_retries=1,
        backoff=BackoffStrategy.FIXED,
        backoff_base_seconds=3600,
        skip_if_services_down=["github_api", "postgres"],
        alert_after_consecutive_failures=4,
    ),
}


# ═══════════════════════════════════════════════════════════
# SELF-HEALING SCHEDULER
# ═══════════════════════════════════════════════════════════

class SelfHealingScheduler:
    """
    Wraps any async task function with retry, backoff, circuit-breaker
    awareness, and dead letter handling.

    Usage:
        scheduler = SelfHealingScheduler()

        @scheduler.register("freshness_sweep")
        async def sweep_stale_chunks():
            ...

        # Execute with full healing:
        await scheduler.execute("freshness_sweep")
    """

    def __init__(self):
        self._registered_tasks: Dict[str, Callable] = {}
        self._consecutive_failures: Dict[str, int] = {}
        self._dead_letter_queue: List[DeadLetterEntry] = []
        self._last_success: Dict[str, float] = {}

    def register(self, task_name: str):
        """Decorator to register a task function."""
        def decorator(func: Callable):
            self._registered_tasks[task_name] = func
            return func
        return decorator

    async def execute(self, task_name: str, **kwargs) -> bool:
        """
        Execute a task with full self-healing.
        Returns True if task succeeded, False otherwise.
        """
        if task_name not in TASK_POLICIES:
            logger.error(f"No policy found for task '{task_name}'")
            return False

        if task_name not in self._registered_tasks:
            logger.error(f"No function registered for task '{task_name}'")
            return False

        policy = TASK_POLICIES[task_name]
        func = self._registered_tasks[task_name]

        # Check if dependencies are available
        should_skip, skip_reason = self._check_dependencies(policy)
        if should_skip:
            logger.info(
                f"⏭️ Skipping {task_name}: {skip_reason}"
            )
            return False

        # Retry loop
        for attempt in range(policy.max_retries + 1):
            try:
                await func(**kwargs)
                self._on_success(task_name)
                return True

            except Exception as e:
                is_last_attempt = attempt >= policy.max_retries
                self._on_failure(task_name, e, attempt, is_last_attempt, policy)

                if is_last_attempt:
                    break

                # Backoff before retry
                wait_time = compute_backoff(
                    policy.backoff, attempt, policy.backoff_base_seconds
                )
                logger.info(
                    f"⏳ {task_name} retry {attempt + 1}/{policy.max_retries} "
                    f"in {wait_time:.0f}s"
                )
                await asyncio.sleep(wait_time)

        return False

    def _check_dependencies(self, policy: TaskPolicy) -> tuple[bool, str]:
        """Check if required services are available via circuit breakers."""
        for service in policy.skip_if_services_down:
            if service in CIRCUIT_BREAKERS:
                cb = CIRCUIT_BREAKERS[service]
                if cb.state == CircuitState.OPEN:
                    return True, f"{service} circuit is OPEN"
        return False, ""

    def _on_success(self, task_name: str):
        """Handle task success."""
        self._consecutive_failures[task_name] = 0
        self._last_success[task_name] = time.time()
        logger.info(f"✅ {task_name} completed successfully")

    def _on_failure(
        self,
        task_name: str,
        error: Exception,
        attempt: int,
        is_final: bool,
        policy: TaskPolicy,
    ):
        """Handle task failure."""
        self._consecutive_failures[task_name] = (
            self._consecutive_failures.get(task_name, 0) + 1
        )
        consecutive = self._consecutive_failures[task_name]

        if is_final:
            # Dead letter it
            self._dead_letter_queue.append(
                DeadLetterEntry(
                    task_name=task_name,
                    error=str(error),
                    attempts=attempt + 1,
                )
            )
            logger.error(
                f"💀 {task_name} permanently failed after {attempt + 1} attempts. "
                f"Error: {error}. Moved to dead letter queue."
            )

        # Alert on consecutive failures
        if consecutive >= policy.alert_after_consecutive_failures:
            logger.critical(
                f"🚨 ALERT: {task_name} has failed {consecutive} consecutive times. "
                f"Last error: {error}"
            )

    def get_dead_letter_queue(self) -> List[DeadLetterEntry]:
        """Return dead letter entries for review."""
        return list(self._dead_letter_queue)

    def get_task_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all registered tasks."""
        status = {}
        for name in TASK_POLICIES:
            last = self._last_success.get(name)
            status[name] = {
                "registered": name in self._registered_tasks,
                "consecutive_failures": self._consecutive_failures.get(name, 0),
                "last_success": (
                    datetime.fromtimestamp(last, tz=timezone.utc).isoformat()
                    if last else None
                ),
                "schedule": TASK_POLICIES[name].schedule_description,
            }
        return status


# Singleton
scheduler = SelfHealingScheduler()

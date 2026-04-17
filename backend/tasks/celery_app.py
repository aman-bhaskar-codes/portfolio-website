"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Celery Application (§20)
═══════════════════════════════════════════════════════════

Background task queue for heavy lifting, async syncs, and 
scheduled cron jobs. Backed by Redis.
"""

from __future__ import annotations

import os

from celery import Celery
from celery.schedules import crontab

from backend.config import settings

# Initialize Celery
# If REDIS_URL isn't set (e.g. during local non-docker testing), use a safe fallback
broker_url = settings.REDIS_URL or "redis://localhost:6379/0"

app = Celery(
    "antigravity",
    broker=broker_url,
    backend=broker_url,
    include=[
        "backend.tasks.ingest_tasks",
        "backend.tasks.sync_tasks",
    ]
)

# Optional configuration settings
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Tasks can't run longer than 1 hour to prevent stuck workers
    task_time_limit=3600,
    worker_prefetch_multiplier=1,  # Fair dispatch
)

# Scheduled cron jobs
app.conf.beat_schedule = {
    # Every hour: sync GitHub (fallback for webhook)
    "github-sync": {
        "task": "backend.tasks.sync_tasks.sync_github_all",
        "schedule": crontab(minute="0"),
    },
    
    # Every 15 minutes: evaluate freshness of RAG chunks
    "freshness-sweep": {
        "task": "backend.tasks.sync_tasks.run_freshness_sweep",
        "schedule": crontab(minute="*/15"),
    },
    
    # Daily at 3 AM: Compress episodic memory (Tier 2)
    "memory-compress": {
        "task": "backend.tasks.sync_tasks.compress_episodic_memory",
        "schedule": crontab(hour="3", minute="0"),
    },
    
    # Daily at 4 AM: Run RAG evaluation via Ragas
    "ragas-evaluation": {
        "task": "backend.tasks.sync_tasks.run_ragas_evaluation",
        "schedule": crontab(hour="4", minute="0"),
    },
    
    # Weekly on Sunday at 2 AM: DSPy constraint optimization
    "dspy-optimization": {
        "task": "backend.tasks.sync_tasks.run_dspy_optimization",
        "schedule": crontab(day_of_week="0", hour="2", minute="0"),
    },
}

if __name__ == "__main__":
    app.start()

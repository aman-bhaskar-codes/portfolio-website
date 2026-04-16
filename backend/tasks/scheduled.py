"""
Celery scheduled tasks — periodic jobs for knowledge freshness.

Beat Schedule:
  Every 6h  → Re-ingest GitHub repos
  Every 24h → Compress episodic memories
  Every 24h → Prune anonymous sessions older than 7 days
  Every 1h  → Refresh social media caches
"""

import logging
from datetime import timedelta, datetime, timezone

from celery import shared_task

from backend.tasks.celery_app import celery_app

logger = logging.getLogger("portfolio.tasks")


# ═══════════════════════════════════════════════════════════
# BEAT SCHEDULE
# ═══════════════════════════════════════════════════════════

celery_app.conf.beat_schedule = {
    "github-re-ingest": {
        "task": "backend.tasks.scheduled.ingest_github_repos",
        "schedule": timedelta(hours=6),
    },
    "compress-episodes": {
        "task": "backend.tasks.scheduled.compress_old_episodes",
        "schedule": timedelta(hours=24),
    },
    "prune-anonymous": {
        "task": "backend.tasks.scheduled.prune_anonymous_sessions",
        "schedule": timedelta(hours=24),
    },
    "refresh-social-cache": {
        "task": "backend.tasks.scheduled.refresh_social_cache",
        "schedule": timedelta(hours=1),
    },
}


# ═══════════════════════════════════════════════════════════
# TASKS
# ═══════════════════════════════════════════════════════════

@shared_task(name="backend.tasks.scheduled.ingest_github_repos")
def ingest_github_repos():
    """
    Fetch updated READMEs from GitHub and re-ingest into vector store.
    Runs every 6 hours to keep project descriptions fresh.
    """
    import asyncio
    asyncio.run(_async_ingest_github())


async def _async_ingest_github():
    """Async implementation of GitHub ingestion."""
    import httpx
    from backend.config.settings import settings
    from backend.rag.ingestion import parse_github_readme
    from backend.rag.embedder import embedder

    username = settings.GITHUB_USERNAME
    if not username:
        logger.warning("GitHub username not configured — skipping ingestion")
        return

    headers = {"Accept": "application/vnd.github.v3+json"}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            # Fetch repos
            resp = await client.get(
                f"https://api.github.com/users/{username}/repos",
                headers=headers,
                params={"sort": "updated", "per_page": 15},
            )
            repos = resp.json() if resp.status_code == 200 else []

            total_chunks = 0
            for repo in repos:
                if not isinstance(repo, dict):
                    continue
                repo_name = repo.get("name", "")
                
                # Fetch README
                readme_resp = await client.get(
                    f"https://api.github.com/repos/{username}/{repo_name}/readme",
                    headers={**headers, "Accept": "application/vnd.github.v3.raw"},
                )
                if readme_resp.status_code == 200:
                    chunks = parse_github_readme(repo_name, readme_resp.text)
                    total_chunks += len(chunks)

            logger.info(f"GitHub ingestion: {total_chunks} chunks from {len(repos)} repos")

    except Exception as e:
        logger.error(f"GitHub ingestion failed: {e}")


@shared_task(name="backend.tasks.scheduled.compress_old_episodes")
def compress_old_episodes():
    """
    Find sessions with many turns that haven't been compressed
    and trigger episodic compression.
    """
    logger.info("Episodic compression task started")
    # TODO: Query sessions with turn_count > 10 and no recent episode
    # For each, trigger the memory_manager._compress_to_episodic


@shared_task(name="backend.tasks.scheduled.prune_anonymous_sessions")
def prune_anonymous_sessions():
    """
    Delete anonymous session data older than ANONYMOUS_PRUNE_DAYS.
    Keeps storage bounded and GDPR-compliant.
    """
    import asyncio
    asyncio.run(_async_prune())


async def _async_prune():
    """Async implementation of anonymous session pruning."""
    from backend.config.constants import MEMORY_CONFIG

    prune_days = MEMORY_CONFIG["anonymous_prune_days"]
    cutoff = datetime.now(timezone.utc) - timedelta(days=prune_days)

    try:
        from backend.db.session import async_session
        from sqlalchemy import text

        async with async_session() as db:
            result = await db.execute(
                text("""
                    DELETE FROM user_sessions 
                    WHERE is_authenticated = False 
                    AND last_active_at < :cutoff
                """),
                {"cutoff": cutoff},
            )
            await db.commit()
            logger.info(f"Pruned anonymous sessions older than {prune_days} days")

    except Exception as e:
        logger.error(f"Session pruning failed: {e}")


@shared_task(name="backend.tasks.scheduled.refresh_social_cache")
def refresh_social_cache():
    """
    Pre-warm social media caches so first requests are instant.
    """
    import asyncio
    asyncio.run(_async_refresh_social())


async def _async_refresh_social():
    """Async implementation of social cache refresh."""
    try:
        from backend.agents.social_agent import _fetch_github
        await _fetch_github()
        logger.info("Social cache refreshed: GitHub")
    except Exception as e:
        logger.error(f"Social cache refresh failed: {e}")

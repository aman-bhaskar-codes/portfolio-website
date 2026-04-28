"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — GitHub Webhook API
═══════════════════════════════════════════════════════════

Listens for push events from GitHub to trigger live RAG re-ingestion.
Keeps the portfolio instantly up-to-date with code changes.
"""

from __future__ import annotations

import hmac
import logging

from fastapi import APIRouter, Header, HTTPException, Request

from backend.config import settings

router = APIRouter(prefix="/api/webhook", tags=["Integration"])
logger = logging.getLogger("portfolio.api.webhook")


def verify_github_signature(payload: bytes, signature: str) -> bool:
    """Verify HMAC signature from GitHub payload."""
    if not settings.GITHUB_WEBHOOK_SECRET:
        logger.error("GITHUB_WEBHOOK_SECRET is not configured.")
        return False
        
    if not signature:
        return False
        
    expected = hmac.new(
        settings.GITHUB_WEBHOOK_SECRET.encode(),
        payload,
        "sha256"
    ).hexdigest()
    
    return hmac.compare_digest(f"sha256={expected}", signature)


@router.post("/github")
async def github_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None),
    x_github_event: str = Header(None),
) -> dict:
    """
    POST /api/webhook/github
    Triggers code re-ingestion when new code is pushed.
    """
    payload_body = await request.body()
    
    if not verify_github_signature(payload_body, x_hub_signature_256 or ""):
        logger.warning("Invalid GitHub webhook signature")
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Only care about pushes to main/master
    if x_github_event == "push":
        try:
            payload = await request.json()
            ref = payload.get("ref", "")
            if ref in ("refs/heads/main", "refs/heads/master"):
                repo = payload.get("repository", {}).get("full_name")
                logger.info(f"GitHub push detected on {repo} — triggering RAG sync")
                # Trigger celery task here:
                # sync_tasks.sync_github_repo.delay(repo)
                return {"status": "accepted", "action": "sync_queued"}
        except Exception as e:
            logger.error(f"Error processing webhook: {e}")
            raise HTTPException(status_code=400, detail="Parse error")

    return {"status": "ignored", "reason": "Not a main branch push"}

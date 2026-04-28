"""
═══════════════════════════════════════════════════════════
New API Endpoints — ANTIGRAVITY OS Extension
═══════════════════════════════════════════════════════════

POST /api/brief/generate    → Recruiter brief PDF
POST /api/webhooks/github   → GitHub event processor
GET  /api/github/activity   → Cached GitHub events
GET  /api/ambient/suggestion → Ambient intelligence trigger
GET  /api/kg/skills          → Knowledge graph skill profile
"""

from __future__ import annotations

import json
import hashlib
import hmac
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Request, Response, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from backend.brief.generator import RecruiterBriefGenerator
from backend.intelligence.github_event_processor import (
    GitHubEventProcessor, GitHubPushEvent, GitHubPREvent,
)
from backend.agents.ambient_intelligence import (
    AmbientIntelligenceAgent, VisitorContext,
)
from backend.intelligence.visitor_classifier import VisitorPersona

logger = logging.getLogger("portfolio.api.antigravity")

router = APIRouter(tags=["antigravity"])


# ═══════════════════════════════════════════════════════════
# RECRUITER BRIEF
# ═══════════════════════════════════════════════════════════

class BriefRequest(BaseModel):
    company: str = ""
    persona: str = "technical_recruiter"
    tech_stack: Optional[List[str]] = None


@router.post("/api/brief/generate")
async def generate_brief(req: BriefRequest):
    """Generate a personalized recruiter brief as HTML."""
    generator = RecruiterBriefGenerator()
    html = generator.generate_brief(
        visitor_company=req.company,
        visitor_persona=req.persona,
        company_tech_stack=req.tech_stack,
    )
    return Response(
        content=html,
        media_type="text/html",
        headers={"Content-Disposition": "inline; filename=recruiter_brief.html"},
    )


# ═══════════════════════════════════════════════════════════
# GITHUB WEBHOOK
# ═══════════════════════════════════════════════════════════

@router.post("/api/webhooks/github")
async def github_webhook(request: Request):
    """Receive and process GitHub webhook events."""
    body = await request.body()
    event_type = request.headers.get("X-GitHub-Event", "")
    signature = request.headers.get("X-Hub-Signature-256", "")

    processor = GitHubEventProcessor()

    # Verify signature if configured
    webhook_secret = request.app.state.settings.GITHUB_WEBHOOK_SECRET if hasattr(request.app.state, "settings") else ""
    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    if not signature or not processor.verify_signature(body, signature, webhook_secret):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    payload = json.loads(body)

    if event_type == "push":
        event = GitHubPushEvent(
            ref=payload.get("ref", ""),
            repository=payload.get("repository", {}).get("name", ""),
            commits=payload.get("commits", []),
            sender=payload.get("sender", {}).get("login", ""),
        )
        narratives = await processor.on_push(event)
        return {"processed": len(narratives), "event": "push"}

    elif event_type == "pull_request":
        pr = payload.get("pull_request", {})
        pr_event = GitHubPREvent(
            action=payload.get("action", ""),
            title=pr.get("title", ""),
            body=pr.get("body", ""),
            repository=payload.get("repository", {}).get("name", ""),
            merged=pr.get("merged", False),
        )
        narrative = await processor.on_pull_request(pr_event)
        return {"processed": 1 if narrative else 0, "event": "pull_request"}

    elif event_type == "release":
        release = payload.get("release", {})
        narrative = await processor.on_release(
            repo=payload.get("repository", {}).get("name", ""),
            tag=release.get("tag_name", ""),
            body=release.get("body", ""),
        )
        return {"processed": 1, "event": "release"}

    return {"processed": 0, "event": event_type, "status": "ignored"}


# ═══════════════════════════════════════════════════════════
# GITHUB ACTIVITY FEED
# ═══════════════════════════════════════════════════════════

@router.get("/api/github/activity")
async def github_activity(request: Request):
    """
    Return recent GitHub activity for the live feed.
    Cached in Redis with 60s TTL.
    """
    import httpx
    from backend.config.settings import settings

    # Check Redis cache first
    redis = getattr(request.app.state, "redis", None)
    if redis:
        cached = await redis.get("github:activity_feed")
        if cached:
            data = cached.decode() if isinstance(cached, bytes) else cached
            return json.loads(data)

    # Fetch from GitHub API
    try:
        headers = {"Accept": "application/vnd.github.v3+json"}
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"https://api.github.com/users/{settings.GITHUB_USERNAME}/events",
                headers=headers,
                params={"per_page": 10},
            )
            if resp.status_code != 200:
                return {"events": []}

            raw_events = resp.json()
            events = []
            for e in raw_events[:7]:
                event = _parse_github_event(e)
                if event:
                    events.append(event)

            result = {"events": events}

            # Cache for 60s
            if redis:
                await redis.set("github:activity_feed", json.dumps(result), ex=60)

            return result

    except Exception as exc:
        logger.warning(f"GitHub activity fetch failed: {exc}")
        return {"events": []}


def _parse_github_event(raw: dict) -> Optional[dict]:
    """Parse a raw GitHub event into our feed format."""
    event_type = raw.get("type", "")
    repo = raw.get("repo", {}).get("name", "").split("/")[-1]
    created = raw.get("created_at", "")
    payload = raw.get("payload", {})

    if event_type == "PushEvent":
        commits = payload.get("commits", [])
        message = commits[0].get("message", "").split("\n")[0] if commits else "pushed changes"
        return {"id": raw.get("id", ""), "type": "push", "repo": repo, "message": message, "timestamp": created}

    elif event_type == "PullRequestEvent":
        title = payload.get("pull_request", {}).get("title", "PR")
        return {"id": raw.get("id", ""), "type": "pr", "repo": repo, "message": title, "timestamp": created}

    elif event_type == "CreateEvent":
        ref_type = payload.get("ref_type", "")
        ref = payload.get("ref", "")
        return {"id": raw.get("id", ""), "type": "create", "repo": repo, "message": f"created {ref_type} {ref}", "timestamp": created}

    elif event_type == "ReleaseEvent":
        tag = payload.get("release", {}).get("tag_name", "")
        return {"id": raw.get("id", ""), "type": "release", "repo": repo, "message": f"released {tag}", "timestamp": created}

    return None


# ═══════════════════════════════════════════════════════════
# AMBIENT INTELLIGENCE
# ═══════════════════════════════════════════════════════════

@router.get("/api/ambient/suggestion")
async def ambient_suggestion(request: Request):
    """
    Evaluate ambient triggers for the current visitor.
    Returns at most one suggestion per session.
    """
    # Build visitor context from request headers/cookies
    # Build visitor context from request headers/cookies with validation
    persona_cookie = request.cookies.get("visitor_persona", "casual")
    if persona_cookie not in [p.value for p in VisitorPersona]:
        persona_cookie = "casual"
        
    visit_count_str = request.cookies.get("visit_count", "1")
    try:
        visit_count = int(visit_count_str)
        if visit_count < 1 or visit_count > 10000:
            visit_count = 1
    except ValueError:
        visit_count = 1

    company_cookie = request.cookies.get("visitor_company", "")[:100]  # Limit length

    context = VisitorContext(
        visitor_id=request.cookies.get("visitor_id", "anonymous")[:50],
        persona=VisitorPersona(persona_cookie),
        visit_count=visit_count,
        time_of_day=datetime.now().hour,
        is_weekday=datetime.now().weekday() < 5,
    )

    agent = AmbientIntelligenceAgent()
    suggestion = await agent.evaluate(context)

    if suggestion:
        return {"suggestion": suggestion.model_dump()}
    return {"suggestion": None}


# ═══════════════════════════════════════════════════════════
# KNOWLEDGE GRAPH
# ═══════════════════════════════════════════════════════════

@router.get("/api/kg/skills")
async def kg_skill_profile():
    """Return skill depth profile from knowledge graph."""
    # This endpoint will be fully wired when KG is populated
    return {
        "skills": [
            {"skill": "Agent Orchestration", "project_count": 3, "avg_weight": 0.92},
            {"skill": "RAG Architecture", "project_count": 3, "avg_weight": 0.90},
            {"skill": "Distributed Systems", "project_count": 2, "avg_weight": 0.85},
            {"skill": "Memory Systems", "project_count": 2, "avg_weight": 0.88},
            {"skill": "Production Infrastructure", "project_count": 3, "avg_weight": 0.82},
            {"skill": "Frontend Engineering", "project_count": 2, "avg_weight": 0.75},
        ]
    }

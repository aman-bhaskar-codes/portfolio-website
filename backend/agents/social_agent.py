"""
Social Proof Agent — fetches live data from GitHub, LinkedIn, Instagram.
Uses Redis caching with per-platform TTLs.
Model: llama3.2:3b for summarization.
"""

import json
import logging
from typing import Optional

import httpx
import redis.asyncio as aioredis

from backend.agents.state import AgentState
from backend.config.settings import settings

logger = logging.getLogger("portfolio.agents.social")


async def social_agent_node(state: AgentState) -> AgentState:
    """
    LangGraph node: fetch social media data and summarize.
    
    Writes to state:
        - social_data: dict with github, linkedin, instagram data
        - citations: social platform citations
    """
    query = state["query"]
    social_data = {}
    
    # Determine which platforms are relevant
    query_lower = query.lower()
    
    try:
        if "github" in query_lower or "repo" in query_lower or "code" in query_lower:
            social_data["github"] = await _fetch_github()
        
        if "linkedin" in query_lower or "experience" in query_lower or "work" in query_lower:
            social_data["linkedin"] = await _fetch_linkedin()
        
        if "instagram" in query_lower or "post" in query_lower or "photo" in query_lower:
            social_data["instagram"] = await _fetch_instagram()
        
        # Default: fetch GitHub if nothing specific
        if not social_data:
            social_data["github"] = await _fetch_github()
        
        state["social_data"] = social_data
        state["citations"] = list(social_data.keys())
        
        logger.info(f"Social agent fetched: {list(social_data.keys())}")
        
    except Exception as e:
        logger.error(f"Social agent error: {e}")
        state["social_data"] = {}
        state["error"] = f"Social data fetch failed: {str(e)[:100]}"
    
    return state


async def _get_cached(key: str, ttl: int) -> Optional[dict]:
    """Check Redis cache for social data."""
    try:
        r = aioredis.from_url(settings.REDIS_URL)
        cached = await r.get(f"social:{key}")
        await r.aclose()
        if cached:
            return json.loads(cached)
    except Exception:
        pass
    return None


async def _set_cached(key: str, data: dict, ttl: int):
    """Store data in Redis cache with TTL."""
    try:
        r = aioredis.from_url(settings.REDIS_URL)
        await r.setex(f"social:{key}", ttl, json.dumps(data))
        await r.aclose()
    except Exception as e:
        logger.warning(f"Redis cache write failed: {e}")


async def _fetch_github() -> dict:
    """Fetch GitHub profile and repos data."""
    # Check cache
    cached = await _get_cached("github", settings.REDIS_CACHE_TTL_GITHUB)
    if cached:
        logger.debug("GitHub: cache hit")
        return cached
    
    username = settings.GITHUB_USERNAME
    token = settings.GITHUB_TOKEN
    
    if not username:
        return {"error": "GitHub username not configured"}
    
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Fetch profile
            profile_resp = await client.get(
                f"https://api.github.com/users/{username}",
                headers=headers,
            )
            profile = profile_resp.json() if profile_resp.status_code == 200 else {}
            
            # Fetch repos
            repos_resp = await client.get(
                f"https://api.github.com/users/{username}/repos",
                headers=headers,
                params={"sort": "updated", "per_page": 10},
            )
            repos = repos_resp.json() if repos_resp.status_code == 200 else []
        
        data = {
            "profile": {
                "name": profile.get("name", username),
                "bio": profile.get("bio", ""),
                "public_repos": profile.get("public_repos", 0),
                "followers": profile.get("followers", 0),
                "following": profile.get("following", 0),
                "url": profile.get("html_url", f"https://github.com/{username}"),
            },
            "repos": [
                {
                    "name": repo.get("name", ""),
                    "description": repo.get("description", ""),
                    "language": repo.get("language", ""),
                    "stars": repo.get("stargazers_count", 0),
                    "forks": repo.get("forks_count", 0),
                    "url": repo.get("html_url", ""),
                    "updated_at": repo.get("updated_at", ""),
                }
                for repo in (repos if isinstance(repos, list) else [])
            ],
        }
        
        # Cache the result
        await _set_cached("github", data, settings.REDIS_CACHE_TTL_GITHUB)
        return data
        
    except Exception as e:
        logger.error(f"GitHub fetch error: {e}")
        return {"error": str(e)}


async def _fetch_linkedin() -> dict:
    """
    Fetch LinkedIn data. 
    Requires API key setup — returns placeholder if not configured.
    """
    cached = await _get_cached("linkedin", settings.REDIS_CACHE_TTL_LINKEDIN)
    if cached:
        return cached
    
    if not settings.LINKEDIN_API_KEY:
        return {
            "status": "not_configured",
            "message": "LinkedIn API key not set. Visit linkedin.com/in/username for profile.",
        }
    
    # TODO: Implement LinkedIn API integration when key is available
    return {"status": "pending_configuration"}


async def _fetch_instagram() -> dict:
    """
    Fetch Instagram posts.
    Requires Basic Display API token — returns placeholder if not configured.
    """
    cached = await _get_cached("instagram", settings.REDIS_CACHE_TTL_INSTAGRAM)
    if cached:
        return cached
    
    if not settings.INSTAGRAM_ACCESS_TOKEN:
        return {
            "status": "not_configured",
            "message": "Instagram API not configured.",
        }
    
    # TODO: Implement Instagram Basic Display API when token is available
    return {"status": "pending_configuration"}

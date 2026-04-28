"""
Auth & Rate Limiting Middleware.
Provides:
  - JWT token verification (optional — anonymous is allowed)
  - Redis-backed rate limiting (per-IP for anon, per-user for auth)
  - Request ID injection for tracing
"""

import time
import uuid
import logging
from typing import Optional

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response, JSONResponse

from backend.config.settings import settings

logger = logging.getLogger("portfolio.auth")


class AuthRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Combined auth + rate limiting middleware.
    
    Flow:
      1. Generate request ID
      2. Extract JWT token (if present)
      3. Check rate limit (Redis)
      4. Inject user context into request.state
    """

    def __init__(self, app, **kwargs):
        super().__init__(app, **kwargs)
        self._redis = None

    async def _get_redis(self):
        """Lazy Redis connection."""
        if self._redis is None:
            try:
                import redis.asyncio as aioredis
                self._redis = aioredis.from_url(settings.REDIS_URL)
            except Exception as e:
                logger.warning(f"Redis unavailable for rate limiting: {e}")
        return self._redis

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # ── 1. Skip non-API routes ──
        path = request.url.path
        if not path.startswith("/api") and path not in ("/health", "/metrics"):
            return await call_next(request)

        # ── 2. Generate request ID ──
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        # ── 3. Extract user identity ──
        user_id = "anonymous"
        is_authenticated = False
        
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            user_info = await self._verify_token(token)
            if user_info:
                user_id = user_info["user_id"]
                is_authenticated = True

        request.state.user_id = user_id
        request.state.is_authenticated = is_authenticated

        # ── 4. Rate limiting ──
        client_ip = request.client.host if request.client else "unknown"
        rate_key = f"rate:{user_id}" if is_authenticated else f"rate:ip:{client_ip}"
        
        limit_per_min = (
            settings.RATE_LIMIT_AUTH_PER_MIN
            if is_authenticated
            else settings.RATE_LIMIT_ANON_PER_MIN
        )

        is_allowed = await self._check_rate_limit(rate_key, limit_per_min)
        if not is_allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "retry_after_seconds": 60,
                    "limit": limit_per_min,
                },
                headers={"Retry-After": "60"},
            )

        # ── 5. Process request ──
        response = await call_next(request)
        
        # Add tracing headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-RateLimit-Limit"] = str(limit_per_min)
        
        return response

    async def _verify_token(self, token: str) -> Optional[dict]:
        """
        Verify JWT token. Returns user info dict or None.
        Supports both custom JWT and Clerk tokens.
        """
        try:
            from jose import jwt, JWTError
            
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM],
            )
            user_id = payload.get("sub")
            if user_id:
                return {"user_id": user_id, "payload": payload}
        except Exception:
            pass
        
        return None

    async def _check_rate_limit(self, key: str, limit: int) -> bool:
        """
        Sliding window rate limiting using Redis.
        Returns True if request is allowed, False if rate limited.
        """
        redis_client = await self._get_redis()
        if redis_client is None:
            logger.error("Redis unavailable, rate limit failing closed to prevent DoS")
            return False  # Fail closed

        try:
            current_time = int(time.time())
            window_key = f"{key}:{current_time // 60}"  # Per-minute window
            
            count = await redis_client.incr(window_key)
            if count == 1:
                await redis_client.expire(window_key, 120)  # Expire after 2 minutes
            
            return count <= limit
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            return False  # Fail closed


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https: wss:;"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
        
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response

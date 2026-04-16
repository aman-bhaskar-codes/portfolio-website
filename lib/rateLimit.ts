/**
 * Rate Limiter — Tiered IP + User-Based
 *
 * Supports two modes:
 *   1. Anonymous (IP-based): 30 requests/minute
 *   2. Authenticated (user-based): 60 requests/minute
 *
 * No Redis dependency — in-memory with automatic cleanup.
 * Production-safe with per-user tracking when userId is provided.
 */

import { NextRequest, NextResponse } from "next/server";

interface RateEntry {
    count: number;
    resetAt: number;
}

const rateLimits = new Map<string, RateEntry>();

// Rate tiers
const TIERS = {
    anonymous: { maxRequests: 30, windowMs: 60_000 },
    authenticated: { maxRequests: 60, windowMs: 60_000 },
} as const;

// Cleanup stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    Array.from(rateLimits.entries()).forEach(([key, entry]) => {
        if (now > entry.resetAt) rateLimits.delete(key);
    });
}, 5 * 60_000);

/**
 * Rate limit check.
 * @param req - NextRequest
 * @param userId - Optional authenticated user ID for tiered limits
 * @returns NextResponse if rate limited, null if allowed
 */
export function rateLimit(
    req: NextRequest,
    userId?: string | null
): NextResponse | null {
    const isAuthenticated = !!userId;
    const tier = isAuthenticated ? TIERS.authenticated : TIERS.anonymous;

    // Use userId if authenticated, otherwise fall back to IP
    const key = isAuthenticated
        ? `user:${userId}`
        : `ip:${getClientIP(req)}`;

    const now = Date.now();
    const entry = rateLimits.get(key);

    if (!entry || now > entry.resetAt) {
        rateLimits.set(key, { count: 1, resetAt: now + tier.windowMs });
        return null; // allowed
    }

    entry.count++;

    if (entry.count > tier.maxRequests) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return NextResponse.json(
            {
                error: "Rate limit exceeded. Try again shortly.",
                retryAfter,
            },
            {
                status: 429,
                headers: {
                    "Retry-After": String(retryAfter),
                    "X-RateLimit-Limit": String(tier.maxRequests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": String(entry.resetAt),
                },
            }
        );
    }

    return null; // allowed
}

/**
 * Extracts client IP from request headers.
 */
function getClientIP(req: NextRequest): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown"
    );
}

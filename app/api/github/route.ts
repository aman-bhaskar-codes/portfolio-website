import { NextResponse } from 'next/server'
import { fetchUserRepos, fetchUserStats, FALLBACK_REPOS, FALLBACK_STATS } from '@/lib/github-agent'

// Cache for 1 hour
let cache: { repos: unknown; stats: unknown; cachedAt: number } | null = null
const CACHE_TTL = 3600_000

export async function GET() {
  const now = Date.now()
  if (cache && now - cache.cachedAt < CACHE_TTL) {
    return NextResponse.json(cache, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  }

  try {
    const [repos, stats] = await Promise.all([
      fetchUserRepos(),
      fetchUserStats(),
    ])

    cache = { repos, stats, cachedAt: now }
    return NextResponse.json({ repos, stats })
  } catch {
    return NextResponse.json({
      repos: FALLBACK_REPOS,
      stats: FALLBACK_STATS,
      cached: true,
    })
  }
}

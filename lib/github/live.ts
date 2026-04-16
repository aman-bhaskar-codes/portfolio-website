/**
 * GitHub Live Injection — On-Demand Fetcher
 * 
 * Only called when intent === "github".
 * Fetches recent activity and injects directly into prompt context
 * WITHOUT embedding (to avoid latency on live data).
 */

interface GitHubRepo {
    name: string;
    full_name: string;
    description: string | null;
    updated_at: string;
    language: string | null;
    stargazers_count: number;
}

/**
 * Fetches recent GitHub repos for the configured user.
 * Uses GITHUB_TOKEN from env if available for higher rate limits.
 */
export async function fetchRecentActivity(): Promise<string> {
    const token = process.env.GITHUB_TOKEN;
    const username = process.env.GITHUB_USERNAME || "amanbhaskar";

    try {
        const headers: Record<string, string> = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "portfolio-ai",
        };
        if (token) {
            headers["Authorization"] = `token ${token}`;
        }

        const res = await fetch(
            `https://api.github.com/users/${username}/repos?sort=updated&per_page=5`,
            { headers, signal: AbortSignal.timeout(5000) }
        );

        if (!res.ok) {
            console.warn(`[GITHUB_LIVE] API returned ${res.status}`);
            return "";
        }

        const repos: GitHubRepo[] = await res.json();

        if (repos.length === 0) return "";

        const summary = repos
            .slice(0, 3)
            .map(r =>
                `- **${r.name}** (${r.language || "Mixed"}) — ${r.description || "No description"} — Updated: ${new Date(r.updated_at).toLocaleDateString()}`
            )
            .join("\n");

        return `\n[LIVE GITHUB ACTIVITY]\n${summary}\n`;
    } catch (error) {
        console.warn("[GITHUB_LIVE] Fetch failed (non-critical):", error);
        return "";
    }
}

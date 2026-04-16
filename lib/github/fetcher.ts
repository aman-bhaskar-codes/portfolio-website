/**
 * GitHub Repo Fetcher — OAuth Token-Based
 *
 * Fetches user repos and README content using the GitHub access token
 * obtained from the NextAuth session.
 */

interface GitHubRepo {
    name: string;
    full_name: string;
    owner: { login: string };
    description: string | null;
    language: string | null;
    updated_at: string;
    stargazers_count: number;
    private: boolean;
}

const GITHUB_API = "https://api.github.com";

function headers(token: string): Record<string, string> {
    return {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "portfolio-ai",
    };
}

/**
 * Fetches the user's repos, sorted by most recently updated.
 */
export async function fetchRepos(token: string, limit: number = 10): Promise<GitHubRepo[]> {
    const res = await fetch(
        `${GITHUB_API}/user/repos?sort=updated&per_page=${limit}&type=owner`,
        { headers: headers(token), signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

/**
 * Fetches the decoded README.md content for a repo.
 * Returns null if no README exists.
 */
export async function fetchReadme(owner: string, repo: string, token: string): Promise<string | null> {
    try {
        const res = await fetch(
            `${GITHUB_API}/repos/${owner}/${repo}/readme`,
            { headers: headers(token), signal: AbortSignal.timeout(8000) }
        );

        if (!res.ok) return null;

        const data = await res.json();
        if (!data.content) return null;

        return Buffer.from(data.content, "base64").toString("utf-8");
    } catch {
        return null;
    }
}

/**
 * Fetches package.json to extract stack info.
 * Returns null if not found (e.g., Python repos).
 */
export async function fetchPackageJson(owner: string, repo: string, token: string): Promise<string | null> {
    try {
        const res = await fetch(
            `${GITHUB_API}/repos/${owner}/${repo}/contents/package.json`,
            { headers: headers(token), signal: AbortSignal.timeout(5000) }
        );

        if (!res.ok) return null;

        const data = await res.json();
        if (!data.content) return null;

        return Buffer.from(data.content, "base64").toString("utf-8");
    } catch {
        return null;
    }
}

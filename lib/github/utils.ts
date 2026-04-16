/**
 * GitHub URL Parser Utility
 */

export function extractOwnerRepo(url: string): { owner: string; repo: string } {
    // Handle formats:
    //   https://github.com/owner/repo
    //   https://github.com/owner/repo.git
    //   github.com/owner/repo
    //   owner/repo

    let cleaned = url.trim();

    // Remove trailing .git
    if (cleaned.endsWith(".git")) {
        cleaned = cleaned.slice(0, -4);
    }

    // Remove trailing slash
    if (cleaned.endsWith("/")) {
        cleaned = cleaned.slice(0, -1);
    }

    // Try to extract from URL
    const githubMatch = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (githubMatch) {
        return { owner: githubMatch[1], repo: githubMatch[2] };
    }

    // Fallback: owner/repo format
    const parts = cleaned.split("/");
    if (parts.length >= 2) {
        return { owner: parts[parts.length - 2], repo: parts[parts.length - 1] };
    }

    throw new Error(`Invalid GitHub URL: ${url}`);
}

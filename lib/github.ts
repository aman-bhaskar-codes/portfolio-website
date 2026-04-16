export async function fetchRepoFiles(owner: string, repo: string) {
    const headers = {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
    };

    const treeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
        { headers }
    );

    const treeData = await treeRes.json();

    if (!treeData.tree) {
        throw new Error("Could not fetch repo tree. Check GITHUB_TOKEN and repo name.");
    }

    const importantFiles = treeData.tree.filter((file: any) =>
        file.path.endsWith(".ts") ||
        file.path.endsWith(".tsx") ||
        file.path.endsWith(".js") ||
        file.path.endsWith(".jsx") ||
        file.path.endsWith(".py") ||
        file.path.endsWith("README.md")
    );

    const files = [];

    for (const file of importantFiles.slice(0, 20)) {
        const fileRes = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`,
            { headers }
        );

        const fileData = await fileRes.json();

        if (fileData.content) {
            const content = Buffer.from(fileData.content, "base64").toString("utf-8");
            files.push({
                path: file.path,
                content,
            });
        }
    }

    return files;
}

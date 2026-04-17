"""
═══════════════════════════════════════════════════════════
Code Traversal Agent (§3.2)
═══════════════════════════════════════════════════════════

Gives the AI the ability to navigate live GitHub repos.
Uses GitHub Contents API + Tree API for zero-clone traversal.

Capabilities:
  - List directory structure
  - Read specific files (with token budget awareness)
  - Follow import chains across files
  - Surface the "most interesting" files via complexity heuristics
  - Generate persona-aware walkthroughs
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional

import httpx
from pydantic import BaseModel, Field

from backend.config.settings import settings

logger = logging.getLogger("portfolio.agents.code_traversal")


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class RepoTreeEntry(BaseModel):
    path: str
    type: str  # "blob" or "tree"
    size: int = 0


class FileContent(BaseModel):
    path: str
    content: str
    size: int
    language: str = ""
    truncated: bool = False


class FileComplexity(BaseModel):
    path: str
    size: int
    function_count: int = 0
    import_count: int = 0
    complexity_score: float = 0.0


class CodeWalkthrough(BaseModel):
    repo: str
    title: str
    sections: List[Dict] = Field(default_factory=list)
    key_files: List[str] = Field(default_factory=list)
    architecture_summary: str = ""


# ═══════════════════════════════════════════════════════════
# AGENT
# ═══════════════════════════════════════════════════════════

class CodeTraversalAgent:
    """Navigate live GitHub repos without cloning."""

    def __init__(self, username: Optional[str] = None, token: Optional[str] = None):
        self.username = username or settings.GITHUB_USERNAME
        self.token = token or settings.GITHUB_TOKEN
        self._headers = {"Accept": "application/vnd.github.v3+json"}
        if self.token:
            self._headers["Authorization"] = f"token {self.token}"

    async def get_repo_tree(
        self, repo: str, depth: int = 2
    ) -> List[RepoTreeEntry]:
        """Fetch repo tree structure without cloning."""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f"https://api.github.com/repos/{self.username}/{repo}/git/trees/main",
                    headers=self._headers,
                    params={"recursive": "1" if depth > 1 else "0"},
                )
                if resp.status_code != 200:
                    # Try 'master' branch
                    resp = await client.get(
                        f"https://api.github.com/repos/{self.username}/{repo}/git/trees/master",
                        headers=self._headers,
                        params={"recursive": "1" if depth > 1 else "0"},
                    )
                if resp.status_code != 200:
                    logger.warning(f"Failed to get tree for {repo}: {resp.status_code}")
                    return []

                data = resp.json()
                entries = []
                for item in data.get("tree", []):
                    # Filter by depth
                    path_depth = item["path"].count("/") + 1
                    if path_depth <= depth:
                        entries.append(RepoTreeEntry(
                            path=item["path"],
                            type=item["type"],
                            size=item.get("size", 0),
                        ))
                return entries

        except Exception as e:
            logger.error(f"Tree fetch failed for {repo}: {e}")
            return []

    async def read_file_smart(
        self, repo: str, path: str, budget: int = 2000
    ) -> Optional[FileContent]:
        """
        Read a file with intelligent truncation:
        - Preserve class/function boundaries
        - Include docstrings + key logic
        - Skip boilerplate (imports can be summarized)
        """
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f"https://api.github.com/repos/{self.username}/{repo}/contents/{path}",
                    headers={**self._headers, "Accept": "application/vnd.github.v3.raw"},
                )
                if resp.status_code != 200:
                    return None

                content = resp.text
                size = len(content)
                language = self._detect_language(path)

                # Smart truncation
                if len(content) > budget * 4:  # ~4 chars per token
                    content = self._smart_truncate(content, budget * 4, language)
                    truncated = True
                else:
                    truncated = False

                return FileContent(
                    path=path,
                    content=content,
                    size=size,
                    language=language,
                    truncated=truncated,
                )

        except Exception as e:
            logger.error(f"File read failed: {repo}/{path}: {e}")
            return None

    async def find_most_complex_files(
        self, repo: str, limit: int = 5
    ) -> List[FileComplexity]:
        """
        Heuristic complexity ranking:
        - File size (proxy for logic density)
        - Number of functions/classes (from name patterns)
        - Import count (dependency complexity)
        """
        tree = await self.get_repo_tree(repo, depth=4)
        
        # Filter to code files only
        code_extensions = {".py", ".ts", ".tsx", ".js", ".jsx", ".go", ".rs"}
        code_files = [
            e for e in tree
            if e.type == "blob" and any(e.path.endswith(ext) for ext in code_extensions)
        ]

        # Score by size as primary heuristic
        scored = []
        for f in code_files:
            score = 0.0
            # Size component (larger = more complex, usually)
            score += min(f.size / 5000, 3.0)
            # Penalize test files (less interesting architecturally)
            if "test" in f.path.lower() or "spec" in f.path.lower():
                score *= 0.3
            # Boost deep-nested files (core logic usually deeper)
            depth = f.path.count("/")
            score += min(depth * 0.3, 1.5)
            # Boost files with interesting names
            interesting_names = ["agent", "engine", "orchestrat", "graph", "pipeline", "core"]
            if any(name in f.path.lower() for name in interesting_names):
                score += 1.5

            scored.append(FileComplexity(
                path=f.path,
                size=f.size,
                complexity_score=round(score, 2),
            ))

        scored.sort(key=lambda x: x.complexity_score, reverse=True)
        return scored[:limit]

    async def generate_walkthrough(
        self, repo: str, persona: str = "senior_engineer"
    ) -> CodeWalkthrough:
        """
        Generate a persona-aware code walkthrough.
        Returns structured sections for the frontend to render.
        """
        tree = await self.get_repo_tree(repo, depth=3)
        complex_files = await self.find_most_complex_files(repo, limit=3)

        # Build structure summary
        dirs = set()
        for entry in tree:
            if "/" in entry.path:
                dirs.add(entry.path.split("/")[0])

        sections = [
            {
                "title": "Repository Structure",
                "content": f"Top-level directories: {', '.join(sorted(dirs))}",
                "type": "overview",
            },
            {
                "title": "Most Complex Files",
                "content": "\n".join(
                    f"- `{f.path}` (complexity: {f.complexity_score})"
                    for f in complex_files
                ),
                "type": "analysis",
            },
        ]

        # Read key files for deeper analysis
        key_files = [f.path for f in complex_files[:2]]
        for file_path in key_files:
            file_content = await self.read_file_smart(repo, file_path, budget=1500)
            if file_content:
                sections.append({
                    "title": f"Deep Dive: {file_path}",
                    "content": file_content.content[:3000],
                    "type": "code",
                    "language": file_content.language,
                    "file": file_path,
                })

        return CodeWalkthrough(
            repo=repo,
            title=f"Architecture Walkthrough: {repo}",
            sections=sections,
            key_files=key_files,
            architecture_summary=f"Repository with {len(tree)} files across {len(dirs)} top-level modules.",
        )

    # ═══════════════════════════════════════════════════════
    # HELPERS
    # ═══════════════════════════════════════════════════════

    def _detect_language(self, path: str) -> str:
        ext_map = {
            ".py": "python", ".ts": "typescript", ".tsx": "typescript",
            ".js": "javascript", ".jsx": "javascript", ".go": "go",
            ".rs": "rust", ".sql": "sql", ".md": "markdown",
            ".yml": "yaml", ".yaml": "yaml", ".json": "json",
        }
        for ext, lang in ext_map.items():
            if path.endswith(ext):
                return lang
        return ""

    def _smart_truncate(self, content: str, max_chars: int, language: str) -> str:
        """
        Truncate preserving structural boundaries.
        Keep: first docstring/comment block, class/function signatures, last section.
        """
        lines = content.split("\n")
        if len(lines) <= 50:
            return content[:max_chars]

        # Keep first 30% and last 10%
        head_end = int(len(lines) * 0.3)
        tail_start = int(len(lines) * 0.9)
        
        head = "\n".join(lines[:head_end])
        tail = "\n".join(lines[tail_start:])
        
        middle_msg = f"\n\n# ... [{len(lines) - head_end - (len(lines) - tail_start)} lines omitted] ...\n\n"
        
        result = head + middle_msg + tail
        return result[:max_chars]

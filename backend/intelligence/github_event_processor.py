"""
═══════════════════════════════════════════════════════════
GitHub Event Processor (§5.2)
═══════════════════════════════════════════════════════════

Processes GitHub webhooks in real-time to keep the knowledge
base perfectly synchronized with actual development activity.

Registered events: push, pull_request, create, release, star, issues

Smart push handling — classifies changed files and only
re-ingests what changed. Generates commit narratives as
human-readable RAG chunks.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.intelligence.github_events")


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class GitHubPushEvent(BaseModel):
    ref: str = ""
    repository: str = ""
    commits: List[Dict] = Field(default_factory=list)
    sender: str = ""


class GitHubPREvent(BaseModel):
    action: str = ""  # opened, closed, merged
    title: str = ""
    body: str = ""
    repository: str = ""
    merged: bool = False


class FileChange(BaseModel):
    path: str
    change_type: str  # "added", "modified", "removed"
    priority: str = "normal"  # "high", "normal", "low"
    category: str = ""  # "readme", "code", "config", "test", "docs"


class CommitNarrative(BaseModel):
    repo: str
    sha: str
    narrative: str
    files_changed: List[str]
    category: str = ""  # "feature", "refactor", "fix", "chore"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ═══════════════════════════════════════════════════════════
# FILE CLASSIFIER
# ═══════════════════════════════════════════════════════════

def classify_file_change(path: str) -> FileChange:
    """
    Classify a changed file to determine re-ingestion priority.
    
    Priority tiers:
      HIGH: README.md, architecture docs → full re-ingest
      NORMAL: *.py, *.ts → AST-level re-analysis
      LOW: config files, lockfiles → metadata update only
    """
    path_lower = path.lower()

    # README — highest priority
    if path_lower in ("readme.md", "readme.rst", "readme.txt"):
        return FileChange(path=path, change_type="modified", priority="high", category="readme")

    # Documentation
    if path_lower.endswith(".md") or "docs/" in path_lower or "doc/" in path_lower:
        return FileChange(path=path, change_type="modified", priority="high", category="docs")

    # Source code
    code_extensions = (".py", ".ts", ".tsx", ".js", ".jsx", ".go", ".rs")
    if any(path_lower.endswith(ext) for ext in code_extensions):
        # Test files are lower priority
        if "test" in path_lower or "spec" in path_lower:
            return FileChange(path=path, change_type="modified", priority="low", category="test")
        return FileChange(path=path, change_type="modified", priority="normal", category="code")

    # Dependency files — tech stack updates
    if path_lower in ("requirements.txt", "pyproject.toml", "package.json", "go.mod", "cargo.toml"):
        return FileChange(path=path, change_type="modified", priority="normal", category="config")

    # CI/CD — code quality signal update
    if ".github/workflows" in path_lower or path_lower in ("jenkinsfile", ".gitlab-ci.yml"):
        return FileChange(path=path, change_type="modified", priority="low", category="ci")

    # Docker — infrastructure signal
    if "docker" in path_lower:
        return FileChange(path=path, change_type="modified", priority="low", category="infra")

    return FileChange(path=path, change_type="modified", priority="low", category="other")


# ═══════════════════════════════════════════════════════════
# EVENT PROCESSOR
# ═══════════════════════════════════════════════════════════

class GitHubEventProcessor:
    """
    Processes GitHub webhook events and generates ingestion tasks.
    """

    def verify_signature(self, payload: bytes, signature: str, secret: str) -> bool:
        """Verify GitHub webhook HMAC-SHA256 signature."""
        expected = "sha256=" + hmac.new(
            secret.encode(), payload, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    async def on_push(self, event: GitHubPushEvent) -> List[CommitNarrative]:
        """
        Process push event — classify files, generate narratives.
        """
        narratives = []

        for commit in event.commits:
            sha = commit.get("id", "")[:8]
            message = commit.get("message", "").split("\n")[0]
            files = (
                commit.get("added", [])
                + commit.get("modified", [])
                + commit.get("removed", [])
            )

            # Classify each file
            changes = [classify_file_change(f) for f in files]

            # Determine commit category
            category = self._categorize_commit(message)

            # Generate narrative
            narrative = self._generate_narrative(
                repo=event.repository,
                sha=sha,
                message=message,
                changes=changes,
                category=category,
            )

            narratives.append(CommitNarrative(
                repo=event.repository,
                sha=sha,
                narrative=narrative,
                files_changed=files,
                category=category,
            ))

            logger.info(
                f"Processed push: {event.repository}@{sha} — "
                f"{len(files)} files, category={category}"
            )

        return narratives

    async def on_pull_request(self, event: GitHubPREvent) -> Optional[CommitNarrative]:
        """
        Process PR event — PR descriptions are high-quality writing.
        Only ingest merged PRs or opened PRs with substantial descriptions.
        """
        if event.action not in ("opened", "closed"):
            return None

        if event.action == "closed" and not event.merged:
            return None  # Closed without merge — skip

        body = event.body or ""
        if len(body) < 50:
            return None  # Too short to be useful

        narrative = (
            f"In {event.repository}, a pull request was "
            f"{'merged' if event.merged else 'opened'}: "
            f"\"{event.title}\". {body[:500]}"
        )

        return CommitNarrative(
            repo=event.repository,
            sha="pr",
            narrative=narrative,
            files_changed=[],
            category="feature" if event.merged else "wip",
        )

    async def on_release(self, repo: str, tag: str, body: str) -> CommitNarrative:
        """Process release event — high-priority impact statement."""
        narrative = (
            f"Released {tag} of {repo}. "
            f"Release notes: {body[:500]}"
        )
        return CommitNarrative(
            repo=repo,
            sha=tag,
            narrative=narrative,
            files_changed=[],
            category="release",
        )

    # ═══════════════════════════════════════════════════════
    # HELPERS
    # ═══════════════════════════════════════════════════════

    def _categorize_commit(self, message: str) -> str:
        """Categorize commit from conventional commit prefix."""
        msg_lower = message.lower()
        if msg_lower.startswith("feat"):
            return "feature"
        if msg_lower.startswith("fix"):
            return "fix"
        if msg_lower.startswith("refactor"):
            return "refactor"
        if msg_lower.startswith("docs"):
            return "docs"
        if msg_lower.startswith("test"):
            return "test"
        if msg_lower.startswith("chore") or msg_lower.startswith("ci"):
            return "chore"
        if "refactor" in msg_lower:
            return "refactor"
        if "fix" in msg_lower or "bug" in msg_lower:
            return "fix"
        return "feature"

    def _generate_narrative(
        self,
        repo: str,
        sha: str,
        message: str,
        changes: List[FileChange],
        category: str,
    ) -> str:
        """
        Transform raw commit data into a human-readable narrative chunk.
        This is what RAG actually retrieves — far more useful than raw metadata.
        """
        high_priority = [c for c in changes if c.priority == "high"]
        code_changes = [c for c in changes if c.category == "code"]

        parts = [f"In {repo}"]

        # Category-specific narrative
        if category == "refactor":
            parts.append(f"a refactoring was performed (commit {sha}): \"{message}\".")
            if code_changes:
                modules = set(c.path.split("/")[0] for c in code_changes if "/" in c.path)
                if modules:
                    parts.append(f"This touched the {', '.join(modules)} module(s),")
                    parts.append("showing a preference for clean architecture and separation of concerns.")
        elif category == "feature":
            parts.append(f"a new feature was added (commit {sha}): \"{message}\".")
        elif category == "fix":
            parts.append(f"a bug was fixed (commit {sha}): \"{message}\".")
            parts.append("This demonstrates attention to reliability and production quality.")
        else:
            parts.append(f"a change was made (commit {sha}): \"{message}\".")

        # File summary
        if high_priority:
            parts.append(
                f"High-priority files changed: {', '.join(c.path for c in high_priority[:3])}."
            )

        parts.append(f"Total files affected: {len(changes)}.")

        return " ".join(parts)

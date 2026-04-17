"""
═══════════════════════════════════════════════════════════
Autonomous Portfolio Update Agent — ANTIGRAVITY OS v2 (§27.2)
═══════════════════════════════════════════════════════════

Weekly Celery task. Scans GitHub activity + visitor analytics.
Generates improvement PROPOSALS — never auto-deploys.

  1. Detects new accomplishments (new repos, releases, tech shifts)
  2. Identifies staleness (outdated descriptions, unused skills)
  3. Detects conversion opportunities (most-asked topics, gaps)
  4. Generates ranked proposals for owner review
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.agents.portfolio_update")


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class ImprovementProposal(BaseModel):
    """A single portfolio improvement proposal."""
    title: str
    category: str  # "new_project", "update", "skill_add", "staleness", "content_gap"
    description: str
    evidence: str = ""
    estimated_impact: float = 0.0  # 0-1 scale
    priority: int = 3  # 1=highest
    files_affected: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UpdateReport(BaseModel):
    """Weekly update report."""
    proposals: List[ImprovementProposal] = Field(default_factory=list)
    stats: Dict[str, int] = Field(default_factory=dict)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ═══════════════════════════════════════════════════════════
# PORTFOLIO UPDATE AGENT
# ═══════════════════════════════════════════════════════════

class AutonomousPortfolioUpdateAgent:
    """
    All proposals require manual review. The agent proposes; Aman decides.
    """

    async def generate_weekly_proposals(
        self,
        github_repos: Optional[List[dict]] = None,
        recent_commits: Optional[List[dict]] = None,
        visitor_questions: Optional[List[str]] = None,
        current_skills: Optional[List[str]] = None,
    ) -> UpdateReport:
        """
        Analyze GitHub activity + visitor patterns → generate proposals.
        """
        proposals = []

        # 1. Detect new repos worth featuring
        if github_repos:
            proposals.extend(self._detect_new_projects(github_repos))

        # 2. Detect tech stack shifts
        if recent_commits:
            proposals.extend(self._detect_tech_shifts(recent_commits, current_skills or []))

        # 3. Detect content gaps from visitor questions
        if visitor_questions:
            proposals.extend(self._detect_content_gaps(visitor_questions))

        # 4. Detect staleness
        if github_repos:
            proposals.extend(self._detect_staleness(github_repos))

        # Rank by estimated impact
        proposals.sort(key=lambda p: p.estimated_impact, reverse=True)

        return UpdateReport(
            proposals=proposals[:10],  # Top 10 proposals
            stats={
                "total_proposals": len(proposals),
                "repos_analyzed": len(github_repos or []),
                "commits_analyzed": len(recent_commits or []),
                "questions_analyzed": len(visitor_questions or []),
            },
        )

    def _detect_new_projects(self, repos: List[dict]) -> List[ImprovementProposal]:
        """Find repos worth adding to portfolio."""
        proposals = []
        for repo in repos:
            stars = repo.get("stargazers_count", 0)
            commits = repo.get("commit_count", 0)
            is_featured = repo.get("is_featured", False)

            if not is_featured and (stars >= 5 or commits >= 50):
                proposals.append(ImprovementProposal(
                    title=f"Feature project: {repo.get('name', 'unknown')}",
                    category="new_project",
                    description=(
                        f"Repository '{repo.get('name')}' has {stars} stars "
                        f"and {commits} commits but isn't featured in the portfolio."
                    ),
                    evidence=f"Stars: {stars}, Commits: {commits}",
                    estimated_impact=min(0.9, 0.3 + (stars * 0.05) + (commits * 0.005)),
                    priority=2,
                    files_affected=["data/projects/"],
                ))
        return proposals

    def _detect_tech_shifts(
        self, commits: List[dict], current_skills: List[str]
    ) -> List[ImprovementProposal]:
        """Detect new technologies being used that aren't listed."""
        # Count file extensions in recent commits
        extension_counts: Dict[str, int] = {}
        for commit in commits:
            for file_path in commit.get("files_changed", []):
                ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else ""
                if ext:
                    extension_counts[ext] = extension_counts.get(ext, 0) + 1

        # Map extensions to technologies
        ext_to_tech = {
            "rs": "Rust", "go": "Go", "kt": "Kotlin", "swift": "Swift",
            "ts": "TypeScript", "tsx": "React/TypeScript",
            "py": "Python", "rb": "Ruby", "scala": "Scala",
            "tf": "Terraform", "yml": "Docker/CI",
        }

        proposals = []
        current_lower = {s.lower() for s in current_skills}

        for ext, count in extension_counts.items():
            tech = ext_to_tech.get(ext)
            if tech and tech.lower() not in current_lower and count >= 10:
                proposals.append(ImprovementProposal(
                    title=f"Add skill: {tech}",
                    category="skill_add",
                    description=(
                        f"You've modified {count} .{ext} files recently "
                        f"but {tech} isn't listed in your skills."
                    ),
                    estimated_impact=0.4,
                    priority=3,
                ))
        return proposals

    def _detect_content_gaps(
        self, questions: List[str]
    ) -> List[ImprovementProposal]:
        """Find topics visitors ask about that have weak coverage."""
        topic_counts: Dict[str, int] = {}
        topic_keywords = {
            "system design": ["design", "architect", "scale", "distributed"],
            "machine learning": ["ml", "ai", "model", "training", "neural"],
            "devops": ["deploy", "ci/cd", "docker", "kubernetes", "terraform"],
            "frontend": ["react", "ui", "ux", "component", "animation"],
            "databases": ["database", "sql", "postgres", "redis", "query"],
        }

        for question in questions:
            q_lower = question.lower()
            for topic, keywords in topic_keywords.items():
                if any(kw in q_lower for kw in keywords):
                    topic_counts[topic] = topic_counts.get(topic, 0) + 1

        proposals = []
        for topic, count in topic_counts.items():
            if count >= 5:
                proposals.append(ImprovementProposal(
                    title=f"Expand content: {topic}",
                    category="content_gap",
                    description=(
                        f"Visitors asked about {topic} {count} times. "
                        f"Consider adding more detailed knowledge base content."
                    ),
                    estimated_impact=min(0.8, count * 0.08),
                    priority=2,
                    files_affected=["data/owner/"],
                ))
        return proposals

    def _detect_staleness(self, repos: List[dict]) -> List[ImprovementProposal]:
        """Find featured projects with stale descriptions."""
        proposals = []
        for repo in repos:
            if not repo.get("is_featured"):
                continue
            last_update = repo.get("pushed_at", "")
            description_age_days = repo.get("description_age_days", 0)

            if description_age_days > 180:
                proposals.append(ImprovementProposal(
                    title=f"Update description: {repo.get('name', 'unknown')}",
                    category="staleness",
                    description=(
                        f"Featured project '{repo.get('name')}' has a description "
                        f"that's {description_age_days} days old."
                    ),
                    estimated_impact=0.3,
                    priority=4,
                ))
        return proposals


# Singleton
portfolio_update_agent = AutonomousPortfolioUpdateAgent()

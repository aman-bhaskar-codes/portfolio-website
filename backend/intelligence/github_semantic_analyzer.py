"""
═══════════════════════════════════════════════════════════
GitHub Semantic Analyzer (§3.1)
═══════════════════════════════════════════════════════════

Goes far beyond README ingestion. For each repository:
  1. Commit graph analysis (architectural moments, philosophy)
  2. Code structure understanding (patterns, complexity)
  3. Documentation intelligence (docstrings, ADRs)
  4. Impact mining (quantified metrics from README/commits)
  5. Semantic chunk creation with persona relevance
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional

import httpx
from pydantic import BaseModel, Field

from backend.config.settings import settings

logger = logging.getLogger("portfolio.intelligence.github_analyzer")


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class TechStackProfile(BaseModel):
    languages: Dict[str, int] = Field(default_factory=dict)  # lang → bytes
    frameworks: List[str] = Field(default_factory=list)
    databases: List[str] = Field(default_factory=list)
    infrastructure: List[str] = Field(default_factory=list)


class CodeQualityProfile(BaseModel):
    has_tests: bool = False
    test_coverage_estimate: Optional[float] = None
    has_ci_cd: bool = False
    documentation_quality: float = 0.0
    error_handling_patterns: List[str] = Field(default_factory=list)
    security_patterns: List[str] = Field(default_factory=list)


class CollaborationProfile(BaseModel):
    total_commits: int = 0
    commit_frequency: str = "unknown"
    pr_count: int = 0
    contributor_count: int = 1
    has_issues: bool = False


class RepositorySemanticProfile(BaseModel):
    repo_name: str
    technical_complexity_score: float = 0.0
    architecture_patterns: List[str] = Field(default_factory=list)
    problem_domain: str = ""
    engineering_decisions: List[str] = Field(default_factory=list)
    performance_signals: List[str] = Field(default_factory=list)
    collaboration: CollaborationProfile = Field(default_factory=CollaborationProfile)
    evolution_story: str = ""
    recruiter_one_liner: str = ""
    technical_deep_dive: str = ""
    impact_statement: str = ""
    tech_stack: TechStackProfile = Field(default_factory=TechStackProfile)
    code_quality: CodeQualityProfile = Field(default_factory=CodeQualityProfile)


class SemanticChunk(BaseModel):
    content: str
    repo: str
    chunk_type: str  # "overview", "architecture", "commit_narrative", "impact", "code_highlight"
    freshness: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    persona_relevance: Dict[str, float] = Field(default_factory=dict)
    complexity_tier: str = "L1"  # L1=simple, L2=moderate, L3=complex
    impact_score: float = 0.0


# ═══════════════════════════════════════════════════════════
# ANALYZER
# ═══════════════════════════════════════════════════════════

class GitHubSemanticAnalyzer:
    """Deep semantic analysis of GitHub repositories."""

    def __init__(self, username: Optional[str] = None, token: Optional[str] = None):
        self.username = username or settings.GITHUB_USERNAME
        self.token = token or settings.GITHUB_TOKEN
        self._headers = {"Accept": "application/vnd.github.v3+json"}
        if self.token:
            self._headers["Authorization"] = f"token {self.token}"

    async def analyze_repository(self, repo_name: str) -> RepositorySemanticProfile:
        """Full semantic analysis of a repository."""
        profile = RepositorySemanticProfile(repo_name=repo_name)

        async with httpx.AsyncClient(timeout=30.0) as client:
            # 1. Basic repo info
            repo_data = await self._fetch_repo_info(client, repo_name)
            if repo_data:
                profile.problem_domain = repo_data.get("description", "") or ""
                profile.tech_stack.languages = await self._fetch_languages(client, repo_name)

            # 2. Commit analysis
            commits = await self._fetch_recent_commits(client, repo_name, limit=50)
            if commits:
                profile.collaboration.total_commits = len(commits)
                profile.collaboration.commit_frequency = self._classify_commit_frequency(commits)
                profile.evolution_story = self._build_evolution_story(commits, repo_name)
                profile.engineering_decisions = self._extract_decisions(commits)

            # 3. Code quality signals
            tree = await self._fetch_tree(client, repo_name)
            if tree:
                profile.code_quality = self._analyze_code_quality(tree)
                profile.architecture_patterns = self._detect_patterns(tree)
                profile.technical_complexity_score = self._compute_complexity(tree, profile)

            # 4. README mining
            readme = await self._fetch_readme(client, repo_name)
            if readme:
                profile.performance_signals = self._mine_metrics(readme)
                profile.impact_statement = self._extract_impact(readme, repo_name)

            # 5. Generate summaries
            profile.recruiter_one_liner = self._build_recruiter_liner(profile)
            profile.technical_deep_dive = self._build_technical_summary(profile)
            profile.complexity_tier = (
                "L3" if profile.technical_complexity_score > 7
                else "L2" if profile.technical_complexity_score > 4
                else "L1"
            )

        logger.info(
            f"Analyzed {repo_name}: complexity={profile.technical_complexity_score:.1f}, "
            f"patterns={profile.architecture_patterns}"
        )
        return profile

    async def generate_semantic_chunks(
        self, profile: RepositorySemanticProfile
    ) -> List[SemanticChunk]:
        """Generate RAG-optimized chunks from a semantic profile."""
        chunks = []

        # Overview chunk
        chunks.append(SemanticChunk(
            content=(
                f"Project: {profile.repo_name}\n"
                f"Domain: {profile.problem_domain}\n"
                f"Recruiter Summary: {profile.recruiter_one_liner}\n"
                f"Impact: {profile.impact_statement}\n"
                f"Complexity: {profile.technical_complexity_score:.1f}/10"
            ),
            repo=profile.repo_name,
            chunk_type="overview",
            persona_relevance={"technical_recruiter": 0.9, "casual": 0.8, "senior_engineer": 0.6},
            impact_score=0.8,
        ))

        # Architecture chunk
        if profile.architecture_patterns:
            chunks.append(SemanticChunk(
                content=(
                    f"Architecture of {profile.repo_name}:\n"
                    f"Patterns: {', '.join(profile.architecture_patterns)}\n"
                    f"Technical Deep Dive: {profile.technical_deep_dive}\n"
                    f"Code Quality: tests={'yes' if profile.code_quality.has_tests else 'no'}, "
                    f"CI/CD={'yes' if profile.code_quality.has_ci_cd else 'no'}"
                ),
                repo=profile.repo_name,
                chunk_type="architecture",
                persona_relevance={"senior_engineer": 0.95, "engineering_manager": 0.7},
                complexity_tier=profile.complexity_tier,
                impact_score=0.7,
            ))

        # Evolution chunk
        if profile.evolution_story:
            chunks.append(SemanticChunk(
                content=profile.evolution_story,
                repo=profile.repo_name,
                chunk_type="commit_narrative",
                persona_relevance={"senior_engineer": 0.8, "engineering_manager": 0.85},
                impact_score=0.5,
            ))

        # Decisions chunk
        if profile.engineering_decisions:
            chunks.append(SemanticChunk(
                content=(
                    f"Engineering decisions in {profile.repo_name}:\n"
                    + "\n".join(f"- {d}" for d in profile.engineering_decisions[:10])
                ),
                repo=profile.repo_name,
                chunk_type="decisions",
                persona_relevance={"senior_engineer": 0.9, "engineering_manager": 0.75},
                impact_score=0.6,
            ))

        return chunks

    # ═══════════════════════════════════════════════════════
    # DATA FETCHERS
    # ═══════════════════════════════════════════════════════

    async def _fetch_repo_info(self, client: httpx.AsyncClient, repo: str) -> Optional[dict]:
        try:
            resp = await client.get(
                f"https://api.github.com/repos/{self.username}/{repo}",
                headers=self._headers,
            )
            return resp.json() if resp.status_code == 200 else None
        except Exception:
            return None

    async def _fetch_languages(self, client: httpx.AsyncClient, repo: str) -> Dict[str, int]:
        try:
            resp = await client.get(
                f"https://api.github.com/repos/{self.username}/{repo}/languages",
                headers=self._headers,
            )
            return resp.json() if resp.status_code == 200 else {}
        except Exception:
            return {}

    async def _fetch_recent_commits(
        self, client: httpx.AsyncClient, repo: str, limit: int = 50
    ) -> List[dict]:
        try:
            resp = await client.get(
                f"https://api.github.com/repos/{self.username}/{repo}/commits",
                headers=self._headers,
                params={"per_page": limit},
            )
            return resp.json() if resp.status_code == 200 else []
        except Exception:
            return []

    async def _fetch_tree(self, client: httpx.AsyncClient, repo: str) -> List[dict]:
        try:
            resp = await client.get(
                f"https://api.github.com/repos/{self.username}/{repo}/git/trees/main",
                headers=self._headers,
                params={"recursive": "1"},
            )
            if resp.status_code != 200:
                resp = await client.get(
                    f"https://api.github.com/repos/{self.username}/{repo}/git/trees/master",
                    headers=self._headers,
                    params={"recursive": "1"},
                )
            return resp.json().get("tree", []) if resp.status_code == 200 else []
        except Exception:
            return []

    async def _fetch_readme(self, client: httpx.AsyncClient, repo: str) -> Optional[str]:
        try:
            resp = await client.get(
                f"https://api.github.com/repos/{self.username}/{repo}/readme",
                headers={**self._headers, "Accept": "application/vnd.github.v3.raw"},
            )
            return resp.text if resp.status_code == 200 else None
        except Exception:
            return None

    # ═══════════════════════════════════════════════════════
    # ANALYSIS HELPERS
    # ═══════════════════════════════════════════════════════

    def _classify_commit_frequency(self, commits: List[dict]) -> str:
        if len(commits) < 5:
            return "minimal"
        # Check date spread
        try:
            dates = [c["commit"]["author"]["date"][:10] for c in commits if c.get("commit")]
            unique_days = len(set(dates))
            if unique_days > 20:
                return "sustained daily"
            elif unique_days > 7:
                return "active weekly"
            else:
                return "burst-then-quiet"
        except (KeyError, IndexError):
            return "unknown"

    def _build_evolution_story(self, commits: List[dict], repo: str) -> str:
        """Build narrative from commit messages."""
        if not commits:
            return ""
        
        messages = []
        for c in commits[:20]:
            try:
                msg = c["commit"]["message"].split("\n")[0]
                if len(msg) > 10:
                    messages.append(msg)
            except (KeyError, IndexError):
                continue

        if not messages:
            return ""

        summary = (
            f"The development of {repo} shows a trajectory of "
            f"{len(commits)} commits. "
        )

        # Identify themes
        refactor_count = sum(1 for m in messages if "refactor" in m.lower())
        feat_count = sum(1 for m in messages if "feat" in m.lower() or "add" in m.lower())
        fix_count = sum(1 for m in messages if "fix" in m.lower() or "bug" in m.lower())

        if feat_count > fix_count:
            summary += "Primarily feature-driven development, "
        else:
            summary += "Strong maintenance and reliability focus, "

        if refactor_count > 3:
            summary += "with significant architectural refinement. "

        summary += f"Recent activity: '{messages[0]}'"
        return summary

    def _extract_decisions(self, commits: List[dict]) -> List[str]:
        """Extract engineering decisions from commit messages."""
        decisions = []
        decision_keywords = ["chose", "switch", "migrate", "refactor", "replace", "upgrade", "use"]
        
        for c in commits:
            try:
                msg = c["commit"]["message"].split("\n")[0].lower()
                if any(kw in msg for kw in decision_keywords):
                    decisions.append(c["commit"]["message"].split("\n")[0])
            except (KeyError, IndexError):
                continue

        return decisions[:10]

    def _analyze_code_quality(self, tree: List[dict]) -> CodeQualityProfile:
        """Analyze code quality signals from file tree."""
        paths = [item.get("path", "") for item in tree]
        
        has_tests = any("test" in p.lower() or "spec" in p.lower() for p in paths)
        has_ci = any(
            ".github/workflows" in p or "Jenkinsfile" in p or ".gitlab-ci" in p
            for p in paths
        )
        has_docs = any(
            p.lower() in ("readme.md", "docs/", "documentation/") or "docs/" in p
            for p in paths
        )

        return CodeQualityProfile(
            has_tests=has_tests,
            has_ci_cd=has_ci,
            documentation_quality=0.8 if has_docs else 0.3,
        )

    def _detect_patterns(self, tree: List[dict]) -> List[str]:
        """Detect architecture patterns from file structure."""
        paths = set(item.get("path", "") for item in tree)
        patterns = []

        # Pattern detection heuristics
        if any("agents/" in p or "agent" in p.lower() for p in paths):
            patterns.append("agent-based")
        if any("api/" in p for p in paths) and any("services/" in p or "core/" in p for p in paths):
            patterns.append("layered-architecture")
        if any("docker" in p.lower() for p in paths):
            patterns.append("containerized")
        if any("graph" in p.lower() for p in paths):
            patterns.append("graph-based")
        if any("rag/" in p or "retrieval/" in p for p in paths):
            patterns.append("RAG-pipeline")
        if any("memory/" in p for p in paths):
            patterns.append("stateful-memory")
        if any("tasks/" in p or "celery" in p.lower() for p in paths):
            patterns.append("async-task-queue")
        if any("middleware" in p.lower() for p in paths):
            patterns.append("middleware-chain")

        return patterns

    def _compute_complexity(self, tree: List[dict], profile: RepositorySemanticProfile) -> float:
        """Compute 0-10 complexity score."""
        score = 0.0
        file_count = len(tree)
        
        score += min(file_count / 50, 3.0)  # File count (max 3)
        score += len(profile.architecture_patterns) * 0.5  # Pattern count
        score += min(len(profile.tech_stack.languages) * 0.3, 1.5)  # Language diversity
        if profile.code_quality.has_tests:
            score += 0.5
        if profile.code_quality.has_ci_cd:
            score += 0.5

        return min(round(score, 1), 10.0)

    def _mine_metrics(self, readme: str) -> List[str]:
        """Extract quantified metrics from README."""
        patterns = [
            r'\d+[kKmM]?\+?\s*(users|requests|concurrent|queries|qps|rps)',
            r'\d+%\s*(faster|reduction|improvement|increase|decrease)',
            r'(sub-|<)\d+ms\s*(latency|response|p\d+)',
            r'\d+x\s*(faster|improvement|throughput|scale)',
        ]
        metrics = []
        for pattern in patterns:
            matches = re.findall(pattern, readme, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    metrics.append(" ".join(match))
                else:
                    metrics.append(match)
        return metrics[:5]

    def _extract_impact(self, readme: str, repo: str) -> str:
        """Extract impact statement from README."""
        metrics = self._mine_metrics(readme)
        if metrics:
            return f"{repo} — {'; '.join(metrics)}"
        return f"{repo} — production-grade implementation"

    def _build_recruiter_liner(self, profile: RepositorySemanticProfile) -> str:
        """Generate recruiter-ready one-liner."""
        langs = list(profile.tech_stack.languages.keys())[:3]
        lang_str = "/".join(langs) if langs else "multi-language"
        patterns_str = ", ".join(profile.architecture_patterns[:2]) if profile.architecture_patterns else "production"

        return (
            f"Built {profile.repo_name} — a {lang_str} {patterns_str} system"
            f"{f' with {profile.impact_statement}' if profile.impact_statement else ''}"
        )

    def _build_technical_summary(self, profile: RepositorySemanticProfile) -> str:
        """Generate technical architecture summary."""
        parts = [f"Architecture: {profile.repo_name}"]
        if profile.architecture_patterns:
            parts.append(f"Patterns: {', '.join(profile.architecture_patterns)}")
        if profile.tech_stack.languages:
            parts.append(f"Languages: {', '.join(profile.tech_stack.languages.keys())}")
        if profile.engineering_decisions:
            parts.append(f"Key decisions: {'; '.join(profile.engineering_decisions[:3])}")
        return "\n".join(parts)

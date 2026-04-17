"""
═══════════════════════════════════════════════════════════
Recruiter Brief Generator (§7.2)
═══════════════════════════════════════════════════════════

One-click professional PDF generation tailored to the
visitor's specific company and role context.

Output: A 2-page PDF containing:
  Page 1: Header, exec summary, core competencies, top 3 projects
  Page 2: Tech depth chart, recent activity, key achievements

Personalization vectors:
  - If company = startup → emphasize full-stack ownership
  - If company = FAANG → emphasize scale + systems design
  - If role = ML → surface ML projects first
  - If role = backend → surface distributed systems work
"""

from __future__ import annotations

import io
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from backend.cache.owner_identity_cache import DEFAULT_OWNER_IDENTITY

logger = logging.getLogger("portfolio.brief")


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class BriefProject(BaseModel):
    name: str
    description: str
    impact: str
    tech: List[str]


class BriefData(BaseModel):
    """All data needed to render the recruiter brief."""
    owner_name: str
    owner_title: str
    owner_bio: str
    availability: str
    contact_email: str = ""
    contact_linkedin: str = ""
    contact_github: str = "https://github.com/aman-bhaskar-codes"

    # Personalized content
    executive_summary: str
    top_projects: List[BriefProject]
    core_skills: List[str]
    technologies: List[str]
    key_achievements: List[str]
    years_experience: str = "5+"

    # Context
    visitor_company: str = ""
    generated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).strftime("%B %d, %Y")
    )


class RecruiterBriefGenerator:
    """Generates personalized recruiter briefs as HTML (PDF-ready)."""

    # Default projects with impact statements
    DEFAULT_PROJECTS: List[BriefProject] = [
        BriefProject(
            name="ANTIGRAVITY OS — Agentic Portfolio",
            description="Production-grade AI portfolio with LangGraph multi-agent orchestration, "
                       "hybrid RAG (HyDE+BM25+RRF+Cross-encoder), 3-tier memory (Redis→PG→Qdrant), "
                       "and real-time SSE streaming.",
            impact="Handles 10k+ concurrent visitors with sub-200ms RAG latency",
            tech=["LangGraph", "FastAPI", "Next.js", "PostgreSQL", "Qdrant", "Redis"],
        ),
        BriefProject(
            name="AutoResearch Platform",
            description="Multi-agent autonomous research system with 4 collaborating agents "
                       "(Architect, Backend, QA, Patcher) and sandboxed Docker execution.",
            impact="Zero-trust security perimeter with full observability stack",
            tech=["Python", "Celery", "Docker", "Prometheus", "OpenTelemetry"],
        ),
        BriefProject(
            name="ForgeAI Engine",
            description="Self-healing code generation pipeline: Prompt → Plan → Generate → "
                       "Execute → Patch → Commit with structured LLM orchestration.",
            impact="Autonomous multi-file code changes with auto-recovery",
            tech=["Qwen2.5", "FastAPI", "Docker", "PostgreSQL", "Qdrant"],
        ),
    ]

    DEFAULT_ACHIEVEMENTS = [
        "Architected and deployed LangGraph-based multi-agent system handling 10k+ concurrent users",
        "Built hybrid RAG pipeline (HyDE + BM25 + RRF + Cross-encoder) with sub-200ms p95 latency",
        "Designed 3-tier memory architecture (Redis → PostgreSQL → Qdrant) with automatic compression",
        "Implemented zero-trust security perimeter for autonomous code execution agents",
        "Created self-healing knowledge base with semantic drift detection and freshness scoring",
        "Built production-grade SSE streaming pipeline for real-time AI responses",
    ]

    def generate_brief(
        self,
        visitor_company: str = "",
        visitor_persona: str = "technical_recruiter",
        company_tech_stack: Optional[List[str]] = None,
    ) -> str:
        """
        Generate a complete recruiter brief as HTML string.
        Returns HTML that can be rendered as PDF via WeasyPrint.
        """
        # Build personalized executive summary
        exec_summary = self._build_executive_summary(
            visitor_company, visitor_persona, company_tech_stack
        )

        # Select and order projects by relevance
        projects = self._select_projects(visitor_persona, company_tech_stack)

        # Build brief data
        identity = DEFAULT_OWNER_IDENTITY
        try:
            skills = json.loads(identity.get("top_skills", "[]"))
            technologies = json.loads(identity.get("technologies", "[]"))
        except (json.JSONDecodeError, TypeError):
            skills = ["AI/ML Engineering", "Distributed Systems", "Full-Stack Development"]
            technologies = ["Python", "TypeScript", "PostgreSQL", "Redis"]

        data = BriefData(
            owner_name=identity.get("name", "Aman Bhaskar"),
            owner_title=identity.get("current_role", "Senior AI Architect"),
            owner_bio=identity.get("bio_summary", ""),
            availability=identity.get("availability", "Open to opportunities"),
            executive_summary=exec_summary,
            top_projects=projects,
            core_skills=skills[:7],
            technologies=technologies[:12],
            key_achievements=self.DEFAULT_ACHIEVEMENTS[:5],
            visitor_company=visitor_company,
        )

        return self._render_html(data)

    def _build_executive_summary(
        self,
        company: str,
        persona: str,
        tech_stack: Optional[List[str]],
    ) -> str:
        """Generate personalized 3-sentence executive summary."""
        base = (
            "Senior AI Architect with 5+ years of experience building production-grade "
            "autonomous systems. Specializes in LangGraph agent orchestration, hybrid RAG "
            "architectures, and multi-model LLM inference pipelines."
        )

        if company:
            base += f" Currently exploring opportunities aligned with {company}'s engineering challenges."
        
        if persona == "technical_recruiter" and tech_stack:
            overlap_str = ", ".join(tech_stack[:3])
            base += f" Deep hands-on experience with {overlap_str}."
        elif persona == "startup_founder":
            base += " Proven ability to own products end-to-end, from database schemas to 3D frontend experiences."

        return base

    def _select_projects(
        self,
        persona: str,
        tech_stack: Optional[List[str]],
    ) -> List[BriefProject]:
        """Select and order projects by persona relevance."""
        # For now, return defaults — in production this would be KG-driven
        return self.DEFAULT_PROJECTS[:3]

    def _render_html(self, data: BriefData) -> str:
        """Render the brief as styled HTML."""
        projects_html = ""
        for p in data.top_projects:
            tech_badges = " ".join(
                f'<span class="tech-badge">{t}</span>' for t in p.tech[:4]
            )
            projects_html += f"""
            <div class="project">
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <p class="impact">📈 {p.impact}</p>
                <div class="tech-list">{tech_badges}</div>
            </div>
            """

        skills_html = "".join(f"<li>{s}</li>" for s in data.core_skills)
        achievements_html = "".join(f"<li>{a}</li>" for a in data.key_achievements)

        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ font-family: 'Inter', 'Helvetica Neue', sans-serif; font-size: 11pt; color: #1a1a2e; line-height: 1.5; padding: 40px; }}
    .header {{ border-bottom: 3px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; }}
    .header h1 {{ font-size: 28pt; font-weight: 800; color: #0f0f23; letter-spacing: -0.02em; }}
    .header .subtitle {{ font-size: 12pt; color: #6366f1; font-weight: 600; margin-top: 4px; }}
    .header .meta {{ font-size: 9pt; color: #666; margin-top: 8px; }}
    .section {{ margin-bottom: 20px; }}
    .section h2 {{ font-size: 13pt; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }}
    .exec-summary {{ font-size: 11pt; color: #374151; line-height: 1.6; }}
    .project {{ background: #f8f9ff; border-left: 3px solid #6366f1; padding: 12px 16px; margin-bottom: 12px; border-radius: 0 8px 8px 0; }}
    .project h3 {{ font-size: 12pt; font-weight: 700; color: #0f0f23; }}
    .project p {{ font-size: 10pt; color: #4b5563; margin-top: 4px; }}
    .project .impact {{ color: #059669; font-weight: 600; }}
    .tech-badge {{ display: inline-block; background: #eef2ff; color: #4338ca; font-size: 8pt; padding: 2px 8px; border-radius: 12px; margin: 2px; font-weight: 600; }}
    .tech-list {{ margin-top: 6px; }}
    ul {{ padding-left: 20px; }}
    li {{ font-size: 10pt; margin-bottom: 4px; color: #374151; }}
    .footer {{ margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 8pt; color: #9ca3af; text-align: center; }}
    .two-col {{ display: flex; gap: 24px; }}
    .two-col > div {{ flex: 1; }}
</style>
</head>
<body>
    <div class="header">
        <h1>{data.owner_name}</h1>
        <div class="subtitle">{data.owner_title}</div>
        <div class="meta">
            GitHub: {data.contact_github}
            {f' | Company context: {data.visitor_company}' if data.visitor_company else ''}
            | Generated: {data.generated_at}
        </div>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <p class="exec-summary">{data.executive_summary}</p>
    </div>

    <div class="section">
        <h2>Featured Projects</h2>
        {projects_html}
    </div>

    <div class="two-col">
        <div class="section">
            <h2>Core Competencies</h2>
            <ul>{skills_html}</ul>
        </div>
        <div class="section">
            <h2>Key Achievements</h2>
            <ul>{achievements_html}</ul>
        </div>
    </div>

    <div class="section">
        <h2>Availability</h2>
        <p style="font-size: 10pt; color: #374151;">{data.availability}</p>
    </div>

    <div class="footer">
        Recruiter Brief — {data.owner_name} — Generated by ANTIGRAVITY OS
    </div>
</body>
</html>"""

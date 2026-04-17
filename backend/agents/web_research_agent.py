"""
═══════════════════════════════════════════════════════════
Web Research Agent — ANTIGRAVITY OS v2 (§27.1)
═══════════════════════════════════════════════════════════

Researches the VISITOR'S world (company, tech stack) in real-time.
Uses DuckDuckGo (free, no API key needed).

TRIGGER CONDITIONS:
  - Visitor mentions their company
  - CompanyContextInjector resolves visitor's company from IP
  - Visitor asks "do you know about [X]?"

ETHICAL GUARDRAIL:
  - Never reveal that you researched them
  - Only use publicly available company information
  - Max 3 searches per session (capacity control)
  - Results cached 24h in Redis
"""

from __future__ import annotations

import hashlib
import logging
import re
import time
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.agents.web_research")


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class CompanyIntelligence(BaseModel):
    """Synthesized company profile from web research."""
    company_name: str
    tech_stack: List[str] = Field(default_factory=list)
    recent_posts: List[str] = Field(default_factory=list)
    engineering_culture: str = ""
    relevance_notes: str = ""
    researched_at: float = Field(default_factory=time.time)


class SearchResult(BaseModel):
    title: str = ""
    url: str = ""
    snippet: str = ""


# ═══════════════════════════════════════════════════════════
# WEB RESEARCH AGENT
# ═══════════════════════════════════════════════════════════

class WebResearchAgent:
    """
    Researches visitor's company for contextual conversation.
    """

    MAX_SEARCHES_PER_SESSION = 3
    CACHE_TTL = 86400  # 24 hours

    # Pre-loaded knowledge for major companies (avoid unnecessary searches)
    KNOWN_COMPANIES: Dict[str, CompanyIntelligence] = {
        "google": CompanyIntelligence(
            company_name="Google",
            tech_stack=["Go", "Python", "Java", "C++", "Kubernetes", "Spanner", "BigTable", "TensorFlow"],
            engineering_culture="Systems at scale, SRE culture, design docs, code reviews",
            relevance_notes="Distributed systems emphasis. Highlight: scalability, reliability engineering, ML infra",
        ),
        "meta": CompanyIntelligence(
            company_name="Meta",
            tech_stack=["Python", "Hack/PHP", "C++", "React", "GraphQL", "PyTorch", "Presto"],
            engineering_culture="Move fast, internal tools, React ecosystem, ML-first",
            relevance_notes="Frontend + ML focus. Highlight: React expertise, full-stack, PyTorch",
        ),
        "amazon": CompanyIntelligence(
            company_name="Amazon",
            tech_stack=["Java", "Python", "AWS", "DynamoDB", "Lambda", "SQS", "Kinesis"],
            engineering_culture="Two-pizza teams, working backwards, operational excellence",
            relevance_notes="Service-oriented architecture. Highlight: AWS, event-driven, microservices",
        ),
        "stripe": CompanyIntelligence(
            company_name="Stripe",
            tech_stack=["Ruby", "Go", "TypeScript", "React", "PostgreSQL", "Kafka"],
            engineering_culture="API-first, obsessive about developer experience",
            relevance_notes="API design, payment infrastructure. Highlight: DX, reliability, TypeScript",
        ),
        "openai": CompanyIntelligence(
            company_name="OpenAI",
            tech_stack=["Python", "PyTorch", "Kubernetes", "Ray", "FastAPI", "Redis"],
            engineering_culture="Research-engineering blend, scaling LLMs, safety-first",
            relevance_notes="ML/AI focus. Highlight: LLM orchestration, RAG, AI infrastructure",
        ),
        "microsoft": CompanyIntelligence(
            company_name="Microsoft",
            tech_stack=["C#", "TypeScript", ".NET", "Azure", "Python", "VS Code"],
            engineering_culture="Enterprise + open source, Azure cloud, developer tools",
            relevance_notes="Cloud + AI. Highlight: Azure, enterprise scale, developer tools",
        ),
        "apple": CompanyIntelligence(
            company_name="Apple",
            tech_stack=["Swift", "Objective-C", "Python", "C++", "Metal", "CoreML"],
            engineering_culture="Secrecy, hardware-software integration, polish",
            relevance_notes="Systems + ML. Highlight: performance, on-device ML, system design",
        ),
        "nvidia": CompanyIntelligence(
            company_name="NVIDIA",
            tech_stack=["C++", "CUDA", "Python", "TensorRT", "Triton"],
            engineering_culture="GPU compute, deep learning infrastructure, CUDA ecosystem",
            relevance_notes="GPU/ML infra. Highlight: CUDA, ML systems, performance engineering",
        ),
    }

    def __init__(self):
        self._session_search_counts: Dict[str, int] = {}
        self._cache: Dict[str, CompanyIntelligence] = {}

    async def research_company(
        self, company_name: str, session_id: str = ""
    ) -> Optional[CompanyIntelligence]:
        """
        Research a company. Returns cached or pre-loaded data first,
        then falls back to web search.
        """
        normalized = company_name.lower().strip()
        cache_key = hashlib.md5(normalized.encode()).hexdigest()

        # Check pre-loaded knowledge
        for key, intel in self.KNOWN_COMPANIES.items():
            if key in normalized or normalized in key:
                logger.info(f"Company intel from pre-loaded: {company_name}")
                return intel

        # Check cache
        cached = self._cache.get(cache_key)
        if cached and (time.time() - cached.researched_at) < self.CACHE_TTL:
            logger.info(f"Company intel from cache: {company_name}")
            return cached

        # Rate limit per session
        if session_id:
            count = self._session_search_counts.get(session_id, 0)
            if count >= self.MAX_SEARCHES_PER_SESSION:
                logger.info(
                    f"Session {session_id} search limit reached ({count})"
                )
                return None
            self._session_search_counts[session_id] = count + 1

        # Web search (DuckDuckGo)
        intel = await self._search_and_synthesize(company_name)
        if intel:
            self._cache[cache_key] = intel

        return intel

    async def _search_and_synthesize(
        self, company_name: str
    ) -> Optional[CompanyIntelligence]:
        """
        Search DuckDuckGo and synthesize company profile.
        """
        try:
            results = await self._duckduckgo_search(
                f"{company_name} engineering tech stack"
            )

            if not results:
                return CompanyIntelligence(
                    company_name=company_name,
                    relevance_notes="Limited public information available",
                )

            # Extract tech stack from snippets
            tech_stack = self._extract_tech_stack(results)

            # Extract engineering culture clues
            culture = self._extract_culture(results)

            return CompanyIntelligence(
                company_name=company_name,
                tech_stack=tech_stack,
                recent_posts=[r.title for r in results[:3]],
                engineering_culture=culture,
                relevance_notes=f"Based on {len(results)} search results",
            )

        except Exception as e:
            logger.error(f"Web research failed for {company_name}: {e}")
            return None

    async def _duckduckgo_search(self, query: str) -> List[SearchResult]:
        """
        Search DuckDuckGo via their instant answer API.
        Free, no API key required.
        """
        try:
            import httpx

            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://api.duckduckgo.com/",
                    params={"q": query, "format": "json", "no_html": "1"},
                )

                if resp.status_code != 200:
                    return []

                data = resp.json()
                results = []

                # Abstract (main result)
                if data.get("Abstract"):
                    results.append(SearchResult(
                        title=data.get("Heading", query),
                        url=data.get("AbstractURL", ""),
                        snippet=data["Abstract"][:300],
                    ))

                # Related topics
                for topic in data.get("RelatedTopics", [])[:5]:
                    if isinstance(topic, dict) and topic.get("Text"):
                        results.append(SearchResult(
                            title=topic.get("Text", "")[:100],
                            url=topic.get("FirstURL", ""),
                            snippet=topic.get("Text", "")[:300],
                        ))

                return results

        except Exception as e:
            logger.warning(f"DuckDuckGo search failed: {e}")
            return []

    def _extract_tech_stack(self, results: List[SearchResult]) -> List[str]:
        """Extract technology names from search results."""
        tech_keywords = {
            "python", "javascript", "typescript", "java", "go", "golang",
            "rust", "c++", "ruby", "scala", "kotlin", "swift",
            "react", "vue", "angular", "next.js", "node.js",
            "django", "flask", "fastapi", "spring", "rails",
            "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
            "kafka", "rabbitmq", "kubernetes", "docker", "terraform",
            "aws", "gcp", "azure", "pytorch", "tensorflow",
            "graphql", "rest", "grpc",
        }

        found = set()
        for result in results:
            text = (result.snippet + " " + result.title).lower()
            for tech in tech_keywords:
                if tech in text:
                    found.add(tech.title() if len(tech) > 3 else tech.upper())

        return sorted(found)

    def _extract_culture(self, results: List[SearchResult]) -> str:
        """Extract engineering culture clues from search results."""
        combined = " ".join(r.snippet for r in results[:5])
        if not combined:
            return "Unknown engineering culture"

        # Take first 200 chars as summary
        return combined[:200].strip()

    def generate_context_injection(self, intel: CompanyIntelligence) -> str:
        """
        Generate a context line for the prompt, phrased naturally.
        """
        parts = []
        if intel.tech_stack:
            stack = ", ".join(intel.tech_stack[:6])
            parts.append(f"Their stack includes {stack}")
        if intel.engineering_culture:
            parts.append(f"Culture: {intel.engineering_culture[:100]}")
        if intel.relevance_notes:
            parts.append(intel.relevance_notes)

        return f"[Visitor's company: {intel.company_name}. {'. '.join(parts)}]"


# Singleton
web_research_agent = WebResearchAgent()

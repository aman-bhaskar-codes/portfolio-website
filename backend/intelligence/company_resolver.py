"""
═══════════════════════════════════════════════════════════
Company Resolver — IP → Company mapping + tech stack context
═══════════════════════════════════════════════════════════

Resolves visitor IP addresses to company profiles using:
  1. ip-api.com (free, 45 req/min)
  2. Reverse DNS lookup
  3. Known company CIDR/domain matching
  4. Pre-loaded tech stack database (Stackshare-style)

Provides CompanyContext for persona-aware prompt injection.
"""

from __future__ import annotations

import logging
import socket
from typing import Dict, List, Optional

import httpx
from pydantic import BaseModel, Field

from backend.intelligence.visitor_classifier import CompanyProfile

logger = logging.getLogger("portfolio.intelligence.company")


# ═══════════════════════════════════════════════════════════
# COMPANY CONTEXT (Pre-computed for prompt injection)
# ═══════════════════════════════════════════════════════════

class CompanyContext(BaseModel):
    """Full company context for prompt injection."""
    profile: CompanyProfile
    relevant_projects: List[str] = Field(default_factory=list)
    tech_overlap: List[str] = Field(default_factory=list)
    context_string: str = ""  # Pre-built injection string


# ═══════════════════════════════════════════════════════════
# KNOWN COMPANY TECH STACKS
# ═══════════════════════════════════════════════════════════

COMPANY_TECH_STACKS: Dict[str, Dict] = {
    "google.com": {
        "name": "Google",
        "stack": ["Go", "C++", "Python", "Kubernetes", "Bigtable", "Spanner", "gRPC"],
        "industry": "technology",
        "is_faang": True,
    },
    "meta.com": {
        "name": "Meta",
        "stack": ["Python", "React", "C++", "Hack", "MySQL", "Cassandra", "PyTorch"],
        "industry": "technology",
        "is_faang": True,
    },
    "apple.com": {
        "name": "Apple",
        "stack": ["Swift", "Objective-C", "Python", "C++", "Kubernetes"],
        "industry": "technology",
        "is_faang": True,
    },
    "amazon.com": {
        "name": "Amazon",
        "stack": ["Java", "Python", "Go", "DynamoDB", "SQS", "Lambda", "ECS"],
        "industry": "technology",
        "is_faang": True,
    },
    "microsoft.com": {
        "name": "Microsoft",
        "stack": ["C#", "TypeScript", "Python", "Azure", "SQL Server", ".NET"],
        "industry": "technology",
        "is_faang": True,
    },
    "netflix.com": {
        "name": "Netflix",
        "stack": ["Java", "Python", "Go", "Cassandra", "Kafka", "gRPC"],
        "industry": "entertainment",
        "is_faang": True,
    },
    "stripe.com": {
        "name": "Stripe",
        "stack": ["Ruby", "Go", "TypeScript", "React", "PostgreSQL", "Kafka"],
        "industry": "fintech",
        "is_faang": False,
    },
    "openai.com": {
        "name": "OpenAI",
        "stack": ["Python", "PyTorch", "Kubernetes", "Go", "React", "PostgreSQL"],
        "industry": "AI/ML",
        "is_faang": False,
    },
    "anthropic.com": {
        "name": "Anthropic",
        "stack": ["Python", "Rust", "TypeScript", "React", "PostgreSQL"],
        "industry": "AI/ML",
        "is_faang": False,
    },
    "deepmind.com": {
        "name": "DeepMind",
        "stack": ["Python", "JAX", "TensorFlow", "C++", "Go"],
        "industry": "AI/ML",
        "is_faang": True,
    },
    "shopify.com": {
        "name": "Shopify",
        "stack": ["Ruby", "Go", "TypeScript", "React", "MySQL", "Redis"],
        "industry": "e-commerce",
        "is_faang": False,
    },
    "vercel.com": {
        "name": "Vercel",
        "stack": ["TypeScript", "Go", "Rust", "React", "Next.js", "PostgreSQL"],
        "industry": "developer-tools",
        "is_faang": False,
    },
}

# Aman's tech stack for overlap computation
OWNER_TECH_STACK = {
    "Python", "FastAPI", "LangGraph", "PostgreSQL", "Redis", "Qdrant",
    "Next.js", "TypeScript", "React", "Docker", "Kubernetes", "Celery",
    "Ollama", "RAG", "pgvector", "Nginx", "Prometheus", "Grafana",
}


# ═══════════════════════════════════════════════════════════
# RESOLVER
# ═══════════════════════════════════════════════════════════

async def resolve_company(client_ip: str) -> Optional[CompanyProfile]:
    """
    Multi-strategy company resolution from IP address.
    
    Strategy order (first match wins):
      1. ip-api.com → org/ISP field → match against known companies
      2. Reverse DNS → domain extraction → match against known companies
      3. Return raw ISP/org info as unknown company
    """
    if not client_ip or client_ip in ("127.0.0.1", "::1", "unknown"):
        return None

    # ── Strategy 1: ip-api.com ──
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"http://ip-api.com/json/{client_ip}",
                params={"fields": "status,org,isp,as,query"},
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "success":
                    org = data.get("org", "") or data.get("isp", "")
                    return _match_org_to_company(org)
    except Exception as e:
        logger.debug(f"ip-api.com lookup failed: {e}")

    # ── Strategy 2: Reverse DNS ──
    try:
        hostname = socket.getfqdn(client_ip)
        if hostname and hostname != client_ip:
            domain = _extract_domain(hostname)
            if domain:
                return _match_domain_to_company(domain)
    except Exception as e:
        logger.debug(f"Reverse DNS failed: {e}")

    return None


async def build_company_context(
    profile: CompanyProfile,
) -> CompanyContext:
    """
    Build full company context for prompt injection.
    Pre-computes tech overlap and relevant projects.
    """
    # Compute tech stack overlap
    company_stack_set = set(profile.tech_stack)
    overlap = list(company_stack_set & OWNER_TECH_STACK)

    # Build context injection string
    context_parts = [
        f"Visitor is from {profile.name} ({profile.domain}).",
    ]
    if overlap:
        context_parts.append(
            f"Shared tech stack: {', '.join(overlap)}."
        )
    if profile.is_faang:
        context_parts.append(
            "This is a major tech company — emphasize systems design depth and scale."
        )
    if profile.is_startup:
        context_parts.append(
            "This is a startup — emphasize full-stack ownership and shipping velocity."
        )

    return CompanyContext(
        profile=profile,
        tech_overlap=overlap,
        context_string=" ".join(context_parts),
    )


# ═══════════════════════════════════════════════════════════
# INTERNAL HELPERS
# ═══════════════════════════════════════════════════════════

def _match_org_to_company(org: str) -> Optional[CompanyProfile]:
    """Match ISP/org string to known company."""
    org_lower = org.lower()
    for domain, info in COMPANY_TECH_STACKS.items():
        company_name = info["name"].lower()
        if company_name in org_lower or domain.split(".")[0] in org_lower:
            return CompanyProfile(
                name=info["name"],
                domain=domain,
                tech_stack=info["stack"],
                industry=info.get("industry", "technology"),
                is_faang=info.get("is_faang", False),
                is_startup=False,
            )
    
    # Unknown company — still return basic profile
    if org and len(org) > 2:
        return CompanyProfile(
            name=org,
            domain="unknown",
            tech_stack=[],
            industry="unknown",
        )
    return None


def _match_domain_to_company(domain: str) -> Optional[CompanyProfile]:
    """Match extracted domain to known company database."""
    domain_lower = domain.lower()
    if domain_lower in COMPANY_TECH_STACKS:
        info = COMPANY_TECH_STACKS[domain_lower]
        return CompanyProfile(
            name=info["name"],
            domain=domain_lower,
            tech_stack=info["stack"],
            industry=info.get("industry", "technology"),
            is_faang=info.get("is_faang", False),
        )
    return None


def _extract_domain(hostname: str) -> Optional[str]:
    """Extract root domain from FQDN (e.g., 'mail.google.com' → 'google.com')."""
    parts = hostname.split(".")
    if len(parts) >= 2:
        return f"{parts[-2]}.{parts[-1]}"
    return None

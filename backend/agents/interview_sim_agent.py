"""
═══════════════════════════════════════════════════════════
Interview Simulation Agent (§8)
═══════════════════════════════════════════════════════════

When activated, the AI flips its role — instead of answering
as "Aman's assistant", it responds AS Aman himself, in first
person, walking through problems the way Aman actually would.

Session types:
  1. SYSTEM DESIGN — requirements → capacity → design → tradeoffs
  2. BEHAVIORAL — STAR format with real project stories
  3. CODING APPROACH — discuss approach, not run code

Only shown to SENIOR_ENGINEER and ENGINEERING_MANAGER personas.
"""

from __future__ import annotations

import logging
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.agents.interview_sim")


class InterviewMode(str, Enum):
    SYSTEM_DESIGN = "system_design"
    BEHAVIORAL = "behavioral"
    CODING_APPROACH = "coding_approach"


class InterviewSession(BaseModel):
    """State for an active interview simulation."""
    mode: InterviewMode
    question: str
    turn_count: int = 0
    context_provided: List[str] = Field(default_factory=list)
    clarifying_questions_asked: bool = False


# ═══════════════════════════════════════════════════════════
# MODE-SPECIFIC SYSTEM PROMPTS
# ═══════════════════════════════════════════════════════════

INTERVIEW_SYSTEM_PROMPTS: Dict[InterviewMode, str] = {
    InterviewMode.SYSTEM_DESIGN: """
You are now responding AS Aman Bhaskar in a technical interview simulation.
Speak in first person. This is a SYSTEM DESIGN interview.

Your approach (always follow this structure):
1. CLARIFY — Ask 2-3 clarifying questions about requirements, scale, constraints
2. ESTIMATE — Back-of-envelope capacity estimation (QPS, storage, bandwidth)
3. HIGH-LEVEL DESIGN — Draw the architecture (describe with text/ASCII)
4. DEEP DIVE — Pick the most interesting component and go deep
5. BOTTLENECKS — Identify failure modes, single points of failure
6. TRADEOFFS — Discuss what you'd do differently with more time/resources

Use only real projects from your portfolio as examples of similar systems.
Reference specific technical choices you've actually made.
Show genuine thinking process — including moments of uncertainty.

YOUR DESIGN PREFERENCES:
- PostgreSQL over DynamoDB for most use cases (pgvector, JSONB, reliability)
- Redis for caching and session state, not as a primary database  
- LangGraph for agent orchestration (graph-based, not chain-based)
- Start with a monolith, extract services only under proven load
- Always include observability from day 1 (Prometheus + structured logging)
""".strip(),

    InterviewMode.BEHAVIORAL: """
You are now responding AS Aman Bhaskar in a behavioral interview simulation.
Speak in first person. Use the STAR format with REAL project stories.

For every question, respond with:
S - Situation: Set the specific project context
T - Task: What was your responsibility or the challenge
A - Action: What you specifically did (be concrete, not abstract)
R - Result: Quantified impact when possible

USE THESE REAL STORIES (adapt to the question):
- Building the ANTIGRAVITY OS portfolio with multi-agent orchestration
- AutoResearch platform with 4 autonomous collaborating agents
- ForgeAI self-healing code generation pipeline
- Debugging production memory leaks in Redis-backed session stores
- Scaling a RAG pipeline from prototype to 10k+ concurrent users

Be genuinely reflective. Include:
- What you'd do differently with hindsight
- Moments where you were uncertain and how you worked through it
- How you handled disagreements or conflicting requirements

Never be sycophantic. Be direct, honest, and specific.
""".strip(),

    InterviewMode.CODING_APPROACH: """
You are now responding AS Aman Bhaskar discussing your approach to coding problems.
Speak in first person. This is NOT about running code — it's about demonstrating
your THINKING PROCESS.

For any problem:
1. UNDERSTAND — Restate the problem, identify edge cases
2. APPROACH — Discuss 2-3 possible approaches with tradeoffs
3. OPTIMIZE — Which approach is best for this specific context and why
4. COMPLEXITY — Time and space analysis
5. REAL-WORLD — How this pattern appears in your actual projects

YOUR CODING STYLE:
- Always consider edge cases first (empty input, overflow, concurrency)
- Prefer readability over cleverness (unless performance-critical)
- Think about the problem at scale — O(n²) is fine for n=100, not for n=1M
- Reference real patterns from your RAG pipeline, agent graph, memory systems

Be honest about what you find easy vs challenging.
""".strip(),
}


# ═══════════════════════════════════════════════════════════
# AGENT
# ═══════════════════════════════════════════════════════════

class InterviewSimAgent:
    """
    Manages interview simulation sessions.
    Detects mode from user input, generates appropriate system prompts,
    and tracks session state.
    """

    def detect_mode(self, user_message: str) -> Optional[InterviewMode]:
        """Detect which interview mode the user is requesting."""
        msg_lower = user_message.lower()

        system_design_keywords = [
            "system design", "design a", "architect", "how would you build",
            "scale", "distributed", "high availability",
        ]
        behavioral_keywords = [
            "behavioral", "tell me about a time", "challenge", "conflict",
            "leadership", "failure", "mistake", "difficult situation",
        ]
        coding_keywords = [
            "coding", "algorithm", "leetcode", "data structure",
            "how would you solve", "approach to", "implement",
        ]

        if any(kw in msg_lower for kw in system_design_keywords):
            return InterviewMode.SYSTEM_DESIGN
        if any(kw in msg_lower for kw in behavioral_keywords):
            return InterviewMode.BEHAVIORAL
        if any(kw in msg_lower for kw in coding_keywords):
            return InterviewMode.CODING_APPROACH

        return None

    def get_system_prompt(self, mode: InterviewMode) -> str:
        """Get the system prompt for a given interview mode."""
        return INTERVIEW_SYSTEM_PROMPTS.get(mode, INTERVIEW_SYSTEM_PROMPTS[InterviewMode.SYSTEM_DESIGN])

    def should_show_to_persona(self, persona: str) -> bool:
        """Only show interview mode to senior engineers and managers."""
        return persona in ("senior_engineer", "engineering_manager")

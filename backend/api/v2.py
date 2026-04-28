"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v2 API Router — Extended Endpoints
═══════════════════════════════════════════════════════════

New endpoints for V2 features:
  /api/v2/health              Full system health + circuit breakers
  /api/v2/hero                Persona-adaptive hero variant
  /api/v2/cli/command         CLI easter egg command execution
  /api/v2/debate              Multi-agent debate mode
  /api/v2/stump/score         Stump challenge scoring
  /api/v2/kg/constellation    Knowledge graph for 3D viz
  /api/v2/opportunities       Private opportunity feed
  /api/v2/queue/stats         Request queue metrics
  /api/v2/cost/dashboard      LLM cost dashboard
  /api/v2/security/stats      Security event metrics
"""

from __future__ import annotations

import logging
import re
import time
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request, Header, Depends
from pydantic import BaseModel, Field
from backend.config.settings import settings

def verify_admin(x_admin_token: str = Header(None)):
    if not x_admin_token or x_admin_token != settings.ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

logger = logging.getLogger("portfolio.api.v2")

router = APIRouter(prefix="/api/v2", tags=["antigravity-v2"])


# ═══════════════════════════════════════════════════════════
# REQUEST / RESPONSE MODELS
# ═══════════════════════════════════════════════════════════

class CLICommandRequest(BaseModel):
    command: str
    session_id: str = ""


class CLICommandResponse(BaseModel):
    output: str
    command: str
    exit_code: int = 0


class DebateRequest(BaseModel):
    query: str
    session_id: str = ""


class StumpScoreRequest(BaseModel):
    session_id: str
    question: str
    was_stumped: bool = False
    confidence: float = 0.0


class StumpScore(BaseModel):
    total_questions: int = 0
    stumped_count: int = 0
    answered_count: int = 0
    verdict: str = ""


# In-memory stump scores (Redis in production)
_stump_sessions: dict[str, StumpScore] = {}


# ═══════════════════════════════════════════════════════════
# HEALTH ENDPOINT
# ═══════════════════════════════════════════════════════════

@router.get("/health")
async def system_health():
    """Full system health with circuit breaker states and degradation tier."""
    try:
        from backend.reliability.health_orchestrator import health_orchestrator
        health = await health_orchestrator.get_system_health(force=True)
        return health.model_dump()
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "ollama_available": False,
            "degradation_tier": 5,
            "tier_reason": f"Health check error: {str(e)}",
            "error": str(e),
        }


# ═══════════════════════════════════════════════════════════
# HERO VARIANT ENDPOINT
# ═══════════════════════════════════════════════════════════

@router.get("/hero")
async def get_hero_variant(persona: str = Query(default="casual")):
    """Get persona-adaptive hero section variant."""
    from backend.agents.landing_page_agent import landing_page_agent
    return landing_page_agent.to_api_response(persona)


# ═══════════════════════════════════════════════════════════
# CLI MODE ENDPOINT
# ═══════════════════════════════════════════════════════════

@router.post("/cli/command", response_model=CLICommandResponse)
async def execute_cli_command(request: CLICommandRequest):
    """Execute a CLI easter egg command."""
    cmd = request.command.strip()

    # Parse command
    parts = cmd.split()
    if not parts:
        return CLICommandResponse(
            command=cmd,
            output="Type 'help' for available commands.",
        )

    base_cmd = parts[0].lower()
    args = parts[1:] if len(parts) > 1 else []

    # ── Built-in commands ──

    if base_cmd == "help":
        return CLICommandResponse(
            command=cmd,
            output=_CLI_HELP,
        )

    if base_cmd == "whoami":
        return CLICommandResponse(
            command=cmd,
            output=_CLI_WHOAMI,
        )

    if base_cmd == "ps" or cmd == "ps aux":
        return CLICommandResponse(
            command=cmd,
            output=_CLI_PS_AUX,
        )

    if base_cmd == "uptime":
        return CLICommandResponse(
            command=cmd,
            output=f"System booted: 2024-01-15\nUptime: {_days_since('2024-01-15')} days\nLoad average: high (always building)",
        )

    if base_cmd == "ls":
        target = args[0] if args else "."
        return CLICommandResponse(
            command=cmd,
            output=_handle_ls(target),
        )

    if base_cmd == "cat":
        target = args[0] if args else ""
        return CLICommandResponse(
            command=cmd,
            output=_handle_cat(target),
        )

    if base_cmd == "ping":
        company = " ".join(args) if args else "unknown"
        return CLICommandResponse(
            command=cmd,
            output=_handle_ping(company),
        )

    if base_cmd == "top":
        return CLICommandResponse(
            command=cmd,
            output=_CLI_TOP,
        )

    if base_cmd == "skills":
        skill = " ".join(args).replace("--deep", "").strip()
        return CLICommandResponse(
            command=cmd,
            output=f"Loading deep dive on '{skill}'...\n[Switching to chat mode for detailed discussion]",
        )

    if base_cmd == "exit":
        return CLICommandResponse(
            command=cmd,
            output="Exiting terminal mode. Returning to portfolio UI...",
            exit_code=0,
        )

    if base_cmd == "sudo":
        return CLICommandResponse(
            command=cmd,
            output="Nice try. But you're already in god mode 😎",
        )

    if base_cmd in ("rm", "dd", "mkfs", "chmod"):
        return CLICommandResponse(
            command=cmd,
            output=f"Permission denied: '{cmd}' — this is a portfolio, not a server 😏",
            exit_code=1,
        )

    # Unknown command → hint at chat mode
    return CLICommandResponse(
        command=cmd,
        output=f"Command not found: {base_cmd}\nTry 'help' for available commands, or just ask me in natural language.",
        exit_code=127,
    )


# ═══════════════════════════════════════════════════════════
# DEBATE ENDPOINT
# ═══════════════════════════════════════════════════════════

@router.post("/debate")
async def run_debate(request: DebateRequest):
    """Run multi-agent debate on a tradeoff question."""
    from backend.agents.debate_agent import debate_agent, should_activate_debate

    if not should_activate_debate(request.query):
        return {
            "is_debate": False,
            "reason": "Query doesn't appear to be a tradeoff question. Try 'X vs Y' format.",
        }

    async def ollama_generate(model: str, prompt: str) -> str:
        """Wrapper for Ollama generation."""
        import httpx
        from backend.config.settings import settings

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{settings.OLLAMA_URL}/api/generate",
                json={"model": model, "prompt": prompt, "stream": False},
            )
            if resp.status_code == 200:
                return resp.json().get("response", "")
            return f"[Model {model} unavailable]"

    result = await debate_agent.run_debate(request.query, ollama_generate)
    return result.model_dump()


# ═══════════════════════════════════════════════════════════
# STUMP CHALLENGE ENDPOINT
# ═══════════════════════════════════════════════════════════

@router.post("/stump/score")
async def update_stump_score(request: StumpScoreRequest):
    """Update stump challenge score for a session."""
    session = request.session_id
    if session not in _stump_sessions:
        _stump_sessions[session] = StumpScore()

    score = _stump_sessions[session]
    score.total_questions += 1

    if request.was_stumped or request.confidence < 0.6:
        score.stumped_count += 1
    else:
        score.answered_count += 1

    # Generate verdict
    if score.stumped_count == 0:
        score.verdict = "Looks like I know my stuff! 💪"
    elif score.stumped_count <= 2:
        score.verdict = "You found some edges — nice probing! 🔍"
    else:
        score.verdict = f"Pretty good — you really pushed me! You stumped me {score.stumped_count} times 🎯"

    return score.model_dump()


@router.get("/stump/score/{session_id}")
async def get_stump_score(session_id: str):
    """Get current stump score for a session."""
    score = _stump_sessions.get(session_id, StumpScore())
    return score.model_dump()


# ═══════════════════════════════════════════════════════════
# KG CONSTELLATION ENDPOINT
# ═══════════════════════════════════════════════════════════

@router.get("/kg/constellation")
async def get_constellation_data():
    """Get knowledge graph data for 3D skill constellation."""
    try:
        from backend.knowledge_graph.graph_queries import KnowledgeGraphQueries

        kgq = KnowledgeGraphQueries(db_session=None)
        # Return pre-built graph structure for Three.js
        return {
            "nodes": _get_constellation_nodes(),
            "edges": _get_constellation_edges(),
        }
    except Exception as e:
        logger.error(f"Constellation data failed: {e}")
        return {"nodes": _get_constellation_nodes(), "edges": _get_constellation_edges()}


# ═══════════════════════════════════════════════════════════
# QUEUE & COST DASHBOARDS
# ═══════════════════════════════════════════════════════════

@router.get("/queue/stats", dependencies=[Depends(verify_admin)])
async def get_queue_stats():
    """Get request queue metrics."""
    from backend.reliability.request_queue import request_queue
    stats = await request_queue.get_stats()
    return stats.model_dump()


@router.get("/cost/dashboard", dependencies=[Depends(verify_admin)])
async def get_cost_dashboard():
    """Get LLM cost/token dashboard."""
    from backend.llm.cost_controller import cost_controller
    return cost_controller.get_dashboard().model_dump()


@router.get("/security/stats", dependencies=[Depends(verify_admin)])
async def get_security_stats():
    """Get security event metrics."""
    from backend.reliability.circuit_breaker import get_all_circuit_metrics
    from backend.security.behavioral_monitor import behavioral_monitor

    return {
        "circuit_breakers": get_all_circuit_metrics(),
        "active_sessions_monitored": len(behavioral_monitor._session_risks) if hasattr(behavioral_monitor, '_session_risks') else 0,
    }


# ═══════════════════════════════════════════════════════════
# OPPORTUNITIES (PRIVATE)
# ═══════════════════════════════════════════════════════════

@router.get("/admin/opportunities", dependencies=[Depends(verify_admin)])
async def get_opportunities(request: Request):
    """
    Private: Get discovered job opportunities.
    In production, this should be auth-gated.
    """
    from backend.agents.opportunity_agent import opportunity_agent
    cached = opportunity_agent.get_cached_opportunities()
    return {
        "count": len(cached),
        "opportunities": [o.model_dump() for o in cached[:20]],
    }


# ═══════════════════════════════════════════════════════════
# CLI STATIC CONTENT
# ═══════════════════════════════════════════════════════════

_CLI_HELP = """ANTIGRAVITY OS v2.0 — Terminal Mode

Available commands:
  ls projects/           List all projects
  cat projects/<name>    Show project details
  skills --deep <skill>  Deep dive on a skill
  whoami                 Full bio
  ping <company>         Check stack compatibility
  top                    Live GitHub activity
  ps aux                 Current focus
  uptime                 System uptime
  exit                   Return to normal mode

Pro tip: Any text that isn't a command gets sent to the AI chat."""

_CLI_WHOAMI = """╔══════════════════════════════════════╗
║  Aman Bhaskar                        ║
║  Senior AI Architect                 ║
╠══════════════════════════════════════╣
║  Location:  India                    ║
║  Focus:     Autonomous Intelligence  ║
║  Status:    Building the future      ║
╠══════════════════════════════════════╣
║  Stack:                              ║
║    Python · TypeScript · FastAPI     ║
║    React · PostgreSQL · Redis        ║
║    Qdrant · Ollama · Docker          ║
╠══════════════════════════════════════╣
║  Currently:                          ║
║    Architecting ANTIGRAVITY OS v2    ║
╚══════════════════════════════════════╝"""

_CLI_PS_AUX = """USER     PID  %CPU  %MEM  COMMAND
aman       1  42.0  38.0  building antigravity-os v2
aman       2  28.0  25.0  optimizing rag-pipeline
aman       3  15.0  18.0  training semantic-classifier
aman       4  10.0  12.0  reviewing pull-requests
aman       5   5.0   7.0  drinking chai ☕"""

_CLI_TOP = """ANTIGRAVITY OS — Live Activity Monitor

  PID  MODEL         STATUS    TOKENS/s  TASK
  101  phi4-mini     running   42.3      system-design-response
  102  llama3.2:3b   idle      --        waiting
  103  qwen2.5:3b    running   68.1      faq-classification

  Queue: 0 pending | Circuit Breakers: all CLOSED
  Uptime: stable | Last incident: none"""


def _days_since(date_str: str) -> int:
    from datetime import date
    start = date.fromisoformat(date_str)
    return (date.today() - start).days


def _handle_ls(target: str) -> str:
    if "project" in target:
        return """drwxr-xr-x  antigravity-os/
drwxr-xr-x  autoresearch/
drwxr-xr-x  portfolio-website/
-rw-r--r--  README.md"""
    if "skill" in target:
        return """Python ████████████████████ 95%
TypeScript ██████████████████ 88%
System Design ████████████████████ 95%
ML/AI ██████████████████ 85%
DevOps ████████████████ 80%
React ██████████████ 75%"""
    return f"ls: {target}: directory listing\n.\n..\nprojects/\nskills/\nexperience/"


def _handle_cat(target: str) -> str:
    if "antigravity" in target.lower():
        return """# ANTIGRAVITY OS
The world's most advanced AI-powered portfolio platform.
Stack: Python, FastAPI, React, Ollama, PostgreSQL, Qdrant
Status: Active development (v2)
Architecture: Multi-agent, self-healing, persona-adaptive"""
    if "autoresearch" in target.lower():
        return """# AutoResearch
Autonomous AI research platform with multi-agent orchestration.
Stack: Python, FastAPI, Celery, CrewAI
Status: Production"""
    if not target:
        return "cat: missing file operand"
    return f"cat: {target}: reading...\n[Content would be loaded from knowledge graph]"


def _handle_ping(company: str) -> str:
    company_clean = re.sub(r'[^a-zA-Z0-9\s]', '', company).strip()
    return f"""PING {company_clean}.engineering (127.0.0.1) 56 bytes
64 bytes: stack_match=87% latency=0ms ttl=unlimited
64 bytes: stack_match=87% latency=0ms ttl=unlimited
64 bytes: stack_match=87% latency=0ms ttl=unlimited

--- {company_clean} compatibility statistics ---
3 packets transmitted, 3 received, 0% packet loss
Stack alignment: Python, TypeScript, System Design, AI/ML
Verdict: Strong fit ✅"""


def _get_constellation_nodes() -> list[dict]:
    """Pre-built constellation nodes for Three.js."""
    return [
        {"id": "python", "type": "technology", "label": "Python", "proficiency": 0.95, "color": "#3776AB"},
        {"id": "typescript", "type": "technology", "label": "TypeScript", "proficiency": 0.88, "color": "#3178C6"},
        {"id": "fastapi", "type": "technology", "label": "FastAPI", "proficiency": 0.92, "color": "#009688"},
        {"id": "react", "type": "technology", "label": "React", "proficiency": 0.75, "color": "#61DAFB"},
        {"id": "postgres", "type": "technology", "label": "PostgreSQL", "proficiency": 0.85, "color": "#336791"},
        {"id": "redis", "type": "technology", "label": "Redis", "proficiency": 0.80, "color": "#DC382D"},
        {"id": "docker", "type": "technology", "label": "Docker", "proficiency": 0.82, "color": "#2496ED"},
        {"id": "ollama", "type": "technology", "label": "Ollama/LLM", "proficiency": 0.90, "color": "#7C3AED"},
        {"id": "qdrant", "type": "technology", "label": "Qdrant", "proficiency": 0.78, "color": "#DC2626"},
        {"id": "system_design", "type": "skill", "label": "System Design", "proficiency": 0.95, "color": "#F59E0B"},
        {"id": "ml_engineering", "type": "skill", "label": "ML Engineering", "proficiency": 0.85, "color": "#8B5CF6"},
        {"id": "rag", "type": "skill", "label": "RAG Architecture", "proficiency": 0.90, "color": "#EC4899"},
        {"id": "devops", "type": "skill", "label": "DevOps/Infra", "proficiency": 0.80, "color": "#10B981"},
        {"id": "antigravity", "type": "project", "label": "ANTIGRAVITY OS", "proficiency": 1.0, "color": "#F97316"},
        {"id": "autoresearch", "type": "project", "label": "AutoResearch", "proficiency": 0.9, "color": "#06B6D4"},
        {"id": "portfolio", "type": "project", "label": "Portfolio Website", "proficiency": 0.85, "color": "#84CC16"},
    ]


def _get_constellation_edges() -> list[dict]:
    """Pre-built constellation edges."""
    return [
        {"source": "python", "target": "fastapi", "weight": 0.9, "relation": "used_in"},
        {"source": "python", "target": "ollama", "weight": 0.85, "relation": "used_in"},
        {"source": "typescript", "target": "react", "weight": 0.9, "relation": "used_in"},
        {"source": "fastapi", "target": "antigravity", "weight": 1.0, "relation": "powers"},
        {"source": "react", "target": "antigravity", "weight": 0.9, "relation": "powers"},
        {"source": "postgres", "target": "antigravity", "weight": 0.85, "relation": "stores"},
        {"source": "redis", "target": "antigravity", "weight": 0.8, "relation": "caches"},
        {"source": "qdrant", "target": "rag", "weight": 0.95, "relation": "enables"},
        {"source": "ollama", "target": "rag", "weight": 0.9, "relation": "enables"},
        {"source": "system_design", "target": "antigravity", "weight": 1.0, "relation": "applied_in"},
        {"source": "ml_engineering", "target": "autoresearch", "weight": 0.9, "relation": "applied_in"},
        {"source": "rag", "target": "antigravity", "weight": 0.95, "relation": "core_of"},
        {"source": "docker", "target": "devops", "weight": 0.85, "relation": "part_of"},
        {"source": "devops", "target": "antigravity", "weight": 0.7, "relation": "supports"},
        {"source": "python", "target": "autoresearch", "weight": 0.9, "relation": "used_in"},
        {"source": "fastapi", "target": "autoresearch", "weight": 0.85, "relation": "powers"},
    ]

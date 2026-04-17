"""
═══════════════════════════════════════════════════════════
LLM Cost Controller — ANTIGRAVITY OS v2 (§25.2)
═══════════════════════════════════════════════════════════

Token tracking per model per day. All local Ollama = $0 cost,
but we track throughput for:
  - Capacity planning (prevent OOM)
  - Per-model load balancing
  - Grafana dashboards

Daily token limits prevent GPU memory exhaustion:
  phi4-mini:   500k tokens/day (heaviest)
  llama3.2:3b: 1M tokens/day
  qwen2.5:3b:  2M tokens/day

When limit hit: route to next lighter model.
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict
from datetime import date
from typing import Dict, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.llm.cost_controller")


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class TokenUsage(BaseModel):
    """Token usage for a single LLM call."""
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    latency_ms: float = 0.0
    timestamp: float = Field(default_factory=time.time)


class ModelBudget(BaseModel):
    """Budget status for a single model."""
    model: str
    daily_limit: int
    used_today: int = 0
    remaining: int = 0
    percentage_used: float = 0.0
    over_budget: bool = False


class CostDashboard(BaseModel):
    """Full cost/token dashboard for Grafana."""
    date: str
    models: list[ModelBudget] = Field(default_factory=list)
    total_tokens_today: int = 0
    total_calls_today: int = 0
    tokens_per_persona: Dict[str, int] = Field(default_factory=dict)
    avg_latency_ms: Dict[str, float] = Field(default_factory=dict)


# ═══════════════════════════════════════════════════════════
# DAILY LIMITS
# ═══════════════════════════════════════════════════════════

DAILY_TOKEN_LIMITS: Dict[str, int] = {
    "phi4-mini": 500_000,
    "llama3.2:3b": 1_000_000,
    "qwen2.5:3b": 2_000_000,
}


# ═══════════════════════════════════════════════════════════
# COST CONTROLLER
# ═══════════════════════════════════════════════════════════

class LLMCostController:
    """
    Token tracking and capacity management.
    In production, counters would be in Redis.
    """

    def __init__(self):
        # day_str → model → token count
        self._daily_tokens: Dict[str, Dict[str, int]] = defaultdict(
            lambda: defaultdict(int)
        )
        # day_str → model → call count
        self._daily_calls: Dict[str, Dict[str, int]] = defaultdict(
            lambda: defaultdict(int)
        )
        # day_str → persona → token count
        self._persona_tokens: Dict[str, Dict[str, int]] = defaultdict(
            lambda: defaultdict(int)
        )
        # day_str → model → list of latencies
        self._latencies: Dict[str, Dict[str, list]] = defaultdict(
            lambda: defaultdict(list)
        )

    def record_usage(
        self,
        usage: TokenUsage,
        persona: str = "unknown",
    ):
        """Record token usage from a completed LLM call."""
        today = self._today()

        # Normalize model name
        model = self._normalize_model(usage.model)

        self._daily_tokens[today][model] += usage.total_tokens
        self._daily_calls[today][model] += 1
        self._persona_tokens[today][persona] += usage.total_tokens
        self._latencies[today][model].append(usage.latency_ms)

        # Log warnings at thresholds
        limit = DAILY_TOKEN_LIMITS.get(model, 1_000_000)
        used = self._daily_tokens[today][model]
        pct = (used / limit) * 100

        if pct >= 100:
            logger.error(
                f"🔴 {model} OVER daily token budget: "
                f"{used:,}/{limit:,} ({pct:.0f}%)"
            )
        elif pct >= 80:
            logger.warning(
                f"🟡 {model} approaching daily limit: "
                f"{used:,}/{limit:,} ({pct:.0f}%)"
            )

    def check_budget(self, model: str) -> ModelBudget:
        """Check remaining budget for a model."""
        today = self._today()
        model = self._normalize_model(model)
        limit = DAILY_TOKEN_LIMITS.get(model, 1_000_000)
        used = self._daily_tokens[today].get(model, 0)
        remaining = max(0, limit - used)

        return ModelBudget(
            model=model,
            daily_limit=limit,
            used_today=used,
            remaining=remaining,
            percentage_used=round((used / limit) * 100, 1) if limit else 0,
            over_budget=used >= limit,
        )

    def is_model_available(self, model: str) -> bool:
        """Check if model is within daily budget."""
        budget = self.check_budget(model)
        return not budget.over_budget

    def get_available_models(self) -> list[str]:
        """Get models that are still within budget, in preference order."""
        available = []
        for model in ["phi4-mini", "llama3.2:3b", "qwen2.5:3b"]:
            if self.is_model_available(model):
                available.append(model)
        return available

    def get_dashboard(self) -> CostDashboard:
        """Build the full cost dashboard for Grafana."""
        today = self._today()

        models = []
        for model_name in ["phi4-mini", "llama3.2:3b", "qwen2.5:3b"]:
            models.append(self.check_budget(model_name))

        total_tokens = sum(self._daily_tokens[today].values())
        total_calls = sum(self._daily_calls[today].values())

        # Average latencies
        avg_latencies = {}
        for model, latencies in self._latencies[today].items():
            if latencies:
                avg_latencies[model] = round(
                    sum(latencies) / len(latencies), 1
                )

        return CostDashboard(
            date=today,
            models=models,
            total_tokens_today=total_tokens,
            total_calls_today=total_calls,
            tokens_per_persona=dict(self._persona_tokens[today]),
            avg_latency_ms=avg_latencies,
        )

    def _normalize_model(self, model: str) -> str:
        """Normalize model names (phi4-mini:latest → phi4-mini)."""
        model = model.split(":")[0] if ":" in model and not model.endswith(":3b") else model
        return model

    @staticmethod
    def _today() -> str:
        return date.today().isoformat()


# Singleton
cost_controller = LLMCostController()

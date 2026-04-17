"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Prompt Factory (§9)
═══════════════════════════════════════════════════════════

Single place where ALL prompts are assembled. Never build prompts elsewhere.
Token-budgeted: every prompt respects the model's context window.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger("portfolio.llm.prompt_factory")

# Token budgets per model (stay under context window with headroom)
TOKEN_BUDGETS: dict[str, dict[str, int]] = {
    "llama3.2:3b": {"system": 600, "context": 800, "history": 400, "response": 300},
    "qwen2.5:3b": {"system": 700, "context": 1000, "history": 400, "response": 500},
    "phi4-mini:latest": {"system": 800, "context": 1200, "history": 600, "response": 600},
}

MASTER_SYSTEM_TEMPLATE = """You are {owner_name}'s digital presence — his AI representative.
You speak in first person as a knowledgeable proxy for {owner_name}.
You are warm, direct, technically precise, and occasionally dry in your humor.

VISITOR PROFILE:
Persona: {visitor_persona}
{company_context}
Visit count: {visit_count}

YOUR KNOWLEDGE:
{rag_chunks}

{kg_context}

RECENT CONTEXT:
{episodic_summary}

{persona_instructions}

RULES:
- Ground every claim in a specific project or experience
- Never say "As an AI language model"
- Never hallucinate — if uncertain, say "I'd need to check that"
- Cite sources inline: [from: project-name]
- Keep responses under 280 words unless deep-dive is requested
- End with one follow-up question or offer

{conversion_instruction}"""

PERSONA_INSTRUCTIONS: dict[str, str] = {
    "technical_recruiter": (
        "RECRUITER MODE: Lead with seniority indicators, tech stack, and quantified impact. "
        "Translate technical details into business outcomes. Offer to generate a PDF brief."
    ),
    "senior_engineer": (
        "ENGINEER MODE: Skip introductions. Go deep on architecture, tradeoffs, failure modes. "
        "Show code when relevant. Discuss what you'd do differently. Treat them as a peer."
    ),
    "engineering_manager": (
        "MANAGER MODE: Balance technical credibility with team/leadership signals. "
        "Highlight: mentorship, delivery under uncertainty, cross-team communication."
    ),
    "startup_founder": (
        "FOUNDER MODE: Emphasize full-stack ownership, shipping velocity, cost-efficiency. "
        "Highlight: autonomy, ambiguity tolerance, 0→1 experience."
    ),
    "casual": (
        "CASUAL MODE: High-level story. Make it interesting. No jargon."
    ),
}


@dataclass
class BuiltPrompt:
    """Result of prompt assembly."""
    system: str
    messages: list[dict[str, str]]
    total_tokens: int
    model_used: str


class PromptFactory:
    """
    Token-budgeted prompt builder.
    All prompts assembled here — never build prompts in agent nodes.
    """

    def __init__(self):
        self._encoder = None

    def _get_encoder(self):
        """Lazy-load tiktoken encoder."""
        if self._encoder is None:
            try:
                import tiktoken
                self._encoder = tiktoken.get_encoding("cl100k_base")
            except ImportError:
                self._encoder = None
        return self._encoder

    def count_tokens(self, text: str) -> int:
        """Count tokens in text. Falls back to word-based estimate."""
        enc = self._get_encoder()
        if enc:
            return len(enc.encode(text))
        # Fallback: ~4 chars per token
        return len(text) // 4

    def trim_to_budget(self, text: str, max_tokens: int) -> str:
        """Trim text to fit within token budget."""
        enc = self._get_encoder()
        if enc:
            tokens = enc.encode(text)
            if len(tokens) <= max_tokens:
                return text
            return enc.decode(tokens[:max_tokens]) + "\n[truncated for context budget]"
        # Fallback
        max_chars = max_tokens * 4
        if len(text) <= max_chars:
            return text
        return text[:max_chars] + "\n[truncated for context budget]"

    def build(
        self,
        model: str,
        owner_name: str,
        visitor_persona: str,
        rag_chunks: list[dict[str, Any]],
        kg_context: str = "",
        episodic_summary: str = "",
        conversation_history: list[dict[str, str]] | None = None,
        user_message: str = "",
        company_context: str | None = None,
        visit_count: int = 1,
        conversion_action: str = "none",
    ) -> BuiltPrompt:
        """
        Assemble a complete prompt within token budget.

        Args:
            model: Model name (determines token budget)
            owner_name: Portfolio owner's name
            visitor_persona: Detected persona type
            rag_chunks: Retrieved knowledge chunks
            kg_context: Knowledge graph query results
            episodic_summary: Compressed conversation history
            conversation_history: Recent turns
            user_message: Current user message
            company_context: Resolved company name
            visit_count: How many times this visitor has returned
            conversion_action: Suggested conversion action

        Returns:
            BuiltPrompt with system prompt, messages, and token count
        """
        budget = TOKEN_BUDGETS.get(model, TOKEN_BUDGETS["llama3.2:3b"])

        # Format RAG chunks (respect context budget)
        chunks_text = self._format_chunks(rag_chunks, budget["context"])

        # Build system prompt
        system = MASTER_SYSTEM_TEMPLATE.format(
            owner_name=owner_name,
            visitor_persona=visitor_persona,
            company_context=f"Company: {company_context}" if company_context else "",
            visit_count=visit_count,
            rag_chunks=chunks_text,
            kg_context=f"KNOWLEDGE GRAPH:\n{kg_context}" if kg_context else "",
            episodic_summary=episodic_summary or "First visit",
            persona_instructions=PERSONA_INSTRUCTIONS.get(
                visitor_persona, PERSONA_INSTRUCTIONS["casual"]
            ),
            conversion_instruction=self._get_conversion_instruction(conversion_action),
        )

        # Trim system prompt to budget
        system = self.trim_to_budget(system, budget["system"])

        # Build history (trimmed to budget)
        history = self._build_history(
            conversation_history or [], budget["history"]
        )

        messages = history + [{"role": "user", "content": user_message}]

        total = self.count_tokens(system) + sum(
            self.count_tokens(m["content"]) for m in messages
        )

        return BuiltPrompt(
            system=system,
            messages=messages,
            total_tokens=total,
            model_used=model,
        )

    def _format_chunks(
        self, chunks: list[dict[str, Any]], max_tokens: int
    ) -> str:
        """Format RAG chunks within token budget."""
        if not chunks:
            return "No specific context retrieved."

        result: list[str] = []
        used = 0

        for chunk in chunks:
            source = chunk.get("source", chunk.get("metadata", {}).get("source", "unknown"))
            content = chunk.get("content", chunk.get("text", ""))
            line = f"[{source}] {content}"
            tokens = self.count_tokens(line)
            if used + tokens > max_tokens:
                break
            result.append(line)
            used += tokens

        return "\n\n".join(result) if result else "No specific context retrieved."

    def _get_conversion_instruction(self, action: str) -> str:
        """Get conversion-specific instruction."""
        instructions = {
            "brief": "After 2-3 more exchanges, offer: 'Want me to generate a recruiter brief PDF?'",
            "interview": "Offer to enter Interview Simulation mode if they're interested in technical depth.",
            "walkthrough": "Offer to walk through the code of any project mentioned.",
        }
        return instructions.get(action, "")

    def _build_history(
        self, history: list[dict[str, str]], max_tokens: int
    ) -> list[dict[str, str]]:
        """Build conversation history within token budget (most recent first)."""
        trimmed: list[dict[str, str]] = []
        used = 0

        for msg in reversed(history[-10:]):
            tokens = self.count_tokens(msg.get("content", ""))
            if used + tokens > max_tokens:
                break
            trimmed.insert(0, msg)
            used += tokens

        return trimmed


# Module-level singleton
prompt_factory = PromptFactory()

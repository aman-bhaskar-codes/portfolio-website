"""
═══════════════════════════════════════════════════════════
Prompt Compressor — ANTIGRAVITY OS v2 (§25.3)
═══════════════════════════════════════════════════════════

Intelligent prompt compression to keep context within 4096 tokens
for 3B-class models. Reduces token usage by 40-60%.

Strategies:
  1. CONVERSATION SUMMARY (after 6+ turns: 3000→300 tokens)
  2. RAG CHUNK COMPRESSION (extractive: keep key sentences)
  3. PERSONA PROMPT COMPRESSION (800→200 tokens)
  4. ADAPTIVE CONTEXT SELECTION (top-K by relevance×weight×freshness)
"""

from __future__ import annotations

import logging
import re
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.llm.prompt_compressor")


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class RAGChunk(BaseModel):
    """A retrieved chunk with metadata for ranking."""
    content: str
    source: str = ""
    relevance_score: float = 0.0
    persona_weight: float = 1.0
    freshness_score: float = 1.0
    token_estimate: int = 0


class ConversationTurn(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class CompressionResult(BaseModel):
    """Result of compression."""
    system_prompt: str
    context: str
    conversation_summary: str
    total_token_estimate: int = 0
    compression_ratio: float = 0.0
    strategies_applied: List[str] = Field(default_factory=list)


# ═══════════════════════════════════════════════════════════
# TOKEN ESTIMATION
# ═══════════════════════════════════════════════════════════

def estimate_tokens(text: str) -> int:
    """
    Fast token estimation. Average: 1 token ≈ 4 characters.
    Good enough for budget planning (not billing).
    """
    if not text:
        return 0
    return max(1, len(text) // 4)


# ═══════════════════════════════════════════════════════════
# PROMPT COMPRESSOR
# ═══════════════════════════════════════════════════════════

class PromptCompressor:
    """
    Compresses the full prompt to fit within model context windows.
    """

    # Token budgets for 3B-class models
    MAX_TOTAL_TOKENS = 4096
    BUDGET_SYSTEM_PROMPT = 800      # Compressed persona + instructions
    BUDGET_CONTEXT = 1500           # RAG chunks
    BUDGET_CONVERSATION = 800       # History or summary
    BUDGET_RESPONSE = 996           # Reserved for model output

    def compress(
        self,
        system_prompt: str,
        rag_chunks: List[RAGChunk],
        conversation_history: List[ConversationTurn],
        visitor_persona: str = "casual",
        max_total_tokens: int = 0,
    ) -> CompressionResult:
        """
        Apply all compression strategies and return the compressed prompt.
        """
        max_tokens = max_total_tokens or self.MAX_TOTAL_TOKENS
        strategies = []

        # ── 1. Compress system prompt ──
        compressed_system = self._compress_persona_prompt(
            system_prompt, visitor_persona
        )
        system_tokens = estimate_tokens(compressed_system)
        if system_tokens < estimate_tokens(system_prompt):
            strategies.append("persona_compression")

        # ── 2. Compress conversation history ──
        conversation_text = ""
        if len(conversation_history) > 6:
            conversation_text = self._summarize_conversation(conversation_history)
            strategies.append("conversation_summary")
        else:
            conversation_text = self._format_conversation(conversation_history)

        conv_tokens = estimate_tokens(conversation_text)

        # ── 3. Adaptive context selection ──
        remaining_budget = max_tokens - system_tokens - conv_tokens - self.BUDGET_RESPONSE
        context_text = self._select_and_compress_chunks(
            rag_chunks, remaining_budget
        )
        if rag_chunks:
            strategies.append("adaptive_chunk_selection")

        context_tokens = estimate_tokens(context_text)
        total = system_tokens + conv_tokens + context_tokens

        original_total = (
            estimate_tokens(system_prompt)
            + sum(estimate_tokens(c.content) for c in rag_chunks)
            + sum(estimate_tokens(t.content) for t in conversation_history)
        )

        compression_ratio = (
            round(1 - (total / original_total), 2) if original_total > 0 else 0
        )

        return CompressionResult(
            system_prompt=compressed_system,
            context=context_text,
            conversation_summary=conversation_text,
            total_token_estimate=total,
            compression_ratio=compression_ratio,
            strategies_applied=strategies,
        )

    # ═══════════════════════════════════════════════════════
    # STRATEGY 1: PERSONA PROMPT COMPRESSION
    # ═══════════════════════════════════════════════════════

    def _compress_persona_prompt(
        self, system_prompt: str, persona: str
    ) -> str:
        """
        Reduce system prompt by keeping only relevant persona rules.
        800 tokens → ~200 tokens.
        """
        if estimate_tokens(system_prompt) <= self.BUDGET_SYSTEM_PROMPT:
            return system_prompt

        lines = system_prompt.split("\n")
        essential_lines = []
        persona_section = False

        for line in lines:
            stripped = line.strip()

            # Always keep core identity lines
            if any(kw in stripped.lower() for kw in [
                "you are", "your name", "aman bhaskar",
                "identity:", "core behavior", "never",
                "vault", "critical",
            ]):
                essential_lines.append(line)
                continue

            # Keep persona-relevant sections
            if persona.lower() in stripped.lower():
                persona_section = True
            elif stripped.startswith("#") or stripped.startswith("##"):
                persona_section = False

            if persona_section:
                essential_lines.append(line)

        compressed = "\n".join(essential_lines)

        # If still too long, truncate to budget
        while estimate_tokens(compressed) > self.BUDGET_SYSTEM_PROMPT:
            lines = compressed.split("\n")
            if len(lines) > 5:
                lines = lines[:5] + lines[-3:]
                compressed = "\n".join(lines)
            else:
                compressed = compressed[:self.BUDGET_SYSTEM_PROMPT * 4]
                break

        return compressed

    # ═══════════════════════════════════════════════════════
    # STRATEGY 2: CONVERSATION SUMMARY
    # ═══════════════════════════════════════════════════════

    def _summarize_conversation(
        self, history: List[ConversationTurn]
    ) -> str:
        """
        Extractive summary of conversation (no LLM call).
        Keeps last 3 turns verbatim + summarizes earlier turns.
        """
        if len(history) <= 3:
            return self._format_conversation(history)

        # Keep last 3 turns verbatim
        recent = history[-3:]
        earlier = history[:-3]

        # Summarize earlier turns (extractive: first sentence of each)
        summary_parts = ["[Earlier in conversation:]"]
        for turn in earlier:
            first_sentence = turn.content.split(".")[0].strip()
            if len(first_sentence) > 100:
                first_sentence = first_sentence[:100] + "..."
            summary_parts.append(f"  {turn.role}: {first_sentence}")

        summary_parts.append("\n[Recent messages:]")
        for turn in recent:
            summary_parts.append(f"{turn.role}: {turn.content}")

        return "\n".join(summary_parts)

    def _format_conversation(
        self, history: List[ConversationTurn]
    ) -> str:
        """Format conversation turns for prompt."""
        if not history:
            return ""
        return "\n".join(
            f"{turn.role}: {turn.content}" for turn in history
        )

    # ═══════════════════════════════════════════════════════
    # STRATEGY 3 & 4: CHUNK SELECTION + COMPRESSION
    # ═══════════════════════════════════════════════════════

    def _select_and_compress_chunks(
        self,
        chunks: List[RAGChunk],
        token_budget: int,
    ) -> str:
        """
        Score, rank, and select chunks within budget.
        Score = relevance × persona_weight × freshness
        """
        if not chunks or token_budget <= 0:
            return ""

        # Score and sort
        scored = []
        for chunk in chunks:
            score = (
                chunk.relevance_score
                * chunk.persona_weight
                * chunk.freshness_score
            )
            tokens = chunk.token_estimate or estimate_tokens(chunk.content)
            scored.append((score, tokens, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)

        # Select top-K within budget
        selected = []
        used_tokens = 0

        for score, tokens, chunk in scored:
            # Compress individual chunk if needed
            content = self._compress_chunk(chunk.content, min(tokens, token_budget - used_tokens))

            chunk_tokens = estimate_tokens(content)
            if used_tokens + chunk_tokens > token_budget:
                break

            selected.append(f"[Source: {chunk.source}]\n{content}")
            used_tokens += chunk_tokens

        if not selected:
            return ""

        return "\n---\n".join(selected)

    def _compress_chunk(self, content: str, max_tokens: int) -> str:
        """
        Extractive chunk compression.
        Keep key sentences, remove boilerplate.
        """
        if estimate_tokens(content) <= max_tokens:
            return content

        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', content)
        if not sentences:
            return content[:max_tokens * 4]

        # Score sentences by information density
        scored_sentences = []
        for sent in sentences:
            score = 0
            # Has numbers (specific data)
            if re.search(r'\d+', sent):
                score += 2
            # Has technical terms
            if any(term in sent.lower() for term in [
                "built", "designed", "implemented", "architecture",
                "python", "typescript", "react", "fastapi",
                "database", "api", "performance", "scale",
            ]):
                score += 2
            # Length (medium sentences are usually most informative)
            if 50 < len(sent) < 200:
                score += 1
            scored_sentences.append((score, sent))

        scored_sentences.sort(key=lambda x: x[0], reverse=True)

        # Take top sentences within budget
        result = []
        tokens = 0
        for _, sent in scored_sentences:
            sent_tokens = estimate_tokens(sent)
            if tokens + sent_tokens > max_tokens:
                break
            result.append(sent)
            tokens += sent_tokens

        return " ".join(result)


# Singleton
prompt_compressor = PromptCompressor()

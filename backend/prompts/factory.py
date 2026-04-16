"""
PromptFactory — builds complete, budget-enforced prompts for every LLM call.
Never send raw strings to models. Always go through this factory.
"""

import logging
from typing import Optional

from backend.config.constants import TOKEN_BUDGET, PERSONA
from backend.config.settings import settings
from backend.prompts.templates import (
    SystemPromptTemplate,
    RouterPromptTemplate,
    RAGSynthesisTemplate,
    MemoryCompressionTemplate,
    HyDETemplate,
    SocialSummaryTemplate,
)
from backend.prompts.token_budget import (
    count_tokens,
    compress_history,
    trim_context,
    truncate_to_tokens,
)


logger = logging.getLogger("portfolio.prompts")

# ── Template Singletons ──
_system_template = SystemPromptTemplate()
_router_template = RouterPromptTemplate()
_rag_template = RAGSynthesisTemplate()
_memory_template = MemoryCompressionTemplate()
_hyde_template = HyDETemplate()
_social_template = SocialSummaryTemplate()


class PromptFactory:
    """
    Builds complete prompts with token budget enforcement.
    
    Usage:
        factory = PromptFactory()
        system, user = factory.build_chat_prompt(
            query="What projects has Aman worked on?",
            retrieved_chunks=[...],
            history=[...],
            memory_summary="User is a recruiter...",
        )
    """

    def __init__(self):
        self.budget = TOKEN_BUDGET.copy()

    def build_chat_prompt(
        self,
        query: str,
        retrieved_chunks: Optional[list[dict]] = None,
        history: Optional[list[dict]] = None,
        memory_summary: str = "",
        turn_count: int = 0,
        recent_topics: Optional[list[str]] = None,
        tool_list: Optional[list[str]] = None,
        deep_dive: bool = False,
        owner_bio_chunk: str = "",
    ) -> tuple[str, str]:
        """
        Build a complete chat prompt (system + user) with budget enforcement.
        
        Returns:
            (system_prompt, user_prompt) tuple
        """
        max_words = PERSONA["max_words_deep_dive"] if deep_dive else PERSONA["max_words_default"]

        # ── 1. Build system prompt ──
        system_prompt = _system_template.template.format(
            owner_name=settings.OWNER_NAME,
            owner_bio_chunk=owner_bio_chunk or settings.OWNER_BIO,
            turn_count=turn_count,
            recent_topics=", ".join(recent_topics or ["none yet"]),
            memory_summary=memory_summary or "No prior memory for this visitor.",
            retrieved_chunks=self._format_chunks(retrieved_chunks),
            tool_list=", ".join(tool_list or ["none"]),
            max_words=max_words,
            relevant_link=f"https://github.com/{settings.GITHUB_USERNAME}",
        )

        # ── 2. Enforce token budgets ──
        system_tokens = count_tokens(system_prompt)
        user_tokens = count_tokens(query)

        # Budget remaining after system + user
        remaining = self.budget["total_max"] - system_tokens - user_tokens

        # If over budget: compress history first, then trim context
        if system_tokens > self.budget["system_prompt"]:
            logger.warning(
                f"System prompt over budget: {system_tokens} > {self.budget['system_prompt']}"
            )
            # Trim context chunks to bring system prompt within budget
            if retrieved_chunks:
                reduced_context_budget = max(200, self.budget["retrieved_context"] - (system_tokens - self.budget["system_prompt"]))
                trimmed_chunks = trim_context(retrieved_chunks, reduced_context_budget)
                system_prompt = _system_template.template.format(
                    owner_name=settings.OWNER_NAME,
                    owner_bio_chunk=truncate_to_tokens(owner_bio_chunk or settings.OWNER_BIO, 400),
                    turn_count=turn_count,
                    recent_topics=", ".join(recent_topics or ["none yet"]),
                    memory_summary=truncate_to_tokens(memory_summary, 100) if memory_summary else "No prior memory.",
                    retrieved_chunks=self._format_chunks(trimmed_chunks),
                    tool_list=", ".join(tool_list or ["none"]),
                    max_words=max_words,
                    relevant_link=f"https://github.com/{settings.GITHUB_USERNAME}",
                )

        # ── 3. Build user prompt ──
        compressed_history = ""
        if history:
            history_budget = min(
                self.budget["conversation_history"],
                remaining - 50  # leave some room
            )
            if history_budget > 0:
                compressed_history = compress_history(history, history_budget)

        if compressed_history:
            user_prompt = f"Previous conversation:\n{compressed_history}\n\nCurrent question: {query}"
        else:
            user_prompt = query

        # Final truncation safety net — never truncate system or user message
        user_prompt = truncate_to_tokens(user_prompt, self.budget["user_message"] + self.budget["conversation_history"])

        # ── 4. Log token usage ──
        total = count_tokens(system_prompt) + count_tokens(user_prompt)
        logger.debug(
            f"Prompt built: system={count_tokens(system_prompt)}, "
            f"user={count_tokens(user_prompt)}, total={total}, "
            f"budget={self.budget['total_max']}"
        )

        return system_prompt, user_prompt

    def build_router_prompt(self, query: str) -> str:
        """Build intent classification prompt."""
        return _router_template.template.format(query=query)

    def build_rag_synthesis_prompt(
        self,
        query: str,
        context_chunks: list[dict],
        max_words: int = 280,
    ) -> str:
        """Build RAG synthesis prompt with formatted context."""
        context = self._format_chunks(context_chunks)
        return _rag_template.template.format(
            context=context,
            query=query,
            max_words=max_words,
        )

    def build_memory_compression_prompt(self, conversation: list[dict]) -> str:
        """Build memory compression prompt."""
        formatted = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in conversation
        )
        return _memory_template.template.format(conversation=formatted)

    def build_hyde_prompt(self, query: str) -> str:
        """Build HyDE (Hypothetical Document Embedding) prompt."""
        return _hyde_template.template.format(query=query)

    def build_social_summary_prompt(self, social_data: str) -> str:
        """Build social media summary prompt."""
        return _social_template.template.format(social_data=social_data)

    def _format_chunks(self, chunks: Optional[list[dict]]) -> str:
        """Format retrieved chunks with source and score headers."""
        if not chunks:
            return "No relevant knowledge retrieved."

        formatted = []
        for chunk in chunks:
            source = chunk.get("source", "unknown")
            score = chunk.get("score", 0.0)
            content = chunk.get("content", "")
            formatted.append(f"[Source: {source} | Score: {score:.3f}]\n{content}")

        return "\n\n".join(formatted)


# ── Singleton ──
prompt_factory = PromptFactory()

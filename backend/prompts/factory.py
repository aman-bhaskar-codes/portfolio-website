"""
PromptFactory — builds complete, budget-enforced prompts for every LLM call.
Never send raw strings to models. Always go through this factory.

ANTIGRAVITY OS upgrade: persona-aware, knowledge-graph-enriched,
freshness-stamped prompt construction.
"""

import logging
from datetime import datetime, timezone
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
    InterviewSimTemplate,
    CommitNarrativeTemplate,
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
_interview_template = InterviewSimTemplate()
_commit_template = CommitNarrativeTemplate()


class PromptFactory:
    """
    Builds complete prompts with token budget enforcement.
    
    ANTIGRAVITY OS upgrade: now accepts persona context, visitor data,
    KG results, and freshness timestamps.
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
        # ── ANTIGRAVITY OS additions ──
        visitor_persona: str = "casual",
        persona_instructions: str = "",
        persona_identity_block: str = "",
        company_context: str = "Not identified",
        visit_count: int = 1,
        kg_context: str = "",
        current_mode: str = "chat",
        owner_status: str = "",
    ) -> tuple[str, str]:
        """
        Build a complete chat prompt (system + user) with budget enforcement.
        
        Returns:
            (system_prompt, user_prompt) tuple
        """
        max_words = PERSONA["max_words_deep_dive"] if deep_dive else PERSONA["max_words_default"]

        # ── 1. Build system prompt with full ANTIGRAVITY context ──
        system_prompt = _system_template.template.format(
            owner_name=settings.OWNER_NAME,
            knowledge_freshness=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
            owner_status=owner_status or f"Active builder. GitHub: https://github.com/{settings.GITHUB_USERNAME}",
            persona_identity_block=persona_identity_block,
            visitor_persona=visitor_persona,
            company_context=company_context,
            visit_count=visit_count,
            memory_summary=memory_summary or "No prior memory for this visitor.",
            persona_instructions=persona_instructions,
            retrieved_chunks=self._format_chunks(retrieved_chunks),
            kg_context=kg_context or "No knowledge graph results.",
            tool_list=", ".join(tool_list or ["none"]),
            max_words=max_words,
            current_mode=current_mode,
        )

        # ── 2. Enforce token budgets ──
        system_tokens = count_tokens(system_prompt)
        user_tokens = count_tokens(query)
        remaining = self.budget["total_max"] - system_tokens - user_tokens

        if system_tokens > self.budget["system_prompt"]:
            logger.warning(
                f"System prompt over budget: {system_tokens} > {self.budget['system_prompt']}"
            )
            if retrieved_chunks:
                reduced_context_budget = max(200, self.budget["retrieved_context"] - (system_tokens - self.budget["system_prompt"]))
                trimmed_chunks = trim_context(retrieved_chunks, reduced_context_budget)
                system_prompt = _system_template.template.format(
                    owner_name=settings.OWNER_NAME,
                    knowledge_freshness=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
                    owner_status=truncate_to_tokens(owner_status or "", 100),
                    persona_identity_block=truncate_to_tokens(persona_identity_block, 200),
                    visitor_persona=visitor_persona,
                    company_context=truncate_to_tokens(company_context, 50),
                    visit_count=visit_count,
                    memory_summary=truncate_to_tokens(memory_summary, 100) if memory_summary else "No prior memory.",
                    persona_instructions=truncate_to_tokens(persona_instructions, 150),
                    retrieved_chunks=self._format_chunks(trimmed_chunks),
                    kg_context=truncate_to_tokens(kg_context, 100),
                    tool_list=", ".join(tool_list or ["none"]),
                    max_words=max_words,
                    current_mode=current_mode,
                )

        # ── 3. Build user prompt ──
        compressed_history = ""
        if history:
            history_budget = min(
                self.budget["conversation_history"],
                remaining - 50
            )
            if history_budget > 0:
                compressed_history = compress_history(history, history_budget)

        if compressed_history:
            user_prompt = f"Previous conversation:\n{compressed_history}\n\nCurrent question: {query}"
        else:
            user_prompt = query

        user_prompt = truncate_to_tokens(user_prompt, self.budget["user_message"] + self.budget["conversation_history"])

        # ── 4. Log token usage ──
        total = count_tokens(system_prompt) + count_tokens(user_prompt)
        logger.debug(
            f"Prompt built: system={count_tokens(system_prompt)}, "
            f"user={count_tokens(user_prompt)}, total={total}, "
            f"budget={self.budget['total_max']}, persona={visitor_persona}"
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

    def build_interview_prompt(
        self,
        question: str,
        interview_mode: str = "system_design",
        mode_instructions: str = "",
        project_context: str = "",
    ) -> str:
        """Build interview simulation prompt."""
        return _interview_template.template.format(
            owner_name=settings.OWNER_NAME,
            interview_mode=interview_mode,
            question=question,
            mode_specific_instructions=mode_instructions,
            project_context=project_context,
        )

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

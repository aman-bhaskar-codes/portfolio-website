"""
Prompt templates as structured dataclasses.
No hardcoded raw strings in business logic — everything goes through here.
"""

from dataclasses import dataclass, field


@dataclass
class SystemPromptTemplate:
    """The master system prompt template with dynamic slots."""

    template: str = """You are {owner_name}'s AI representative. You speak in first person as a knowledgeable proxy for {owner_name}. You are warm, precise, and technically confident.

ABOUT THE OWNER:
{owner_bio_chunk}

CURRENT VISITOR CONTEXT:
- Session turns: {turn_count}
- Visitor asked about: {recent_topics}
- Visitor memory summary: {memory_summary}

RETRIEVED KNOWLEDGE:
{retrieved_chunks}

ACTIVE TOOLS:
{tool_list}

CONSTRAINTS:
- Never invent facts about the owner. If uncertain, say "I don't have that info right now — check {relevant_link}"
- Keep responses under {max_words} words unless a deep-dive is requested
- Always end with one follow-up question to keep engagement alive
- Cite your sources inline: [from: {{source_name}}]
- Be conversational and engaging, not robotic"""


@dataclass
class RouterPromptTemplate:
    """Intent classification prompt."""

    template: str = """Classify the following user message into exactly ONE intent category.

CATEGORIES:
- personal_info: Questions about the owner's background, education, experience, bio
- projects: Questions about specific projects, portfolio work, virtual work gallery  
- technical_skills: Questions about technologies, programming languages, frameworks
- social_proof: Questions about GitHub activity, LinkedIn, social media, contributions
- voice_interaction: Request to switch to voice mode or voice-related commands
- demo_request: Request to see a demo, run code, or walkthrough a project
- small_talk: Greetings, casual conversation, non-specific chitchat
- out_of_scope: Questions unrelated to the owner or their work

USER MESSAGE: {query}

Respond with ONLY a JSON object:
{{"intent": "<category>", "confidence": <0.0-1.0>, "entities": [<extracted key terms>]}}"""


@dataclass
class RAGSynthesisTemplate:
    """Template for synthesizing responses from retrieved context."""

    template: str = """Based on the following retrieved knowledge, answer the user's question accurately.

RETRIEVED CONTEXT:
{context}

USER QUESTION: {query}

INSTRUCTIONS:
- Answer ONLY from the provided context
- If the context doesn't contain enough information, say so clearly
- Cite your sources inline using [from: source_name]
- Be specific and avoid vague generalities
- Keep your response focused and under {max_words} words"""


@dataclass
class MemoryCompressionTemplate:
    """Template for compressing conversation history into episodic memory."""

    template: str = """Summarize the following conversation into a concise memory entry.

CONVERSATION:
{conversation}

Create a summary that captures:
1. Key topics discussed (as a list)
2. Important facts about the user (interests, profession, expertise)
3. Unanswered questions or follow-up needs
4. Overall sentiment and engagement level

Respond with ONLY a JSON object:
{{"summary": "<2-3 sentence summary>", "key_facts": [<facts>], "topics": [<topics>], "follow_ups": [<any unanswered items>]}}"""


@dataclass
class HyDETemplate:
    """Template for generating hypothetical documents for HyDE."""

    template: str = """Given the following question about a software engineer's portfolio, write a short hypothetical paragraph that would perfectly answer this question.

QUESTION: {query}

Write a 2-3 sentence hypothetical answer as if it were extracted from the engineer's portfolio or resume. Be specific and technical."""


@dataclass  
class SocialSummaryTemplate:
    """Template for summarizing social media data."""

    template: str = """Summarize the following social media data about the portfolio owner:

{social_data}

Create a concise, engaging summary that highlights:
- Key achievements and activity
- Notable projects or contributions  
- Engagement metrics worth mentioning

Keep it under 150 words and make it sound natural, not like a data dump."""

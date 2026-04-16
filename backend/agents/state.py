"""
Agent State — TypedDict defining the shared state across all LangGraph nodes.
"""

from typing import TypedDict, Optional, Annotated
from operator import add


class AgentState(TypedDict, total=False):
    """
    Shared state flowing through the LangGraph StateGraph.
    Each node reads from and writes to this state.
    """
    
    # ── Input ──
    query: str                          # User's original query
    session_id: str                     # Session identifier
    user_id: str                        # User identifier (or anonymous_id)
    conversation_id: str                # Conversation thread ID
    deep_dive: bool                     # Whether user requested extended response
    model_override: Optional[str]       # Force a specific model
    
    # ── Router Output ──
    intent: str                         # Classified intent label
    confidence: float                   # Intent classification confidence
    entities: list[str]                 # Extracted entities from query
    
    # ── RAG Output ──
    retrieved_chunks: list[dict]        # Top-k retrieved and reranked chunks
    hyde_used: bool                     # Whether HyDE was used for this query
    
    # ── Memory Context ──
    memory_context: str                 # Assembled memory from all tiers
    turn_count: int                     # Number of turns in this session
    recent_topics: list[str]            # Recently discussed topic labels
    conversation_history: list[dict]    # Recent conversation messages
    
    # ── Social Output ──
    social_data: dict                   # Fetched social media data
    
    # ── Code Output ──
    code_output: str                    # Code agent output (syntax highlighted)
    
    # ── Voice ──
    voice_audio: Optional[bytes]        # TTS audio bytes
    voice_mode: bool                    # Whether in voice mode
    
    # ── Final Response ──
    response: str                       # Final assembled response text
    citations: list[str]               # Source citations
    model_used: str                     # Which model was used
    latency_ms: int                     # Total processing latency
    
    # ── Error Handling ──
    error: Optional[str]               # Error message if any node failed

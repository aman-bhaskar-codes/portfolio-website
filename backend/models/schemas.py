"""
Pydantic schemas for API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ═══════════════════════════════════════════════════════════
# CHAT
# ═══════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    session_id: str = Field(default="default")
    user_id: str = Field(default="anonymous")
    conversation_id: Optional[str] = None
    model_override: Optional[str] = None  # Force a specific model
    deep_dive: bool = False  # Request extended response


class ChatChunk(BaseModel):
    """Single SSE chunk sent to frontend."""
    token: str = ""
    done: bool = False
    intent: Optional[str] = None
    model_used: Optional[str] = None
    citations: list[str] = []
    latency_ms: Optional[int] = None


class ChatResponse(BaseModel):
    """Full response (non-streaming)."""
    response: str
    intent: str
    model_used: str
    citations: list[str] = []
    latency_ms: int
    session_id: str
    conversation_id: str


# ═══════════════════════════════════════════════════════════
# AGENT STATE
# ═══════════════════════════════════════════════════════════

class IntentClassification(BaseModel):
    intent: str
    confidence: float = Field(ge=0.0, le=1.0)
    entities: list[str] = []


class RetrievedChunk(BaseModel):
    content: str
    source: str
    source_type: str
    score: float
    chunk_id: str


# ═══════════════════════════════════════════════════════════
# INGESTION
# ═══════════════════════════════════════════════════════════

class IngestRequest(BaseModel):
    source_path: Optional[str] = None  # Specific path, or None for full re-ingestion
    source_type: str = "document"      # 'document', 'github', 'linkedin', 'instagram'
    force: bool = False                # Force re-ingestion even if unchanged


class IngestResponse(BaseModel):
    status: str
    task_id: Optional[str] = None
    chunks_processed: int = 0


# ═══════════════════════════════════════════════════════════
# HEALTH
# ═══════════════════════════════════════════════════════════

class ServiceHealth(BaseModel):
    status: str  # 'healthy', 'unhealthy', 'degraded'
    services: dict[str, str | dict]

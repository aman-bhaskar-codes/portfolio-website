"""
═══════════════════════════════════════════════════════════
Knowledge Graph — Entity & Relation Models
═══════════════════════════════════════════════════════════

PostgreSQL-based knowledge graph using entity tables with
explicit relation types. No separate Neo4j needed — just
structured tables with pgvector embeddings on entities.

Entity types: project, skill, technology, company, concept, experience
Relation types: uses_technology, demonstrates_skill, worked_at, 
                inspired_by, applied_in, is_instance_of, requires
"""

from __future__ import annotations

import uuid
import logging
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger("portfolio.kg")


# ═══════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════

class EntityType(str, Enum):
    PROJECT = "project"
    SKILL = "skill"
    TECHNOLOGY = "technology"
    COMPANY = "company"
    CONCEPT = "concept"
    EXPERIENCE = "experience"


class RelationType(str, Enum):
    USES_TECHNOLOGY = "uses_technology"
    DEMONSTRATES_SKILL = "demonstrates_skill"
    WORKED_AT = "worked_at"
    INSPIRED_BY = "inspired_by"
    APPLIED_IN = "applied_in"
    IS_INSTANCE_OF = "is_instance_of"
    REQUIRES = "requires"
    RELATED_TO = "related_to"
    EVOLVED_FROM = "evolved_from"
    CONTRIBUTED_TO = "contributed_to"


# ═══════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════

class KGEntity(BaseModel):
    """A node in the knowledge graph."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: EntityType
    name: str
    properties: Dict[str, Any] = Field(default_factory=dict)
    embedding: Optional[List[float]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class KGRelation(BaseModel):
    """An edge in the knowledge graph."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_id: str
    target_id: str
    relation_type: RelationType
    weight: float = Field(default=1.0, ge=0.0, le=1.0)
    evidence: str = ""
    properties: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class KGQueryResult(BaseModel):
    """Result from a knowledge graph traversal."""
    entities: List[KGEntity] = Field(default_factory=list)
    relations: List[KGRelation] = Field(default_factory=list)
    summary: str = ""

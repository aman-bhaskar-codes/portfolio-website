"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Knowledge Graph Schema
═══════════════════════════════════════════════════════════

Defines the structure for extracting graph nodes/edges.
Used by Outlines structured generation.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class EntityType(str, Enum):
    PROJECT = "project"
    SKILL = "skill"
    TECHNOLOGY = "technology"
    COMPANY = "company"
    ROLE = "role"
    CONCEPT = "concept"


class RelationType(str, Enum):
    BUILT_WITH = "built_with"      # Project -> Technology
    WORKED_AT = "worked_at"        # Role -> Company
    REQUIRES = "requires"          # Skill -> Technology
    IMPLEMENTS = "implements"      # Project -> Concept
    HAS_SKILL = "has_skill"        # Role -> Skill
    SIMILAR_TO = "similar_to"      # Concept -> Concept


class Entity(BaseModel):
    name: str = Field(description="Name of the entity (e.g., 'React', 'Antigravity OS')")
    type: EntityType = Field(description="Category of the entity")
    properties: dict[str, str] = Field(
        default_factory=dict,
        description="Optional key-value pairs (e.g., version, description)"
    )


class Relation(BaseModel):
    source_entity: str = Field(description="Name of the starting entity")
    target_entity: str = Field(description="Name of the target entity")
    relation_type: RelationType = Field(description="How they are connected")
    context: str = Field(description="Brief explanation of this connection")


class KnowledgeGraphExtraction(BaseModel):
    """Output schema for the LLM extraction step."""
    entities: list[Entity] = Field(description="List of entities found in the text")
    relations: list[Relation] = Field(description="List of relationships between entities")

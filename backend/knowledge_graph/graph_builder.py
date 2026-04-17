"""
═══════════════════════════════════════════════════════════
Knowledge Graph — Auto-Builder
═══════════════════════════════════════════════════════════

Auto-populates the knowledge graph during ingestion.
Extracts entities and relations from:
  - Project metadata (tech stack, skills, impact)
  - GitHub repo analysis (architecture patterns)
  - Owner-provided content (bio, career story)
"""

from __future__ import annotations

import logging
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.knowledge_graph.entities import (
    KGEntity, KGRelation, EntityType, RelationType,
)

logger = logging.getLogger("portfolio.kg.builder")


# ═══════════════════════════════════════════════════════════
# KNOWN ENTITIES (Bootstrap)
# ═══════════════════════════════════════════════════════════

# Technologies Aman uses — auto-seeded as entities
KNOWN_TECHNOLOGIES = [
    "Python", "TypeScript", "JavaScript", "Go", "Rust", "SQL",
    "FastAPI", "Next.js", "React", "LangGraph", "LangChain",
    "PostgreSQL", "Redis", "Qdrant", "Docker", "Kubernetes",
    "Celery", "Nginx", "Prometheus", "Grafana", "Ollama",
    "pgvector", "SQLAlchemy", "Pydantic", "Framer Motion",
    "Three.js", "React Three Fiber", "TailwindCSS",
    "WeasyPrint", "edge-tts", "tiktoken", "httpx",
]

# Skills — auto-seeded as entities
KNOWN_SKILLS = [
    "Distributed Systems", "RAG Architecture", "Agent Orchestration",
    "Multi-Model LLM Systems", "Vector Search", "Knowledge Graphs",
    "Real-Time Streaming", "API Design", "Database Design",
    "Production Infrastructure", "Observability", "Security Hardening",
    "Frontend Engineering", "3D Visualization", "Voice Interfaces",
    "Memory Systems", "Prompt Engineering", "CI/CD Pipelines",
]


class KnowledgeGraphBuilder:
    """Builds and maintains the KG from ingested content."""

    def __init__(self, session: AsyncSession):
        self.db = session

    async def seed_base_entities(self):
        """
        Seed known technologies and skills as entities.
        Idempotent — skips if already exists.
        """
        for tech in KNOWN_TECHNOLOGIES:
            await self._upsert_entity(EntityType.TECHNOLOGY, tech, {"category": "tech"})
        for skill in KNOWN_SKILLS:
            await self._upsert_entity(EntityType.SKILL, skill, {"category": "skill"})

        await self.db.commit()
        logger.info(f"Seeded {len(KNOWN_TECHNOLOGIES)} tech + {len(KNOWN_SKILLS)} skill entities")

    async def ingest_project(
        self,
        project_name: str,
        tech_stack: List[str],
        skills_demonstrated: List[str],
        properties: Optional[Dict] = None,
    ):
        """
        Create a project entity and link it to technologies and skills.
        """
        props = properties or {}
        project_entity = await self._upsert_entity(
            EntityType.PROJECT, project_name, props
        )

        # Link to technologies
        for tech in tech_stack:
            tech_entity = await self._upsert_entity(EntityType.TECHNOLOGY, tech, {})
            await self._upsert_relation(
                source_id=project_entity.id,
                target_id=tech_entity.id,
                relation_type=RelationType.USES_TECHNOLOGY,
                weight=0.9,
                evidence=f"{project_name} uses {tech}",
            )

        # Link to skills
        for skill in skills_demonstrated:
            skill_entity = await self._upsert_entity(EntityType.SKILL, skill, {})
            await self._upsert_relation(
                source_id=project_entity.id,
                target_id=skill_entity.id,
                relation_type=RelationType.DEMONSTRATES_SKILL,
                weight=0.85,
                evidence=f"{project_name} demonstrates {skill}",
            )

        await self.db.commit()
        logger.info(f"Ingested project '{project_name}': {len(tech_stack)} tech, {len(skills_demonstrated)} skills")

    async def ingest_experience(
        self,
        role: str,
        company: str,
        technologies: List[str],
        properties: Optional[Dict] = None,
    ):
        """Create experience + company entities and link them."""
        props = properties or {}
        exp_entity = await self._upsert_entity(EntityType.EXPERIENCE, role, props)
        company_entity = await self._upsert_entity(
            EntityType.COMPANY, company, {"industry": props.get("industry", "technology")}
        )

        await self._upsert_relation(
            source_id=exp_entity.id,
            target_id=company_entity.id,
            relation_type=RelationType.WORKED_AT,
            weight=1.0,
            evidence=f"{role} at {company}",
        )

        for tech in technologies:
            tech_entity = await self._upsert_entity(EntityType.TECHNOLOGY, tech, {})
            await self._upsert_relation(
                source_id=exp_entity.id,
                target_id=tech_entity.id,
                relation_type=RelationType.USES_TECHNOLOGY,
                weight=0.8,
                evidence=f"Used {tech} as {role} at {company}",
            )

        await self.db.commit()

    async def extract_entities_from_text(self, text_content: str) -> List[Tuple[str, EntityType]]:
        """
        Simple NER-like extraction: check if known entity names appear in text.
        Returns list of (entity_name, entity_type) tuples.
        """
        found = []
        text_lower = text_content.lower()

        for tech in KNOWN_TECHNOLOGIES:
            if tech.lower() in text_lower:
                found.append((tech, EntityType.TECHNOLOGY))

        for skill in KNOWN_SKILLS:
            if skill.lower() in text_lower:
                found.append((skill, EntityType.SKILL))

        return found

    # ═══════════════════════════════════════════════════════
    # INTERNAL HELPERS
    # ═══════════════════════════════════════════════════════

    async def _upsert_entity(
        self, entity_type: EntityType, name: str, properties: Dict
    ) -> KGEntity:
        """Insert entity if not exists, return existing or new."""
        result = await self.db.execute(
            text("""
                SELECT id, type, name, properties, created_at, updated_at 
                FROM kg_entities 
                WHERE LOWER(name) = LOWER(:name) AND type = :type
            """),
            {"name": name, "type": entity_type.value},
        )
        row = result.fetchone()
        if row:
            return KGEntity(
                id=str(row[0]), type=row[1], name=row[2],
                properties=row[3] or {}, created_at=row[4], updated_at=row[5],
            )

        # Insert new entity
        import uuid
        entity_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        await self.db.execute(
            text("""
                INSERT INTO kg_entities (id, type, name, properties, created_at, updated_at)
                VALUES (:id, :type, :name, :properties::jsonb, :created_at, :updated_at)
            """),
            {
                "id": entity_id, "type": entity_type.value, "name": name,
                "properties": str(properties).replace("'", '"'),
                "created_at": now, "updated_at": now,
            },
        )
        return KGEntity(
            id=entity_id, type=entity_type, name=name,
            properties=properties, created_at=now, updated_at=now,
        )

    async def _upsert_relation(
        self,
        source_id: str,
        target_id: str,
        relation_type: RelationType,
        weight: float = 1.0,
        evidence: str = "",
    ) -> KGRelation:
        """Insert relation if not exists between source and target."""
        result = await self.db.execute(
            text("""
                SELECT id FROM kg_relations
                WHERE source_id = :source AND target_id = :target 
                AND relation_type = :rel_type
            """),
            {"source": source_id, "target": target_id, "rel_type": relation_type.value},
        )
        if result.fetchone():
            # Update weight if relation already exists
            await self.db.execute(
                text("""
                    UPDATE kg_relations SET weight = :weight, evidence = :evidence
                    WHERE source_id = :source AND target_id = :target 
                    AND relation_type = :rel_type
                """),
                {
                    "source": source_id, "target": target_id,
                    "rel_type": relation_type.value,
                    "weight": weight, "evidence": evidence,
                },
            )
            return KGRelation(
                source_id=source_id, target_id=target_id,
                relation_type=relation_type, weight=weight, evidence=evidence,
            )

        import uuid
        rel_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        await self.db.execute(
            text("""
                INSERT INTO kg_relations (id, source_id, target_id, relation_type, weight, evidence, properties, created_at)
                VALUES (:id, :source, :target, :rel_type, :weight, :evidence, '{}'::jsonb, :created_at)
            """),
            {
                "id": rel_id, "source": source_id, "target": target_id,
                "rel_type": relation_type.value, "weight": weight,
                "evidence": evidence, "created_at": now,
            },
        )
        return KGRelation(
            id=rel_id, source_id=source_id, target_id=target_id,
            relation_type=relation_type, weight=weight, evidence=evidence,
        )

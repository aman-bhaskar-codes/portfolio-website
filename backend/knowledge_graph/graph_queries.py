"""
═══════════════════════════════════════════════════════════
Knowledge Graph — Query Engine
═══════════════════════════════════════════════════════════

Complex graph traversal queries against PostgreSQL kg_entities
and kg_relations tables. Supports:
  - Entity lookup by type/name
  - Relation traversal (1-hop and 2-hop)
  - Skill → Project mapping
  - Technology → Impact scoring
  - Cross-entity reasoning
"""

from __future__ import annotations

import logging
from typing import List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.knowledge_graph.entities import (
    KGEntity, KGRelation, KGQueryResult,
    EntityType, RelationType,
)

logger = logging.getLogger("portfolio.kg.queries")


class KnowledgeGraphQuerier:
    """Executes graph traversal queries against PostgreSQL."""

    def __init__(self, session: AsyncSession):
        self.db = session

    async def get_entity_by_name(
        self, name: str, entity_type: Optional[EntityType] = None
    ) -> Optional[KGEntity]:
        """Find entity by name with optional type filter."""
        query = "SELECT id, type, name, properties, created_at, updated_at FROM kg_entities WHERE LOWER(name) = LOWER(:name)"
        params = {"name": name}
        if entity_type:
            query += " AND type = :type"
            params["type"] = entity_type.value

        result = await self.db.execute(text(query), params)
        row = result.fetchone()
        if row:
            return KGEntity(
                id=str(row[0]), type=row[1], name=row[2],
                properties=row[3] or {}, created_at=row[4], updated_at=row[5],
            )
        return None

    async def get_related_entities(
        self,
        entity_id: str,
        relation_type: Optional[RelationType] = None,
        direction: str = "outgoing",
        min_weight: float = 0.0,
    ) -> KGQueryResult:
        """
        Traverse one hop from an entity.
        direction: 'outgoing' (source→target), 'incoming' (target→source), 'both'
        """
        entities: List[KGEntity] = []
        relations: List[KGRelation] = []

        clauses = []
        params = {"entity_id": entity_id, "min_weight": min_weight}

        if direction in ("outgoing", "both"):
            clauses.append(
                "SELECT r.id as rid, r.source_id, r.target_id, r.relation_type, "
                "r.weight, r.evidence, r.properties as rprops, r.created_at as rcreated, "
                "e.id as eid, e.type, e.name, e.properties as eprops, e.created_at as ecreated, e.updated_at "
                "FROM kg_relations r JOIN kg_entities e ON r.target_id = e.id "
                "WHERE r.source_id = :entity_id AND r.weight >= :min_weight"
            )
        if direction in ("incoming", "both"):
            clauses.append(
                "SELECT r.id as rid, r.source_id, r.target_id, r.relation_type, "
                "r.weight, r.evidence, r.properties as rprops, r.created_at as rcreated, "
                "e.id as eid, e.type, e.name, e.properties as eprops, e.created_at as ecreated, e.updated_at "
                "FROM kg_relations r JOIN kg_entities e ON r.source_id = e.id "
                "WHERE r.target_id = :entity_id AND r.weight >= :min_weight"
            )

        query = " UNION ALL ".join(clauses)
        if relation_type:
            query = query.replace(
                "AND r.weight >= :min_weight",
                "AND r.weight >= :min_weight AND r.relation_type = :rel_type"
            )
            params["rel_type"] = relation_type.value

        query += " ORDER BY weight DESC"

        result = await self.db.execute(text(query), params)
        for row in result.fetchall():
            relations.append(KGRelation(
                id=str(row[0]), source_id=str(row[1]), target_id=str(row[2]),
                relation_type=row[3], weight=row[4], evidence=row[5] or "",
                properties=row[6] or {}, created_at=row[7],
            ))
            entities.append(KGEntity(
                id=str(row[8]), type=row[9], name=row[10],
                properties=row[11] or {}, created_at=row[12], updated_at=row[13],
            ))

        return KGQueryResult(entities=entities, relations=relations)

    async def find_projects_by_skill(
        self, skill_name: str, min_weight: float = 0.5
    ) -> List[KGEntity]:
        """Find all projects that demonstrate a given skill."""
        query = text("""
            SELECT DISTINCT e1.id, e1.type, e1.name, e1.properties, 
                   e1.created_at, e1.updated_at, r.weight
            FROM kg_entities e1
            JOIN kg_relations r ON e1.id = r.source_id
            JOIN kg_entities e2 ON r.target_id = e2.id
            WHERE e1.type = 'project'
              AND r.relation_type = 'demonstrates_skill'
              AND LOWER(e2.name) = LOWER(:skill_name)
              AND r.weight >= :min_weight
            ORDER BY r.weight DESC
        """)
        result = await self.db.execute(query, {"skill_name": skill_name, "min_weight": min_weight})
        return [
            KGEntity(
                id=str(row[0]), type=row[1], name=row[2],
                properties=row[3] or {}, created_at=row[4], updated_at=row[5],
            )
            for row in result.fetchall()
        ]

    async def find_projects_by_technology(
        self, tech_name: str, min_weight: float = 0.5
    ) -> List[KGEntity]:
        """Find all projects that use a given technology."""
        query = text("""
            SELECT DISTINCT e1.id, e1.type, e1.name, e1.properties, 
                   e1.created_at, e1.updated_at, r.weight
            FROM kg_entities e1
            JOIN kg_relations r ON e1.id = r.source_id
            JOIN kg_entities e2 ON r.target_id = e2.id
            WHERE e1.type = 'project'
              AND r.relation_type = 'uses_technology'
              AND LOWER(e2.name) = LOWER(:tech_name)
              AND r.weight >= :min_weight
            ORDER BY r.weight DESC
        """)
        result = await self.db.execute(query, {"tech_name": tech_name, "min_weight": min_weight})
        return [
            KGEntity(
                id=str(row[0]), type=row[1], name=row[2],
                properties=row[3] or {}, created_at=row[4], updated_at=row[5],
            )
            for row in result.fetchall()
        ]

    async def get_skill_depth_profile(self) -> List[dict]:
        """
        Return all skills with their depth (how many projects demonstrate them)
        and average weight. Used for tech radar visualization.
        """
        query = text("""
            SELECT e.name, COUNT(r.id) as project_count, AVG(r.weight) as avg_weight
            FROM kg_entities e
            JOIN kg_relations r ON e.id = r.target_id
            WHERE e.type = 'skill'
              AND r.relation_type = 'demonstrates_skill'
            GROUP BY e.name
            ORDER BY project_count DESC, avg_weight DESC
        """)
        result = await self.db.execute(query)
        return [
            {"skill": row[0], "project_count": row[1], "avg_weight": round(float(row[2]), 2)}
            for row in result.fetchall()
        ]

    async def build_context_for_query(
        self, query_text: str, entity_names: List[str]
    ) -> str:
        """
        Build a knowledge graph context string for a user query.
        Extracts mentioned entities and their relations.
        """
        context_parts = []
        for name in entity_names:
            entity = await self.get_entity_by_name(name)
            if not entity:
                continue

            result = await self.get_related_entities(entity.id, direction="both", min_weight=0.3)
            if result.entities:
                related_names = [e.name for e in result.entities[:5]]
                rel_types = [r.relation_type for r in result.relations[:5]]
                context_parts.append(
                    f"{entity.name} ({entity.type.value}): "
                    f"related to {', '.join(related_names)} "
                    f"via {', '.join(set(rel_types))}"
                )

        return "\n".join(context_parts) if context_parts else ""

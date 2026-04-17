"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Knowledge Graph Query Engine
═══════════════════════════════════════════════════════════

Traverses the Postgres relational graph to provide deep context.
Example: "What technologies did Aman use?" -> Joins kg_entities.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("portfolio.knowledge_graph.query")


class GraphQueryEngine:
    """Executes traversals on the knowledge graph."""

    def __init__(self, db_pool: Any | None = None):
        self._db = db_pool

    def set_db_pool(self, db_pool: Any) -> None:
        """Set the Postgres connection pool."""
        self._db = db_pool

    async def get_project_stack(self, project_name: str) -> list[str]:
        """Get all technologies built_with a specific project."""
        if not self._db:
            return []

        try:
            async with self._db.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT t.name 
                    FROM kg_entities p
                    JOIN kg_relations r ON p.id = r.source_id
                    JOIN kg_entities t ON r.target_id = t.id
                    WHERE p.entity_type = 'project' 
                      AND p.name ILIKE $1
                      AND r.relation_type = 'built_with'
                    """,
                    f"%{project_name}%"
                )
                return [r["name"] for r in rows]
        except Exception as e:
            logger.error(f"Graph query failed (get_project_stack): {e}")
            return []

    async def get_projects_using(self, tech_name: str) -> list[str]:
        """Get all projects that use a specific technology."""
        if not self._db:
            return []

        try:
            async with self._db.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT p.name 
                    FROM kg_entities t
                    JOIN kg_relations r ON t.id = r.target_id
                    JOIN kg_entities p ON r.source_id = p.id
                    WHERE t.entity_type = 'technology' 
                      AND t.name ILIKE $1
                      AND r.relation_type = 'built_with'
                    """,
                    f"%{tech_name}%"
                )
                return [r["name"] for r in rows]
        except Exception as e:
            logger.error(f"Graph query failed (get_projects_using): {e}")
            return []

    async def get_full_context_for_topic(self, topic: str) -> str:
        """
        Pull immediate neighbors for a topic to inject into prompt context.
        """
        if not self._db:
            return ""

        try:
            async with self._db.acquire() as conn:
                # Find the entity
                entity = await conn.fetchrow(
                    "SELECT id, entity_type, name, properties FROM kg_entities WHERE name ILIKE $1 LIMIT 1",
                    f"%{topic}%"
                )
                
                if not entity:
                    return ""
                    
                entity_id = entity["id"]
                
                # Find outbound relations
                outbound = await conn.fetch(
                    """
                    SELECT r.relation_type, t.name, t.entity_type
                    FROM kg_relations r
                    JOIN kg_entities t ON r.target_id = t.id
                    WHERE r.source_id = $1
                    """,
                    entity_id
                )
                
                # Find inbound relations
                inbound = await conn.fetch(
                    """
                    SELECT r.relation_type, s.name, s.entity_type
                    FROM kg_relations r
                    JOIN kg_entities s ON r.source_id = s.id
                    WHERE r.target_id = $1
                    """,
                    entity_id
                )
                
                lines = [f"Entity: {entity['name']} ({entity['entity_type']})"]
                
                if outbound:
                    lines.append("Outbound relationships:")
                    for row in outbound:
                        lines.append(f"  - {row['relation_type']} -> {row['name']} ({row['entity_type']})")
                        
                if inbound:
                    lines.append("Inbound relationships:")
                    for row in inbound:
                        lines.append(f"  - <- {row['relation_type']} from {row['name']} ({row['entity_type']})")
                        
                return "\n".join(lines)
                
        except Exception as e:
            logger.error(f"Graph query failed (get_full_context): {e}")
            return ""


# Shared instance
graph_engine = GraphQueryEngine()

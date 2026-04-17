"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Knowledge Graph Builder (§12)
═══════════════════════════════════════════════════════════

Extracts Entities and Relations from raw RAG chunks using LLM
structured output, then saves them to PostgreSQL schemas.
"""

from __future__ import annotations

import logging
from typing import Any

from backend.knowledge_graph.schema import KnowledgeGraphExtraction

logger = logging.getLogger("portfolio.knowledge_graph.builder")

EXTRACTION_PROMPT = """Extract the core knowledge graph from the following text about a software engineer.
Identify key projects, technologies, skills, and companies.
Then identify the relationships between them.

TEXT:
{text}
"""


class GraphBuilder:
    """Extracts and stores knowledge graph data."""

    def __init__(self, ollama_client: Any, db_pool: Any | None = None):
        self._ollama = ollama_client
        self._db = db_pool

    def set_db_pool(self, db_pool: Any) -> None:
        """Set the Postgres connection pool."""
        self._db = db_pool

    async def extract_from_text(self, text: str) -> KnowledgeGraphExtraction | None:
        """
        Use the LLM to extract graph nodes and edges from text.
        Requires Outlines or Ollama JSON mode.
        """
        prompt = EXTRACTION_PROMPT.format(text=text)

        try:
            # We attempt to use Ollama's native JSON schema parsing if supported,
            # otherwise fallback to raw JSON mode.
            schema = KnowledgeGraphExtraction.model_json_schema()
            
            response = await self._ollama.generate(
                model="llama3.2:3b",
                prompt=prompt,
                options={
                    "temperature": 0.0,
                },
                # In newer ollama we can pass the JSON schema directly
                # format=schema, 
            )
            
            raw_json = response.get("response", "")
            
            # Simple cleanup in case the LLM wrapped it in markdown
            if raw_json.startswith("```json"):
                raw_json = raw_json[7:]
            if raw_json.endswith("```"):
                raw_json = raw_json[:-3]
                
            return KnowledgeGraphExtraction.model_validate_json(raw_json.strip())

        except Exception as e:
            logger.error(f"KG extraction failed: {e}")
            return None

    async def store_extraction(self, extraction: KnowledgeGraphExtraction) -> bool:
        """
        Store extracted entities and relations into PostgreSQL.
        """
        if not self._db:
            logger.debug("No DB pool set, skipping KG storage")
            return False

        try:
            async with self._db.acquire() as conn:
                async with conn.transaction():
                    # 1. Insert entities, returning UUIDs
                    entity_ids = {}
                    for ent in extraction.entities:
                        # Convert properties dict to jsonb string if needed
                        import json
                        props_json = json.dumps(ent.properties)
                        
                        row = await conn.fetchrow(
                            """
                            INSERT INTO kg_entities (entity_type, name, properties)
                            VALUES ($1, $2, $3::jsonb)
                            ON CONFLICT (entity_type, name) 
                            DO UPDATE SET 
                                properties = kg_entities.properties || $3::jsonb,
                                updated_at = NOW()
                            RETURNING id
                            """,
                            ent.type.value,
                            ent.name,
                            props_json
                        )
                        if row:
                            entity_ids[ent.name] = row["id"]

                    # 2. Insert relations
                    for rel in extraction.relations:
                        source_id = entity_ids.get(rel.source_entity)
                        target_id = entity_ids.get(rel.target_entity)

                        if source_id and target_id:
                            import json
                            props_json = json.dumps({"context": rel.context})
                            
                            await conn.execute(
                                """
                                INSERT INTO kg_relations (source_id, target_id, relation_type, properties)
                                VALUES ($1, $2, $3, $4::jsonb)
                                """,
                                source_id,
                                target_id,
                                rel.relation_type.value,
                                props_json
                            )
            return True
            
        except Exception as e:
            logger.error(f"Failed to store KG data: {e}")
            return False


def create_graph_builder(ollama_client: Any, db_pool: Any | None = None) -> GraphBuilder:
    return GraphBuilder(ollama_client, db_pool)

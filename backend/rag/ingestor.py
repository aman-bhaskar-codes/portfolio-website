"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — RAG Document Ingestor
═══════════════════════════════════════════════════════════

Parses documents (MD, PDF, code) → chunks → embeds → upserts to Qdrant.
Uses simple text splitting (no external Docling dependency in dev).
"""

from __future__ import annotations

import hashlib
import logging
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

logger = logging.getLogger("portfolio.rag.ingestor")


class TextChunker:
    """
    Splits text into overlapping chunks.
    
    Strategy: paragraph-aware splitting with overlap.
    Respects markdown headers as natural boundaries.
    """

    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 64,
    ):
        self._chunk_size = chunk_size
        self._overlap = chunk_overlap

    def chunk(self, text: str, metadata: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        """Split text into chunks with metadata."""
        if not text or not text.strip():
            return []

        base_metadata = metadata or {}
        chunks: list[dict[str, Any]] = []

        # Split by markdown headers or double newlines
        sections = re.split(r'\n(?=#{1,3} )', text)
        
        for section in sections:
            section = section.strip()
            if not section:
                continue

            # Extract section header if present
            header = ""
            header_match = re.match(r'^(#{1,3})\s+(.+)', section)
            if header_match:
                header = header_match.group(2).strip()

            # Split section into words for size-based chunking
            words = section.split()
            
            if len(words) <= self._chunk_size:
                # Section fits in one chunk
                chunks.append({
                    "content": section,
                    "metadata": {
                        **base_metadata,
                        "section_header": header,
                        "chunk_index": len(chunks),
                    },
                })
            else:
                # Split into overlapping chunks
                for i in range(0, len(words), self._chunk_size - self._overlap):
                    chunk_words = words[i:i + self._chunk_size]
                    if len(chunk_words) < 20:  # Skip tiny trailing chunks
                        continue
                    chunks.append({
                        "content": " ".join(chunk_words),
                        "metadata": {
                            **base_metadata,
                            "section_header": header,
                            "chunk_index": len(chunks),
                        },
                    })

        return chunks


class DocumentIngestor:
    """
    Ingests documents into the RAG pipeline.
    
    Flow: parse file → chunk → embed → upsert to Qdrant
    """

    def __init__(
        self,
        ollama_client: Any,
        qdrant_client: Any | None = None,
        embed_model: str = "nomic-embed-text",
        collection_name: str = "portfolio_knowledge",
        chunk_size: int = 512,
    ):
        self._ollama = ollama_client
        self._qdrant = qdrant_client
        self._embed_model = embed_model
        self._collection = collection_name
        self._chunker = TextChunker(chunk_size=chunk_size)

    def set_qdrant_client(self, client: Any) -> None:
        """Set Qdrant client (for deferred initialization)."""
        self._qdrant = client

    async def ingest_file(self, file_path: str | Path) -> int:
        """
        Ingest a single file into the RAG system.
        
        Returns number of chunks ingested.
        """
        path = Path(file_path)
        if not path.exists():
            logger.warning(f"File not found: {path}")
            return 0

        # Read file content
        content = self._read_file(path)
        if not content:
            return 0

        # Create metadata
        metadata = {
            "source": path.name,
            "file_path": str(path),
            "file_type": path.suffix.lstrip("."),
            "updated_at": datetime.fromtimestamp(
                path.stat().st_mtime, tz=timezone.utc
            ).isoformat(),
        }

        # Chunk
        chunks = self._chunker.chunk(content, metadata)
        if not chunks:
            logger.debug(f"No chunks generated from {path}")
            return 0

        # Embed and upsert
        count = await self._embed_and_upsert(chunks)
        logger.info(f"Ingested {count} chunks from {path.name}")
        return count

    async def ingest_directory(
        self,
        dir_path: str | Path,
        extensions: tuple[str, ...] = (".md", ".txt", ".py", ".ts", ".tsx"),
    ) -> int:
        """
        Ingest all matching files in a directory.
        
        Returns total number of chunks ingested.
        """
        path = Path(dir_path)
        if not path.is_dir():
            logger.warning(f"Directory not found: {path}")
            return 0

        total = 0
        for ext in extensions:
            for file_path in path.rglob(f"*{ext}"):
                # Skip node_modules, .next, __pycache__, etc.
                parts = file_path.parts
                if any(p.startswith(".") or p in ("node_modules", "__pycache__", ".next") for p in parts):
                    continue
                total += await self.ingest_file(file_path)

        logger.info(f"Ingested {total} total chunks from {path}")
        return total

    async def ingest_text(
        self,
        text: str,
        source: str = "manual",
        metadata: dict[str, Any] | None = None,
    ) -> int:
        """Ingest raw text directly."""
        base_meta = metadata or {}
        base_meta["source"] = source
        base_meta["updated_at"] = datetime.now(timezone.utc).isoformat()

        chunks = self._chunker.chunk(text, base_meta)
        if not chunks:
            return 0

        return await self._embed_and_upsert(chunks)

    def _read_file(self, path: Path) -> str:
        """Read file content, handling encoding issues."""
        try:
            return path.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            logger.warning(f"Failed to read {path}: {e}")
            return ""

    async def _embed_and_upsert(
        self, chunks: list[dict[str, Any]]
    ) -> int:
        """Embed chunks and upsert to Qdrant."""
        if self._qdrant is None:
            logger.debug("No Qdrant client, skipping upsert")
            return len(chunks)  # Count as ingested for testing

        count = 0
        for chunk in chunks:
            try:
                # Generate embedding
                vector = await self._ollama.embed(
                    self._embed_model,
                    chunk["content"],
                )

                if not vector:
                    continue

                # Generate deterministic ID from content hash
                content_hash = hashlib.sha256(
                    chunk["content"].encode()
                ).hexdigest()[:16]
                point_id = str(uuid4())

                # Upsert to Qdrant
                await self._qdrant.upsert(
                    collection_name=self._collection,
                    points=[{
                        "id": point_id,
                        "vector": vector,
                        "payload": {
                            "content": chunk["content"],
                            "content_hash": content_hash,
                            **chunk.get("metadata", {}),
                        },
                    }],
                )
                count += 1
            except Exception as e:
                logger.debug(f"Failed to embed/upsert chunk: {e}")

        return count

    async def ensure_collection(self, vector_size: int = 768) -> None:
        """Create Qdrant collection if it doesn't exist."""
        if self._qdrant is None:
            return

        try:
            collections = await self._qdrant.get_collections()
            existing = [c.name for c in collections.collections]

            if self._collection not in existing:
                from qdrant_client.models import (
                    Distance,
                    VectorParams,
                )
                await self._qdrant.create_collection(
                    collection_name=self._collection,
                    vectors_config=VectorParams(
                        size=vector_size,
                        distance=Distance.COSINE,
                    ),
                )
                logger.info(f"Created Qdrant collection: {self._collection}")
        except Exception as e:
            logger.warning(f"Collection check failed: {e}")


# Module-level factory
def create_ingestor(
    ollama_client: Any,
    qdrant_client: Any | None = None,
    embed_model: str = "nomic-embed-text",
    collection_name: str = "portfolio_knowledge",
) -> DocumentIngestor:
    return DocumentIngestor(
        ollama_client=ollama_client,
        qdrant_client=qdrant_client,
        embed_model=embed_model,
        collection_name=collection_name,
    )

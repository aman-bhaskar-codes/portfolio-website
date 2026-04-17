# backend/rag/ingestor.py
"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Document Ingestor
═══════════════════════════════════════════════════════════

Ingests documents into Qdrant vector store.
"""
import logging
import hashlib
from pathlib import Path
from typing import List, Optional
from dataclasses import dataclass, field

from qdrant_client.models import PointStruct
from backend.db.connections import get_qdrant
from backend.llm.ollama_client import get_ollama
from backend.config.settings import settings

logger = logging.getLogger(__name__)


@dataclass
class Document:
    content: str
    source: str
    metadata: dict = field(default_factory=dict)


@dataclass
class Chunk:
    content: str
    source: str
    chunk_id: str
    metadata: dict = field(default_factory=dict)


class Ingestor:
    """Ingests documents into Qdrant vector store."""

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str, source: str) -> List[Chunk]:
        """Split text into overlapping chunks."""
        words = text.split()
        chunks = []
        i = 0
        while i < len(words):
            chunk_words = words[i:i + self.chunk_size]
            content = " ".join(chunk_words)
            if len(content.strip()) < 20:
                i += self.chunk_size - self.chunk_overlap
                continue
            chunk_id = hashlib.md5(f"{source}:{i}:{content[:50]}".encode()).hexdigest()
            chunks.append(Chunk(
                content=content,
                source=source,
                chunk_id=chunk_id,
                metadata={"char_offset": i, "word_count": len(chunk_words)},
            ))
            i += self.chunk_size - self.chunk_overlap
        return chunks

    async def ingest_document(self, doc: Document) -> int:
        """Ingest one document. Returns number of chunks ingested."""
        chunks = self.chunk_text(doc.content, doc.source)
        if not chunks:
            return 0

        qdrant = get_qdrant()
        ollama = get_ollama()
        points = []

        # Batch embed in groups of 10
        batch_size = 10
        for batch_start in range(0, len(chunks), batch_size):
            batch = chunks[batch_start:batch_start + batch_size]
            for chunk in batch:
                try:
                    embedding = await ollama.embed(chunk.content)
                    points.append(PointStruct(
                        id=abs(hash(chunk.chunk_id)) % (2**31),
                        vector=embedding,
                        payload={
                            "content": chunk.content,
                            "source": chunk.source,
                            "chunk_id": chunk.chunk_id,
                            "metadata": {**doc.metadata, **chunk.metadata},
                            "freshness": 1.0,
                        }
                    ))
                except Exception as e:
                    logger.error(f"Failed to embed chunk from {doc.source}: {e}")
                    continue

        if points:
            await qdrant.upsert(
                collection_name=settings.QDRANT_COLLECTION_KNOWLEDGE,
                points=points,
            )

        logger.info(f"Ingested {len(points)} chunks from {doc.source}")
        return len(points)

    async def ingest_file(self, file_path: str) -> int:
        """Ingest a file (txt, md, pdf)."""
        path = Path(file_path)
        if not path.exists():
            logger.error(f"File not found: {file_path}")
            return 0

        if path.suffix == ".pdf":
            content = self._read_pdf(path)
        else:
            content = path.read_text(encoding="utf-8", errors="ignore")

        doc = Document(
            content=content,
            source=path.name,
            metadata={"file_path": str(path), "file_type": path.suffix},
        )
        return await self.ingest_document(doc)

    def _read_pdf(self, path: Path) -> str:
        """Read PDF using docling."""
        try:
            from docling.document_converter import DocumentConverter
            converter = DocumentConverter()
            result = converter.convert(str(path))
            return result.document.export_to_text()
        except ImportError:
            logger.warning("docling not installed, skipping PDF")
            return ""
        except Exception as e:
            logger.error(f"PDF parsing failed for {path}: {e}")
            return ""

"""
RAG Ingestion Pipeline — Parse, chunk, and prepare documents for embedding.
Supports: PDF, Markdown, Code files, Plain text.
Uses semantic chunking with metadata preservation.
"""

import os
import re
import hashlib
import logging
from pathlib import Path
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Optional

from backend.config.constants import RAG_CONFIG

logger = logging.getLogger("portfolio.rag.ingestion")


@dataclass
class Chunk:
    """A single chunk ready for embedding and storage."""
    chunk_id: str
    content: str
    source: str
    source_type: str          # 'document', 'github', 'linkedin', 'instagram'
    entity_type: Optional[str] = None  # 'project', 'skill', 'experience', 'bio'
    tags: list[str] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def _generate_chunk_id(source: str, content: str, index: int) -> str:
    """Generate deterministic chunk ID from source + content hash."""
    raw = f"{source}:{index}:{content[:100]}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _detect_entity_type(content: str, source: str) -> str:
    """Heuristic entity type detection from content and source path."""
    content_lower = content.lower()
    source_lower = source.lower()
    
    if any(kw in source_lower for kw in ["resume", "cv", "bio", "about"]):
        return "bio"
    if any(kw in source_lower for kw in ["project", "readme", "virtual_work"]):
        return "project"
    if any(kw in content_lower for kw in ["experience", "worked at", "position", "role"]):
        return "experience"
    if any(kw in content_lower for kw in ["skill", "technology", "framework", "language"]):
        return "skill"
    return "general"


def _extract_tags(content: str) -> list[str]:
    """Extract meaningful tags from content."""
    # Look for common tech terms
    tech_patterns = [
        r'\b(Python|JavaScript|TypeScript|React|Next\.js|FastAPI|Docker|PostgreSQL)\b',
        r'\b(LangChain|LangGraph|Ollama|Qdrant|Redis|Three\.js|TailwindCSS)\b',
        r'\b(machine learning|deep learning|NLP|RAG|LLM|AI|ML)\b',
    ]
    tags = set()
    for pattern in tech_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        tags.update(m.lower() for m in matches)
    return list(tags)[:10]  # Cap at 10 tags


# ═══════════════════════════════════════════════════════════
# CHUNKING STRATEGIES
# ═══════════════════════════════════════════════════════════

def _semantic_chunk_markdown(text: str, max_tokens: int = RAG_CONFIG["chunk_size"], overlap: int = RAG_CONFIG["chunk_overlap"]) -> list[str]:
    """
    Semantic chunking for Markdown — splits on heading boundaries.
    Falls back to paragraph-based splitting.
    """
    # Split on H2/H3 headings
    sections = re.split(r'(?=^#{2,3}\s)', text, flags=re.MULTILINE)
    
    chunks = []
    for section in sections:
        section = section.strip()
        if not section:
            continue
        
        # If section is small enough, keep as one chunk
        word_count = len(section.split())
        if word_count <= max_tokens:
            chunks.append(section)
        else:
            # Split large sections into paragraph-level chunks
            paragraphs = section.split('\n\n')
            current_chunk = []
            current_words = 0
            
            for para in paragraphs:
                para = para.strip()
                if not para:
                    continue
                para_words = len(para.split())
                
                if current_words + para_words > max_tokens and current_chunk:
                    chunks.append('\n\n'.join(current_chunk))
                    # Keep overlap
                    overlap_text = current_chunk[-1] if current_chunk else ""
                    current_chunk = [overlap_text] if overlap > 0 and overlap_text else []
                    current_words = len(overlap_text.split()) if overlap_text and overlap > 0 else 0
                
                current_chunk.append(para)
                current_words += para_words
            
            if current_chunk:
                chunks.append('\n\n'.join(current_chunk))
    
    return chunks if chunks else [text]


def _chunk_code(text: str, language: str = "python") -> list[str]:
    """
    Chunk code files by function/class boundaries.
    Tags each chunk with language marker.
    """
    chunks = []
    
    if language == "python":
        # Split on class and function definitions
        pattern = r'(?=^(?:class |def |async def ))'
        parts = re.split(pattern, text, flags=re.MULTILINE)
    else:
        # Generic: split on function-like patterns
        pattern = r'(?=^(?:function |export |const |class ))'
        parts = re.split(pattern, text, flags=re.MULTILINE)
    
    for part in parts:
        part = part.strip()
        if not part or len(part.split()) < 5:
            continue
        tagged = f"```{language}\n{part}\n```"
        chunks.append(tagged)
    
    return chunks if chunks else [f"```{language}\n{text}\n```"]


def _chunk_plain_text(text: str, max_tokens: int = RAG_CONFIG["chunk_size"]) -> list[str]:
    """Simple paragraph-based chunking for plain text."""
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = []
    current_words = 0
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        para_words = len(para.split())
        
        if current_words + para_words > max_tokens and current_chunk:
            chunks.append('\n\n'.join(current_chunk))
            current_chunk = []
            current_words = 0
        
        current_chunk.append(para)
        current_words += para_words
    
    if current_chunk:
        chunks.append('\n\n'.join(current_chunk))
    
    return chunks if chunks else [text]


# ═══════════════════════════════════════════════════════════
# FILE PARSING
# ═══════════════════════════════════════════════════════════

LANGUAGE_MAP = {
    ".py": "python",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".rs": "rust",
    ".go": "go",
    ".java": "java",
    ".cpp": "cpp",
    ".c": "c",
}


def parse_file(file_path: str) -> list[Chunk]:
    """
    Parse a single file into chunks.
    
    Args:
        file_path: Absolute or relative path to the file
    
    Returns:
        List of Chunk objects ready for embedding
    """
    path = Path(file_path)
    if not path.exists():
        logger.warning(f"File not found: {file_path}")
        return []
    
    try:
        content = path.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        logger.error(f"Error reading {file_path}: {e}")
        return []
    
    if not content.strip():
        return []
    
    suffix = path.suffix.lower()
    source = str(path.name)
    
    # Route to appropriate chunker
    if suffix in (".md", ".markdown"):
        raw_chunks = _semantic_chunk_markdown(content)
        source_type = "document"
    elif suffix in LANGUAGE_MAP:
        raw_chunks = _chunk_code(content, LANGUAGE_MAP[suffix])
        source_type = "document"
    elif suffix == ".pdf":
        # Docling integration — for now, treat as text
        # TODO: Phase 2 full Docling integration
        raw_chunks = _chunk_plain_text(content)
        source_type = "document"
    elif suffix in (".txt", ".rst", ".csv"):
        raw_chunks = _chunk_plain_text(content)
        source_type = "document"
    else:
        raw_chunks = _chunk_plain_text(content)
        source_type = "document"
    
    # Convert to Chunk objects with metadata
    chunks = []
    for i, raw in enumerate(raw_chunks):
        if not raw.strip():
            continue
        
        chunk = Chunk(
            chunk_id=_generate_chunk_id(source, raw, i),
            content=raw,
            source=source,
            source_type=source_type,
            entity_type=_detect_entity_type(raw, source),
            tags=_extract_tags(raw),
            metadata={
                "file_path": str(path),
                "chunk_index": i,
                "total_chunks": len(raw_chunks),
                "file_extension": suffix,
                "word_count": len(raw.split()),
            },
        )
        chunks.append(chunk)
    
    logger.info(f"Parsed {file_path}: {len(chunks)} chunks")
    return chunks


def parse_directory(dir_path: str, recursive: bool = True) -> list[Chunk]:
    """
    Parse all supported files in a directory.
    
    Args:
        dir_path: Path to directory
        recursive: Whether to recurse into subdirectories
    
    Returns:
        List of all Chunk objects
    """
    path = Path(dir_path)
    if not path.exists() or not path.is_dir():
        logger.warning(f"Directory not found: {dir_path}")
        return []
    
    # Supported extensions
    supported = {".md", ".txt", ".py", ".ts", ".tsx", ".js", ".jsx", ".rst", ".pdf"}
    
    all_chunks = []
    pattern = "**/*" if recursive else "*"
    
    for file_path in path.glob(pattern):
        if file_path.is_file() and file_path.suffix.lower() in supported:
            # Skip hidden files and node_modules
            if any(part.startswith('.') or part == 'node_modules' for part in file_path.parts):
                continue
            chunks = parse_file(str(file_path))
            all_chunks.extend(chunks)
    
    logger.info(f"Parsed directory {dir_path}: {len(all_chunks)} total chunks from {path}")
    return all_chunks


def parse_github_readme(repo_name: str, content: str) -> list[Chunk]:
    """Parse a GitHub README into chunks tagged as github source."""
    raw_chunks = _semantic_chunk_markdown(content)
    
    chunks = []
    for i, raw in enumerate(raw_chunks):
        if not raw.strip():
            continue
        chunk = Chunk(
            chunk_id=_generate_chunk_id(f"github:{repo_name}", raw, i),
            content=raw,
            source=f"github/{repo_name}",
            source_type="github",
            entity_type="project",
            tags=_extract_tags(raw) + [repo_name.lower()],
            metadata={
                "repo_name": repo_name,
                "chunk_index": i,
            },
        )
        chunks.append(chunk)
    
    return chunks


def parse_social_content(platform: str, content: str, metadata: dict = None) -> list[Chunk]:
    """Parse social media content (LinkedIn / Instagram) into chunks."""
    raw_chunks = _chunk_plain_text(content, max_tokens=256)  # Smaller chunks for social
    
    chunks = []
    for i, raw in enumerate(raw_chunks):
        if not raw.strip():
            continue
        chunk = Chunk(
            chunk_id=_generate_chunk_id(f"{platform}:post", raw, i),
            content=raw,
            source=platform,
            source_type=platform,
            entity_type="social_proof",
            tags=_extract_tags(raw),
            metadata=metadata or {},
        )
        chunks.append(chunk)
    
    return chunks

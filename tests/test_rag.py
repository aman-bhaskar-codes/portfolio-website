# tests/test_rag.py
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))


def test_ingestor_chunking():
    """Ingestor must chunk text without errors."""
    from backend.rag.ingestor import Ingestor

    ingestor = Ingestor(chunk_size=10, chunk_overlap=2)
    chunks = ingestor.chunk_text(
        "This is a test document with enough words to create multiple chunks for testing purposes",
        source="test.md",
    )
    assert len(chunks) > 0
    assert all(c.source == "test.md" for c in chunks)
    assert all(len(c.chunk_id) > 0 for c in chunks)

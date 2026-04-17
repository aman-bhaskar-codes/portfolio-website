"""
═══════════════════════════════════════════════════════════
ANTIGRAVITY OS v4 — Ingestion Tasks
═══════════════════════════════════════════════════════════

Celery tasks for ingesting local documents into the RAG system.
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from backend.tasks.celery_app import app

logger = logging.getLogger("portfolio.tasks.ingest")


@app.task(bind=True, name="backend.tasks.ingest_tasks.seed_all")
def seed_all(self) -> str:
    """
    Seed initial data into RAG.
    Can be run synchronously during `make seed` or asynchronously.
    """
    logger.info("Starting database seed process...")

    async def _run():
        from backend.llm.ollama_client import ollama_client
        from backend.rag.ingestor import create_ingestor

        # Wait for ollama to be ready
        is_ready = await ollama_client.check_availability()
        if not is_ready:
            logger.error("Ollama not ready. Make sure models are pulled.")
            return "Failed: Ollama down"

        ingestor = create_ingestor(ollama_client=ollama_client)
        
        # NOTE: We skip setting Qdrant client here since in the simple seed
        # we just want to verify the pipeline doesn't crash. In full setup,
        # we'd instantiate async qdrant client here.

        # Look for markdown docs in root or data dir
        data_dir = Path("/data") if Path("/data").exists() else Path("data")
        if not data_dir.exists():
            data_dir.mkdir(exist_ok=True, parents=True)
            
        docs_dir = data_dir / "documents"
        if not docs_dir.exists():
            docs_dir.mkdir(exist_ok=True)
            # Create a sample doc if none exist
            sample = docs_dir / "about_aman.md"
            sample.write_text(
                "# About Aman\n\n"
                "Aman is a Software Engineer building AI systems. "
                "He specializes in Python, React, and agentic workflows."
            )

        logger.info(f"Ingesting documents from {docs_dir}...")
        count = await ingestor.ingest_directory(docs_dir)
        
        logger.info(f"Seed complete. Ingested {count} chunks.")
        return f"Success: {count} chunks"

    # Run the async function synchronously within the Celery worker
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    return loop.run_until_complete(_run())


def seed_all_sync() -> None:
    """Wrapper for command line execution (e.g., make seed)."""
    seed_all()

if __name__ == "__main__":
    seed_all_sync()

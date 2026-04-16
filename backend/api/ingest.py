"""
Ingestion API — trigger knowledge ingestion pipeline.
Phase 2 will implement the full Docling pipeline.
"""

import logging
from fastapi import APIRouter

from backend.models.schemas import IngestRequest, IngestResponse

router = APIRouter()
logger = logging.getLogger("portfolio.ingest")


@router.post("/", response_model=IngestResponse)
async def trigger_ingestion(request: IngestRequest):
    """
    Trigger knowledge ingestion. Currently a stub.
    Phase 2 will wire this to the Docling + embedding pipeline.
    """
    logger.info(f"Ingestion requested: source_type={request.source_type}, path={request.source_path}")
    
    # TODO: Phase 2 — dispatch to Celery task
    return IngestResponse(
        status="accepted",
        task_id=None,
        chunks_processed=0,
    )

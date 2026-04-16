from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class TwinConfig(BaseModel):
    tone: str
    verbosity: str

@router.post("/persona")
async def apply_twin_persona(config: TwinConfig):
    """Dynamically switch the Twin LLM personality configuration."""
    return {"status": "Persona rules appended", "state": config.model_dump()}

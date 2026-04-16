from fastapi import APIRouter
from fastapi.responses import FileResponse
import os

router = APIRouter()

@router.get("/{filename}")
async def get_voice(filename: str):
    # Retrieve the synthesized audio file from the project root
    file_path = os.path.join(os.getcwd(), filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="audio/mpeg")
    return {"error": "Voice file not found"}

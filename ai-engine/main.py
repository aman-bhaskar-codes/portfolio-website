
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from router import process_query
import asyncio
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-engine")

app = FastAPI(title="Portfolio AI Engine", version="1.0.0")

class ChatRequest(BaseModel):
    query: str
    session_id: str = "default"
    user_id: str = "anonymous"

@app.get("/")
def health_check():
    return {"status": "online", "system": "Elite AI Engine"}

@app.post("/chat")
async def chat_endpoint(payload: ChatRequest):
    """
    Main Entry Point for AI Interaction.
    Routes query through Intent Classifer -> Semantic Router -> Generator.
    """
    try:
        logger.info(f"Received Query: {payload.query}")
        
        # Session context would be retrieved from Redis here
        session_context = {"id": payload.session_id, "user": payload.user_id}
        
        response = await process_query(payload.query, session_context)
        
        return {
            "response": response["content"], 
            "metadata": {
                "source": response["source"],
                "latency_ms": response["latency"],
                "intent": response["intent"]
            }
        }
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail="Internal AI Error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

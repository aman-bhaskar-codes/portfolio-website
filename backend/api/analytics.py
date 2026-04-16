# backend/api/analytics.py
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
import jwt
from typing import Optional
from datetime import datetime

router = APIRouter()
import os
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-for-dev")

class LogActionRequest(BaseModel):
    action: str
    metadata: Optional[dict] = {}

class FeedbackRequest(BaseModel):
    conversationId: str
    query: str
    response: str
    rating: int
    comment: Optional[str] = None
    confidence: Optional[float] = None
    intent: Optional[str] = None

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token")
        
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/log")
async def log_action(req: LogActionRequest, user_id: str = Depends(get_current_user)):
    from prisma import Prisma
    db = Prisma()
    await db.connect()
    try:
        await db.userlog.create(data={
            "userId": user_id,
            "action": req.action,
            "metadata": req.metadata
        })
        return {"status": "success"}
    finally:
        await db.disconnect()

@router.post("/feedback")
async def submit_feedback(req: FeedbackRequest, user_id: str = Depends(get_current_user)):
    from prisma import Prisma
    db = Prisma()
    await db.connect()
    try:
        await db.feedback.create(data={
            "userId": user_id,
            "conversationId": req.conversationId,
            "query": req.query,
            "response": req.response,
            "rating": req.rating,
            "comment": req.comment,
            "confidence": req.confidence,
            "intent": req.intent
        })
        return {"status": "success"}
    finally:
        await db.disconnect()

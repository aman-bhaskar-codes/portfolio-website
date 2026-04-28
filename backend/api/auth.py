from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field, EmailStr
from passlib.hash import bcrypt
import jwt
import os
import time
from datetime import datetime, timedelta, timezone
from backend.db.connections import get_redis

router = APIRouter()
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-for-dev")

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

async def check_rate_limit(request: Request):
    try:
        client_ip = request.client.host if request.client else "127.0.0.1"
        redis = get_redis()
        key = f"rl:auth:{client_ip}"
        
        # 5 requests per minute
        current = int(time.time())
        window = current - 60
        async with redis.pipeline(transaction=True) as pipe:
            pipe.zremrangebyscore(key, 0, window)
            pipe.zadd(key, {str(current): current})
            pipe.zcard(key)
            pipe.expire(key, 60)
            results = await pipe.execute()
            count = results[2]
            
        if count > 5:
            raise HTTPException(status_code=429, detail="Too many attempts")
    except RuntimeError:
        pass # Redis not initialized, fail open or use fallback

async def get_db():
    from prisma import Prisma
    db = Prisma()
    await db.connect()
    try:
        yield db
    finally:
        await db.disconnect()

@router.post("/register", dependencies=[Depends(check_rate_limit)])
async def register(data: RegisterRequest):
    from prisma import Prisma
    db = Prisma()
    await db.connect()
    
    try:
        existing = await db.user.find_unique(where={"email": data.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
            
        hashed_pw = bcrypt.hash(data.password)
        
        user = await db.user.create(data={
            "email": data.email,
            "passwordHash": hashed_pw,
            "name": data.name,
            "profile": {
                "create": {}  # Initialize empty profile for adaptive behavior
            }
        })
        
        token = jwt.encode({
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=60)
        }, JWT_SECRET, algorithm="HS256")
        
        return {"token": token, "user": {"id": user.id, "email": user.email, "name": user.name}}
    finally:
        await db.disconnect()


@router.post("/login", dependencies=[Depends(check_rate_limit)])
async def login(data: LoginRequest):
    from prisma import Prisma
    db = Prisma()
    await db.connect()
    
    try:
        user = await db.user.find_unique(where={"email": data.email})
        if not user or not bcrypt.verify(data.password, user.passwordHash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        await db.user.update(
            where={"id": user.id},
            data={"lastActive": datetime.now(timezone.utc)}
        )
            
        token = jwt.encode({
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=60)
        }, JWT_SECRET, algorithm="HS256")
        
        return {"token": token, "user": {"id": user.id, "email": user.email, "role": user.role}}
    finally:
        await db.disconnect()

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from passlib.hash import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from backend.db.session import engine

router = APIRouter()
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-for-dev")

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = None

class LoginRequest(BaseModel):
    email: str
    password: str

async def get_db():
    from prisma import Prisma
    db = Prisma()
    await db.connect()
    try:
        yield db
    finally:
        await db.disconnect()

@router.post("/register")
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
            "exp": datetime.utcnow() + timedelta(days=7)
        }, JWT_SECRET, algorithm="HS256")
        
        return {"token": token, "user": {"id": user.id, "email": user.email, "name": user.name}}
    finally:
        await db.disconnect()


@router.post("/login")
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
            data={"lastActive": datetime.utcnow()}
        )
            
        token = jwt.encode({
            "sub": user.id,
            "email": user.email,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(days=7)
        }, JWT_SECRET, algorithm="HS256")
        
        return {"token": token, "user": {"id": user.id, "email": user.email, "role": user.role}}
    finally:
        await db.disconnect()

"""
SQLAlchemy ORM models for the portfolio database.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from backend.db.session import Base


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(Integer, primary_key=True)
    chunk_id = Column(String(64), unique=True, nullable=False)
    content = Column(Text, nullable=False)
    source = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)
    entity_type = Column(String(50))
    tags = Column(JSON, default=list)
    metadata_ = Column("metadata", JSON, default=dict)
    embedding = Column(Vector(768))
    chunk_version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    last_ingested_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class UserEpisode(Base):
    __tablename__ = "user_episodes"

    id = Column(Integer, primary_key=True)
    user_id = Column(String(64), nullable=False, index=True)
    session_id = Column(String(64), nullable=False)
    summary = Column(Text, nullable=False)
    key_facts = Column(JSON, default=list)
    topics_discussed = Column(JSON, default=list)
    embedding = Column(Vector(768))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True)
    conversation_id = Column(String(64), unique=True, nullable=False)
    user_id = Column(String(64), nullable=False, index=True)
    session_id = Column(String(64), nullable=False)
    title = Column(String(255))
    message_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    conversation_id = Column(String(64), ForeignKey("conversations.conversation_id"), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    model_used = Column(String(50))
    intent = Column(String(50))
    citations = Column(JSON, default=list)
    latency_ms = Column(Integer)
    token_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


class IngestionLog(Base):
    __tablename__ = "ingestion_log"

    id = Column(Integer, primary_key=True)
    source = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)
    chunks_created = Column(Integer, default=0)
    chunks_updated = Column(Integer, default=0)
    status = Column(String(20), default="pending")
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=True))


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True)
    user_id = Column(String(64), nullable=False, index=True)
    session_id = Column(String(64), unique=True, nullable=False)
    anonymous_id = Column(String(64), index=True)
    is_authenticated = Column(Boolean, default=False)
    device_info = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    last_active_at = Column(DateTime(timezone=True), default=datetime.utcnow)

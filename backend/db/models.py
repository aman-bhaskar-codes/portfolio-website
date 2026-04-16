import uuid
from sqlalchemy import Column, String, Text, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from .base import Base


class Knowledge(Base):
    __tablename__ = "knowledge_base"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    category = Column(String)
    subcategory = Column(String)

    title = Column(String)
    content = Column(Text)

    embedding = Column(Vector(768))

    importance = Column(Float, default=0.5)
    recency = Column(Float, default=0.5)

    source = Column(String)
    source_id = Column(String)

    tokens = Column(Float)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now())


class AssistantMemory(Base):
    __tablename__ = "assistant_memory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    content = Column(Text)

    embedding = Column(Vector(768))

    importance = Column(Float, default=0.5)

    created_at = Column(DateTime, server_default=func.now())


class TwinMemory(Base):
    __tablename__ = "twin_memory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    content = Column(Text)

    embedding = Column(Vector(768))

    importance = Column(Float, default=0.5)

    created_at = Column(DateTime, server_default=func.now())


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String)

    description = Column(Text)

    tech = Column(Text)

    repo_url = Column(String)

    embedding = Column(Vector(768))


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    role = Column(String)

    content = Column(Text)

    created_at = Column(DateTime, server_default=func.now())

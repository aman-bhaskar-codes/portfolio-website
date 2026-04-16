"""Initial migration with pgvector

Revision ID: a6f2d7f82dd7
Revises: 
Create Date: 2026-03-02 16:43:40.207001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import pgvector


# revision identifiers, used by Alembic.
revision: str = 'a6f2d7f82dd7'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create pgvector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector;')

    # 2. Create knowledge_base table
    op.create_table('knowledge_base',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('subcategory', sa.String(), nullable=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('embedding', pgvector.sqlalchemy.Vector(768)),
        sa.Column('importance', sa.Float(), default=0.5),
        sa.Column('recency', sa.Float(), default=0.5),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('source_id', sa.String(), nullable=True),
        sa.Column('tokens', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
    )

    # 3. Create conversation_memory table
    op.create_table('conversation_memory',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('embedding', pgvector.sqlalchemy.Vector(768)),
        sa.Column('importance', sa.Float(), default=0.5),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
    )

    # 4. Create projects table
    op.create_table('projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tech', sa.Text(), nullable=True),
        sa.Column('repo_url', sa.String(), nullable=True),
        sa.Column('embedding', pgvector.sqlalchemy.Vector(768)),
    )

    # 5. Create conversations table
    op.create_table('conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
    )

    # 6. Add IVFFlat indexes for vectors
    op.execute('CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);')
    op.execute('CREATE INDEX ON conversation_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);')


def downgrade() -> None:
    op.drop_table('conversations')
    op.drop_table('projects')
    op.drop_table('conversation_memory')
    op.drop_table('knowledge_base')

"""split_memory_tables

Revision ID: 6cce2b8a3abc
Revises: a6f2d7f82dd7
Create Date: 2026-03-02 18:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = '6cce2b8a3abc'
down_revision: Union[str, None] = 'a6f2d7f82dd7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create assistant_memory table
    op.create_table(
        'assistant_memory',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('embedding', Vector(768)),
        sa.Column('importance', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Create twin_memory table
    op.create_table(
        'twin_memory',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('embedding', Vector(768)),
        sa.Column('importance', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. Create indices for faster RAG
    op.execute(
        "CREATE INDEX ON assistant_memory USING hnsw (embedding vector_cosine_ops);"
    )
    op.execute(
        "CREATE INDEX ON twin_memory USING hnsw (embedding vector_cosine_ops);"
    )


def downgrade() -> None:
    op.drop_table('twin_memory')
    op.drop_table('assistant_memory')

"""
Database session management — async SQLAlchemy engine + session factory.
"""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from backend.config.settings import settings


# ── Async Engine ──
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_recycle=settings.DB_POOL_RECYCLE,
    echo=settings.DEBUG,
)

# ── Session Factory ──
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Base Model ──
class Base(DeclarativeBase):
    pass


async def init_db():
    """Create tables if they don't exist (dev convenience)."""
    from backend.models.db_models import Base as ModelsBase  # noqa: F811
    async with engine.begin() as conn:
        await conn.run_sync(ModelsBase.metadata.create_all)


async def shutdown_db():
    """Dispose engine connections."""
    await engine.dispose()


async def get_db() -> AsyncSession:
    """FastAPI dependency for database sessions."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

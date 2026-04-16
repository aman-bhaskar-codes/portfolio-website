import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    Central configuration for the entire backend.
    All values can be overridden via environment variables.
    """

    # ─── Environment ───
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = True

    # ─── Database (PostgreSQL + pgvector) ───
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/portfolio_db"
    SYNC_DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/portfolio_db"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_RECYCLE: int = 3600

    # ─── Redis ───
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_SESSION_TTL: int = 7200          # 2 hours for working memory
    REDIS_CACHE_TTL_GITHUB: int = 3600     # 1 hour
    REDIS_CACHE_TTL_LINKEDIN: int = 21600  # 6 hours
    REDIS_CACHE_TTL_INSTAGRAM: int = 10800 # 3 hours

    # ─── Ollama (Local LLM) ───
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_TIMEOUT: int = 120

    # ─── Qdrant (Vector Store) ───
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION_KNOWLEDGE: str = "portfolio_knowledge"
    QDRANT_COLLECTION_MEMORIES: str = "user_memories"
    QDRANT_VECTOR_SIZE: int = 768  # nomic-embed-text dimensions

    # ─── Embedding Model ───
    EMBED_MODEL: str = "nomic-embed-text"
    EMBED_BATCH_SIZE: int = 32

    # ─── Celery ───
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # ─── Langfuse (LLM Observability) ───
    LANGFUSE_HOST: str = "http://localhost:3001"
    LANGFUSE_PUBLIC_KEY: str = ""
    LANGFUSE_SECRET_KEY: str = ""

    # ─── Auth ───
    JWT_SECRET: str = "portfolio-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CLERK_SECRET_KEY: str = ""
    CLERK_WEBHOOK_SECRET: str = ""

    # ─── Rate Limiting ───
    RATE_LIMIT_ANON_PER_MIN: int = 20
    RATE_LIMIT_ANON_PER_DAY: int = 200
    RATE_LIMIT_AUTH_PER_MIN: int = 60
    RATE_LIMIT_AUTH_PER_DAY: int = 2000
    RATE_LIMIT_VOICE_CONCURRENT: int = 5

    # ─── Social APIs ───
    GITHUB_TOKEN: str = ""
    GITHUB_USERNAME: str = "aman-bhaskar-codes"
    LINKEDIN_API_KEY: str = ""
    INSTAGRAM_ACCESS_TOKEN: str = ""

    # ─── Owner Identity ───
    OWNER_NAME: str = "Aman Bhaskar"
    OWNER_TITLE: str = "AI Systems Engineer"
    OWNER_BIO: str = "Architecting cognitive platforms that bridge the gap between human intent and autonomous execution."

    # ─── CORS ───
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3334",
        "http://localhost:80",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()


settings = get_settings()

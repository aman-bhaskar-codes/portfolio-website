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
    GITHUB_WEBHOOK_SECRET: str = ""
    LINKEDIN_API_KEY: str = ""
    INSTAGRAM_ACCESS_TOKEN: str = ""

    # ─── Owner Identity ───
    OWNER_NAME: str = "Aman Bhaskar"
    OWNER_TITLE: str = "Senior AI Architect"
    OWNER_BIO: str = "Architecting cognitive platforms that bridge the gap between human intent and autonomous execution."

    # ─── ANTIGRAVITY OS v1 ───
    SEMANTIC_CACHE_TTL: int = 14400         # 4 hours
    SEMANTIC_CACHE_THRESHOLD: float = 0.93  # cosine similarity for cache hit
    AMBIENT_COOLDOWN_SECONDS: int = 300     # min 5 min between ambient triggers
    FRESHNESS_CHECK_INTERVAL: int = 3600    # check stale chunks every hour
    KNOWLEDGE_GRAPH_ENABLED: bool = True
    VISITOR_PROFILING_ENABLED: bool = True

    # ─── ANTIGRAVITY OS v2: Security Vault ───
    VAULT_ENCRYPTION_KEY: str = ""          # AES-256-GCM key (set in .env)

    # ─── ANTIGRAVITY OS v2: Circuit Breaker ───
    CB_FAILURE_THRESHOLD: int = 5
    CB_TIMEOUT_SECONDS: int = 60
    CB_SUCCESS_THRESHOLD: int = 2

    # ─── ANTIGRAVITY OS v2: LLM Model Routing ───
    LLM_MODEL_HEAVY: str = "phi4-mini"       # Complex: design, interview, debate
    LLM_MODEL_MEDIUM: str = "llama3.2:3b"    # Standard Q&A, persona responses
    LLM_MODEL_LIGHT: str = "qwen2.5:3b"      # Greetings, FAQ, classification
    LLM_DAILY_TOKEN_LIMIT_HEAVY: int = 500000
    LLM_DAILY_TOKEN_LIMIT_MEDIUM: int = 1000000
    LLM_DAILY_TOKEN_LIMIT_LIGHT: int = 2000000

    # ─── ANTIGRAVITY OS v2: SSE / Streaming ───
    MAX_SSE_CONNECTIONS: int = 500
    SSE_MAX_LIFETIME_SECONDS: int = 300     # 5 minutes
    SSE_IDLE_TIMEOUT_SECONDS: int = 60

    # ─── ANTIGRAVITY OS v2: Load Shedding ───
    LOAD_SHED_THRESHOLD_1: int = 50         # Drop background tasks
    LOAD_SHED_THRESHOLD_2: int = 100        # Drop low priority
    LOAD_SHED_THRESHOLD_3: int = 200        # Static for new sessions
    LOAD_SHED_THRESHOLD_4: int = 500        # Tier 4 all

    # ─── ANTIGRAVITY OS v2: Security ───
    SECURITY_RISK_SCRUTINY: int = 30
    SECURITY_RISK_CHALLENGE: int = 50
    SECURITY_RISK_DELAY: int = 75
    SECURITY_RISK_SOFT_BAN: int = 100
    SECURITY_SOFT_BAN_HOURS: int = 48

    # ─── ANTIGRAVITY OS v2: Feature Flags ───
    FEATURE_CLI_MODE: bool = True
    FEATURE_BUILD_WITH_ME: bool = True
    FEATURE_STUMP_CHALLENGE: bool = True
    FEATURE_TIME_MACHINE: bool = True
    FEATURE_LIVE_BUILD_WIDGET: bool = True
    FEATURE_VOICE_MODE: bool = True
    FEATURE_DEBATE_MODE: bool = True
    FEATURE_3D_CONSTELLATION: bool = True
    FEATURE_WEB_RESEARCH: bool = True
    FEATURE_OPPORTUNITY_AGENT: bool = False  # Private, enable manually

    # ═══════════════════════════════════════════════════════════
    # ANTIGRAVITY OS v3 — OMEGA BUILD
    # ═══════════════════════════════════════════════════════════

    # ─── V3: Vision Model (Local via Ollama) ───
    OLLAMA_VISION_MODEL: str = "llava-phi3"   # ~4.2B params, vision-capable
    OLLAMA_RERANK_MODEL: str = "mxbai-rerank-large"

    # ─── V3: ColBERT Retrieval ───
    COLBERT_MODEL: str = "colbert-ir/colbertv2.0"
    COLBERT_TOP_K_DENSE: int = 50     # Stage 1: dense candidates
    COLBERT_TOP_K_RERANK: int = 8     # Stage 2: ColBERT rerank
    CROSS_ENCODER_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    CROSS_ENCODER_TOP_K: int = 4      # Stage 3: final selection

    # ─── V3: Structured Output (Outlines) ───
    OUTLINES_ENABLED: bool = True

    # ─── V3: DSPy Prompt Optimization ───
    DSPY_ENABLED: bool = True
    DSPY_OPTIMIZATION_SCHEDULE: str = "sunday_01:00"
    DSPY_IMPROVEMENT_THRESHOLD: float = 0.05  # 5% improvement to auto-deploy
    DSPY_NUM_CANDIDATES: int = 15
    DSPY_NUM_TRIALS: int = 25
    DSPY_MAX_BOOTSTRAPPED_DEMOS: int = 4
    DSPY_MAX_LABELED_DEMOS: int = 8

    # ─── V3: Ragas RAG Evaluation ───
    RAGAS_ENABLED: bool = True
    RAGAS_EVAL_SCHEDULE: str = "daily_04:00"
    RAGAS_FAITHFULNESS_THRESHOLD: float = 0.80
    RAGAS_CONTEXT_PRECISION_THRESHOLD: float = 0.75
    RAGAS_ANSWER_RELEVANCY_THRESHOLD: float = 0.80
    RAGAS_EVAL_DATASET_SIZE: int = 150

    # ─── V3: DuckDB Analytics ───
    DUCKDB_PATH: str = "data/analytics/antigravity.duckdb"
    DUCKDB_PARQUET_DIR: str = "data/analytics/parquet"
    DUCKDB_ETL_SCHEDULE: str = "daily_02:00"

    # ─── V3: MinIO (Self-Hosted S3) ───
    MINIO_ENDPOINT: str = "http://localhost:9000"
    MINIO_ACCESS_KEY: str = ""
    MINIO_SECRET_KEY: str = ""
    MINIO_BUCKET_BRIEFS: str = "portfolio-briefs"
    MINIO_BUCKET_SCREENSHOTS: str = "portfolio-screenshots"
    MINIO_BUCKET_ANALYTICS: str = "portfolio-analytics"
    MINIO_BUCKET_BACKUPS: str = "portfolio-backups"
    MINIO_BRIEF_EXPIRY_HOURS: int = 24

    # ─── V3: ntfy Push Notifications ───
    NTFY_BASE_URL: str = "http://localhost:8080"
    NTFY_TOPIC: str = "portfolio-alerts"
    NTFY_AUTH_TOKEN: str = ""
    NTFY_ENABLED: bool = True

    # ─── V3: Umami Analytics ───
    UMAMI_APP_SECRET: str = ""
    UMAMI_TRACKING_ID: str = ""
    UMAMI_HOST: str = "http://localhost:3003"

    # ─── V3: V3 Feature Flags ───
    FEATURE_PWA: bool = True
    FEATURE_WEB_WORKER_EMBEDDINGS: bool = True
    FEATURE_FINGERPRINT: bool = True
    FEATURE_COLBERT_RETRIEVAL: bool = True
    FEATURE_VISION_PIPELINE: bool = True
    FEATURE_DSPY_OPTIMIZATION: bool = True
    FEATURE_RAGAS_EVALUATION: bool = True
    FEATURE_DUCKDB_ANALYTICS: bool = True
    FEATURE_MINIO_STORAGE: bool = True
    FEATURE_NTFY_NOTIFICATIONS: bool = True
    FEATURE_UMAMI_ANALYTICS: bool = True

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

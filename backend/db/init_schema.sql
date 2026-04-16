-- ═══════════════════════════════════════════════════════════
-- Portfolio DB Bootstrap — Run once on first startup
-- ═══════════════════════════════════════════════════════════

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Knowledge Chunks (RAG corpus) ───
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id              SERIAL PRIMARY KEY,
    chunk_id        VARCHAR(64) UNIQUE NOT NULL,
    content         TEXT NOT NULL,
    source          VARCHAR(255) NOT NULL,
    source_type     VARCHAR(50) NOT NULL,      -- 'document', 'github', 'linkedin', 'instagram'
    entity_type     VARCHAR(50),               -- 'project', 'skill', 'experience', 'bio'
    tags            JSONB DEFAULT '[]'::jsonb,
    metadata        JSONB DEFAULT '{}'::jsonb,
    embedding       vector(768),
    chunk_version   INTEGER DEFAULT 1,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_chunks_source ON knowledge_chunks (source);
CREATE INDEX IF NOT EXISTS idx_chunks_entity_type ON knowledge_chunks (entity_type);
CREATE INDEX IF NOT EXISTS idx_chunks_source_type ON knowledge_chunks (source_type);

-- ─── User Episodes (Tier 2 — Episodic Memory) ───
CREATE TABLE IF NOT EXISTS user_episodes (
    id              SERIAL PRIMARY KEY,
    user_id         VARCHAR(64) NOT NULL,
    session_id      VARCHAR(64) NOT NULL,
    summary         TEXT NOT NULL,
    key_facts       JSONB DEFAULT '[]'::jsonb,
    topics_discussed JSONB DEFAULT '[]'::jsonb,
    embedding       vector(768),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episodes_user ON user_episodes (user_id);
CREATE INDEX IF NOT EXISTS idx_episodes_embedding ON user_episodes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- ─── Conversations ───
CREATE TABLE IF NOT EXISTS conversations (
    id              SERIAL PRIMARY KEY,
    conversation_id VARCHAR(64) UNIQUE NOT NULL,
    user_id         VARCHAR(64) NOT NULL,
    session_id      VARCHAR(64) NOT NULL,
    title           VARCHAR(255),
    message_count   INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations (user_id);

-- ─── Messages ───
CREATE TABLE IF NOT EXISTS messages (
    id              SERIAL PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(conversation_id),
    role            VARCHAR(20) NOT NULL,      -- 'user', 'assistant'
    content         TEXT NOT NULL,
    model_used      VARCHAR(50),
    intent          VARCHAR(50),
    citations       JSONB DEFAULT '[]'::jsonb,
    latency_ms      INTEGER,
    token_count     INTEGER,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id);

-- ─── Ingestion Log ───
CREATE TABLE IF NOT EXISTS ingestion_log (
    id              SERIAL PRIMARY KEY,
    source          VARCHAR(255) NOT NULL,
    source_type     VARCHAR(50) NOT NULL,
    chunks_created  INTEGER DEFAULT 0,
    chunks_updated  INTEGER DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'failed'
    error_message   TEXT,
    started_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at    TIMESTAMP WITH TIME ZONE
);

-- ─── User Sessions ───
CREATE TABLE IF NOT EXISTS user_sessions (
    id              SERIAL PRIMARY KEY,
    user_id         VARCHAR(64) NOT NULL,
    session_id      VARCHAR(64) UNIQUE NOT NULL,
    anonymous_id    VARCHAR(64),
    is_authenticated BOOLEAN DEFAULT FALSE,
    device_info     JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_anonymous ON user_sessions (anonymous_id);

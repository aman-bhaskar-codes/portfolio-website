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

-- ═══════════════════════════════════════════════════════════
-- Knowledge Graph (ANTIGRAVITY OS §10)
-- ═══════════════════════════════════════════════════════════

-- ─── KG Entities ───
CREATE TABLE IF NOT EXISTS kg_entities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type        VARCHAR(50) NOT NULL,
    name        VARCHAR(200) NOT NULL,
    properties  JSONB NOT NULL DEFAULT '{}',
    embedding   vector(768),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kg_entities_type ON kg_entities (type);
CREATE INDEX IF NOT EXISTS idx_kg_entities_name ON kg_entities (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_kg_entities_embedding ON kg_entities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- ─── KG Relations ───
CREATE TABLE IF NOT EXISTS kg_relations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID REFERENCES kg_entities(id) ON DELETE CASCADE,
    target_id       UUID REFERENCES kg_entities(id) ON DELETE CASCADE,
    relation_type   VARCHAR(100) NOT NULL,
    weight          FLOAT DEFAULT 1.0,
    evidence        TEXT DEFAULT '',
    properties      JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kg_relations_source ON kg_relations (source_id);
CREATE INDEX IF NOT EXISTS idx_kg_relations_target ON kg_relations (target_id);
CREATE INDEX IF NOT EXISTS idx_kg_relations_type ON kg_relations (relation_type);

-- ═══════════════════════════════════════════════════════════
-- Visitor Profiles (ANTIGRAVITY OS §4.2)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS visitor_profiles (
    id                  SERIAL PRIMARY KEY,
    visitor_id          VARCHAR(128) UNIQUE NOT NULL,
    persona             VARCHAR(50) DEFAULT 'casual',
    company             VARCHAR(200),
    topics_covered      JSONB DEFAULT '[]'::jsonb,
    projects_shown      JSONB DEFAULT '[]'::jsonb,
    questions_asked     JSONB DEFAULT '[]'::jsonb,
    high_engagement_topics JSONB DEFAULT '[]'::jsonb,
    clicked_repos       JSONB DEFAULT '[]'::jsonb,
    visit_count         INTEGER DEFAULT 1,
    relationship_tier   VARCHAR(20) DEFAULT 'new',
    asked_availability  BOOLEAN DEFAULT FALSE,
    asked_contact       BOOLEAN DEFAULT FALSE,
    downloaded_brief    BOOLEAN DEFAULT FALSE,
    first_visit         TIMESTAMPTZ DEFAULT NOW(),
    last_visit          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_profiles_id ON visitor_profiles (visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_profiles_persona ON visitor_profiles (persona);

-- ═══════════════════════════════════════════════════════════
-- ANTIGRAVITY OS v4 — Database Schema
-- Run once on first startup
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─── Visitor Sessions ───
CREATE TABLE IF NOT EXISTS visitor_sessions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id   VARCHAR(64) UNIQUE NOT NULL,
    anonymous_id VARCHAR(64),
    persona      VARCHAR(64) DEFAULT 'casual',
    company      VARCHAR(128),
    visit_count  INTEGER DEFAULT 1,
    created_at   TIMESTAMP DEFAULT NOW(),
    last_seen    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_visitor_session_id ON visitor_sessions (session_id);

-- ─── Knowledge Chunks (RAG corpus) ───
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id              SERIAL PRIMARY KEY,
    chunk_id        VARCHAR(64) UNIQUE NOT NULL,
    content         TEXT NOT NULL,
    source          VARCHAR(255) NOT NULL,
    source_type     VARCHAR(50) NOT NULL,
    entity_type     VARCHAR(50),
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

-- ─── User Episodes (Tier 2 — Episodic Memory) ───
CREATE TABLE IF NOT EXISTS user_episodes (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    VARCHAR(64) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    summary    TEXT NOT NULL,
    key_facts  JSONB DEFAULT '[]',
    embedding  vector(768),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_episodes_user_id ON user_episodes (user_id);
CREATE INDEX IF NOT EXISTS idx_episodes_embedding ON user_episodes
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ─── Conversations (DSPy training data) ───
CREATE TABLE IF NOT EXISTS conversations (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id    VARCHAR(64) NOT NULL,
    turn_index    INTEGER NOT NULL,
    role          VARCHAR(16) NOT NULL,
    content       TEXT NOT NULL,
    intent        VARCHAR(64),
    persona       VARCHAR(64),
    model_used    VARCHAR(64),
    latency_ms    INTEGER,
    rag_chunk_ids JSONB DEFAULT '[]',
    created_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conv_session ON conversations (session_id);
CREATE INDEX IF NOT EXISTS idx_conv_created ON conversations (created_at);

-- ─── Conversion Events ───
CREATE TABLE IF NOT EXISTS conversion_events (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    metadata   JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversion_session ON conversion_events (session_id);

-- ─── Knowledge Graph Entities ───
CREATE TABLE IF NOT EXISTS kg_entities (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(64) NOT NULL,
    name        VARCHAR(256) NOT NULL,
    properties  JSONB DEFAULT '{}',
    embedding   vector(768),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kg_entity_unique ON kg_entities (entity_type, name);

-- ─── Knowledge Graph Relations ───
CREATE TABLE IF NOT EXISTS kg_relations (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id     UUID REFERENCES kg_entities(id) ON DELETE CASCADE,
    target_id     UUID REFERENCES kg_entities(id) ON DELETE CASCADE,
    relation_type VARCHAR(64) NOT NULL,
    weight        FLOAT DEFAULT 1.0,
    properties    JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_kg_source ON kg_relations (source_id);
CREATE INDEX IF NOT EXISTS idx_kg_target ON kg_relations (target_id);

-- ─── Visitor Profiles ───
CREATE TABLE IF NOT EXISTS visitor_profiles (
    id                  SERIAL PRIMARY KEY,
    visitor_id          VARCHAR(128) UNIQUE NOT NULL,
    persona             VARCHAR(50) DEFAULT 'casual',
    company             VARCHAR(200),
    topics_covered      JSONB DEFAULT '[]'::jsonb,
    visit_count         INTEGER DEFAULT 1,
    relationship_tier   VARCHAR(20) DEFAULT 'new',
    first_visit         TIMESTAMPTZ DEFAULT NOW(),
    last_visit          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_visitor_profiles_id ON visitor_profiles (visitor_id);

-- ─── RAG Quality Metrics (Ragas) ───
CREATE TABLE IF NOT EXISTS rag_quality_metrics (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measured_at       TIMESTAMP DEFAULT NOW(),
    faithfulness      FLOAT,
    context_precision FLOAT,
    context_recall    FLOAT,
    answer_relevancy  FLOAT,
    num_questions     INTEGER,
    below_threshold   BOOLEAN DEFAULT FALSE
);

-- ─── DSPy Optimization History ───
CREATE TABLE IF NOT EXISTS dspy_optimization_runs (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_at         TIMESTAMP DEFAULT NOW(),
    baseline_score FLOAT,
    new_score      FLOAT,
    improvement    FLOAT,
    deployed       BOOLEAN DEFAULT FALSE,
    prompt_version VARCHAR(64)
);

-- ─── Ingestion Log ───
CREATE TABLE IF NOT EXISTS ingestion_log (
    id              SERIAL PRIMARY KEY,
    source          VARCHAR(255) NOT NULL,
    source_type     VARCHAR(50) NOT NULL,
    chunks_created  INTEGER DEFAULT 0,
    chunks_updated  INTEGER DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'pending',
    error_message   TEXT,
    started_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at    TIMESTAMP WITH TIME ZONE
);

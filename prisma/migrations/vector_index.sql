-- Performance: IVFFlat vector index for fast cosine similarity search
-- Run this after initial data is loaded (needs rows for clustering)
-- Execute with: psql $DATABASE_URL -f prisma/migrations/vector_index.sql

-- ProjectKnowledge index
CREATE INDEX IF NOT EXISTS idx_project_knowledge_embedding
ON "ProjectKnowledge"
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

-- Memory index  
CREATE INDEX IF NOT EXISTS idx_memory_embedding
ON "Memory"
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);

-- Query performance index for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_created_at
ON "AnalyticsLog" (\"createdAt\" DESC);

-- Project lookup index
CREATE INDEX IF NOT EXISTS idx_project_github_url
ON "Project" ("githubUrl");

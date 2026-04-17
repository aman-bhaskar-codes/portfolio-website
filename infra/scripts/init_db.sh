#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# ANTIGRAVITY OS v4 — Initialize Database Schema
# Run: make init-db (or: bash infra/scripts/init_db.sh)
# ═══════════════════════════════════════════════════════════

set -e

CONTAINER="antigravity-postgres"
DB_USER="${POSTGRES_USER:-antigravity}"
DB_NAME="${POSTGRES_DB:-antigravity}"
SCHEMA_FILE="backend/db/init_schema.sql"

echo "═══ Initializing PostgreSQL schema ═══"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Schema file not found: $SCHEMA_FILE"
    exit 1
fi

docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$SCHEMA_FILE"

echo "✅ Database schema initialized successfully"
echo ""
echo "Tables created:"
docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
    -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"

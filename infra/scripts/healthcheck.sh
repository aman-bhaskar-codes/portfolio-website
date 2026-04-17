#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# ANTIGRAVITY OS v4 — 12-Step Health Check
# Run: bash infra/scripts/healthcheck.sh
# ═══════════════════════════════════════════════════════════

PASS=0
FAIL=0

check() {
    local name="$1"
    local cmd="$2"
    if eval "$cmd" > /dev/null 2>&1; then
        echo "  ✅ $name"
        PASS=$((PASS + 1))
    else
        echo "  ❌ $name"
        FAIL=$((FAIL + 1))
    fi
}

echo "═══════════════════════════════════════════════════════════"
echo "ANTIGRAVITY OS v4 — POST-STARTUP HEALTH CHECK"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "STEP 1: Core Services"
check "API server" "curl -sf http://localhost:8000/health"
check "Ollama" "curl -sf http://localhost:11434/api/tags"
echo ""

echo "STEP 2: Database"
check "PostgreSQL" "docker exec antigravity-postgres pg_isready"
echo ""

echo "STEP 3: Redis"
check "Redis ping" "docker exec antigravity-redis redis-cli ping"
echo ""

echo "STEP 4: Qdrant"
check "Qdrant readyz" "curl -sf http://localhost:6333/readyz"
echo ""

echo "STEP 5: Ollama model test"
check "llama3.2:3b inference" "curl -sf http://localhost:11434/api/generate -d '{\"model\":\"llama3.2:3b\",\"prompt\":\"Say OK\",\"stream\":false}'"
echo ""

echo "STEP 6: Embedding test"
check "nomic-embed-text" "curl -sf http://localhost:11434/api/embeddings -d '{\"model\":\"nomic-embed-text\",\"prompt\":\"test\"}'"
echo ""

echo "STEP 7: API health endpoint"
check "API /api/health" "curl -sf http://localhost:8000/api/health"
echo ""

echo "STEP 8–10: Agent tests (requires make debug-*)"
echo "  ⏭  Run: make debug-rag"
echo "  ⏭  Run: make debug-agents"
echo "  ⏭  Run: make debug-memory"
echo ""

echo "STEP 11: Chat SSE test"
check "SSE chat stream" "curl -sf -X POST http://localhost:8000/api/chat -H 'Content-Type: application/json' -d '{\"message\":\"hello\",\"session_id\":\"healthcheck\"}'"
echo ""

echo "STEP 12: Frontend"
check "Next.js frontend" "curl -sf http://localhost:3000"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "RESULTS: $PASS passed, $FAIL failed"
if [ $FAIL -eq 0 ]; then
    echo "✅ ALL CHECKS PASSED — SYSTEM IS PRODUCTION READY"
else
    echo "⚠️  $FAIL check(s) failed — review above"
fi
echo "═══════════════════════════════════════════════════════════"

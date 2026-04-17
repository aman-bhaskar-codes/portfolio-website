#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# ANTIGRAVITY OS v4 — Pull All Ollama Models
# Run: make pull-models (or: bash infra/scripts/pull_models.sh)
# ═══════════════════════════════════════════════════════════

set -e

CONTAINER="antigravity-ollama"

echo "═══ ANTIGRAVITY OS v4 — Model Pull ═══"
echo ""

MODELS=(
    "llama3.2:3b"
    "qwen2.5:3b"
    "phi4-mini:latest"
    "nomic-embed-text"
    "mxbai-rerank-large"
)

for model in "${MODELS[@]}"; do
    echo "📥 Pulling $model..."
    docker exec "$CONTAINER" ollama pull "$model"
    echo "✅ $model ready"
    echo ""
done

echo "═══ Core models ready! ═══"
echo ""
echo "Optional: Pull vision model (4.2GB):"
echo "  docker exec $CONTAINER ollama pull llava-phi3"

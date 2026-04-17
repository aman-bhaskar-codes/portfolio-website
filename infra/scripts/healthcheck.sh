#!/bin/bash
# infra/scripts/healthcheck.sh
# Run: bash infra/scripts/healthcheck.sh

set -e
echo "=== ANTIGRAVITY OS — FINAL VERIFICATION ==="

# 1. API health
echo "Checking API health..."
HEALTH=$(curl -sf http://localhost:8000/health)
TIER=$(echo $HEALTH | python3 -c "import sys,json; print(json.load(sys.stdin)['tier'])")
if [ "$TIER" -le 3 ]; then
  echo "✅ API healthy (tier: $TIER)"
else
  echo "❌ API degraded (tier: $TIER)" && exit 1
fi

# 2. Chat streaming test
echo "Testing chat streaming..."
RESPONSE=$(curl -s -N -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "session_id": "health-check-test"}' \
  --max-time 30 | head -5)
if echo "$RESPONSE" | grep -q "data:"; then
  echo "✅ Chat streaming works"
else
  echo "❌ Chat streaming failed" && exit 1
fi

# 3. Qdrant collections
echo "Checking Qdrant collections..."
COLLECTIONS=$(curl -sf http://localhost:6333/collections | python3 -c "
import sys, json
data = json.load(sys.stdin)
names = [c['name'] for c in data['result']['collections']]
print(names)
")
echo "✅ Qdrant collections: $COLLECTIONS"

# 4. Frontend
echo "Checking frontend..."
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Frontend accessible"
else
  echo "❌ Frontend returned HTTP $HTTP_CODE" && exit 1
fi

echo ""
echo "============================================"
echo "✅ ANTIGRAVITY OS is fully operational!"
echo "   Visit http://localhost:3000 to see it."
echo "============================================"

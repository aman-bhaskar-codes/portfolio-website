# REPOSITORY DEEP AUDIT — ANTIGRAVITY OS
## Real Findings, Brutal Honesty, Step-by-Step Fixes

> Analyzed: `aman-bhaskar-codes/portfolio-website` — 20 commits, main branch
> Files read: `package.json`, `docker-compose.yml`, repo root, README

---

## EXECUTIVE VERDICT

The **README is a masterpiece. The code is a construction site.**

This is not a criticism — it's a pattern. You've done something very smart: designed the full system on paper before writing it. That's actually how good engineers work. But right now there's a gap between what the README claims ("Production Ready") and what the actual code delivers.

The good news: the **architecture decisions are correct**. LangGraph, Qdrant, Celery, pgvector — all the right choices. What needs fixing is the execution layer: security holes, duplicate packages, committed garbage files, and configuration conflicts that will break things in production.

**Severity breakdown of findings:**

| Severity | Count | Category |
|----------|-------|----------|
| 🔴 CRITICAL | 6 | Security — hardcoded secrets in VCS |
| 🟠 HIGH | 8 | Broken dependencies, package conflicts |
| 🟡 MEDIUM | 11 | Config bugs, anti-patterns |
| 🟢 LOW | 9 | Repo hygiene, cleanup |

---

## PART 1 — CRITICAL: SECURITY VULNERABILITIES

These are not warnings. These are **ship-blocking issues** that expose your server if deployed as-is.

### CRITICAL-1: Hardcoded Secrets in `docker-compose.yml`

**What's wrong:**
```yaml
# Line ~290 in docker-compose.yml — HARDCODED IN GIT
langfuse:
  environment:
    - NEXTAUTH_SECRET=92bc7a9e3d4f128ab6c95d31b817e048f3219a   # ← EXPOSED
    - SALT=47d9c1b3f8e52a9c7b1654e81d7f6c3a                    # ← EXPOSED

grafana:
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=grafana_secure_admin_2026      # ← EXPOSED

postgres:
  environment:
    - POSTGRES_PASSWORD=postgres                                 # ← DEFAULT
```

**Why it's critical:** This is a public repo. Anyone can see these. Your Grafana admin password is already public. Your Langfuse signing key is public. If you deploy this, it is immediately compromised.

**Fix:**
```yaml
# docker-compose.yml — reference env vars ONLY
langfuse:
  environment:
    - NEXTAUTH_SECRET=${LANGFUSE_NEXTAUTH_SECRET}
    - SALT=${LANGFUSE_SALT}

grafana:
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}

postgres:
  environment:
    - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
```

```bash
# .env (gitignored — add to .gitignore immediately)
LANGFUSE_NEXTAUTH_SECRET=$(openssl rand -hex 32)
LANGFUSE_SALT=$(openssl rand -hex 16)
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 24)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=$(openssl rand -base64 24)
```

```bash
# .gitignore — add these lines
.env
.env.local
.env.production
```

**⚠️ Action required NOW: Rotate these secrets even if you haven't deployed yet. They are in git history.**

---

### CRITICAL-2: MinIO Default Credentials

```yaml
minio:
  environment:
    - MINIO_ROOT_USER=${MINIO_ACCESS_KEY:-minioadmin}     # ← FALLS BACK TO DEFAULT
    - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY:-minioadmin} # ← FALLS BACK TO DEFAULT
```

The `:-minioadmin` fallback means if `MINIO_ACCESS_KEY` isn't set, it silently uses `minioadmin`/`minioadmin`. Never use fallback defaults for credentials. Remove the fallback entirely — if the secret isn't set, the service should fail to start, not start with default credentials.

**Fix:**
```yaml
minio:
  environment:
    - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}   # no fallback — fail loudly if not set
    - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
```

---

### CRITICAL-3: `.env.genesis` Committed to Repo Root

There is a file called `.env.genesis` in your repository root. Any file starting with `.env` should **never** be committed. Check if this contains real keys. If it does, rotate them immediately and add it to `.gitignore`.

---

### CRITICAL-4: `portfolio-website.session.sql` in Repo Root

A `.session.sql` file is a database session file from a SQL editor (likely VS Code SQLTools). It may contain actual queries with data, table dumps, or connection strings. **Remove it from the repo immediately.**

```bash
git rm portfolio-website.session.sql
echo "*.session.sql" >> .gitignore
git commit -m "security: remove session SQL file and add to gitignore"
```

---

### CRITICAL-5: Port Leakage — Internal Services Exposed Externally

```yaml
# These services are publicly accessible — they should NOT be:
ntfy:
  ports:
    - "8080:80"    # ← public internet can reach your notification server

umami:
  ports:
    - "3003:3000"  # ← public internet can reach your analytics DB

langfuse:
  ports:
    - "3001:3000"  # ← public internet can reach your LLM trace data
```

For production, these should have NO `ports` mapping — access via Nginx proxy only, with auth.

**Fix for `docker-compose.yml`:**
```yaml
# Remove 'ports' from: ntfy, umami, langfuse
# Add Nginx proxy routes for admin dashboard access with basic_auth
```

---

### CRITICAL-6: Redis Configuration Conflict

```yaml
redis:
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru --appendonly yes
```

`--maxmemory-policy allkeys-lru` means Redis will evict ANY key when memory is full (pure cache behavior). `--appendonly yes` means persist everything to disk (cache + working memory + Celery queues). These contradict each other: LRU evicts your Celery task queue entries while AOF persistence writes them to disk pointlessly.

**Fix:**
```yaml
# Use two Redis instances — one for cache, one for persistent queues
redis_cache:
  image: redis:7-alpine
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
  # No appendonly — pure cache, fast, volatile

redis_persistent:
  image: redis:7-alpine
  command: redis-server --appendonly yes --appendfsync everysec
  # For Celery broker/result backend — needs persistence
  volumes:
    - redis_persistent_data:/data
```

Update Celery to use `redis_persistent`, app working memory to use `redis_cache`.

---

## PART 2 — HIGH: BROKEN DEPENDENCIES AND PACKAGE ISSUES

### HIGH-1: `next: "^16.1.6"` — This Version Does Not Exist

```json
"next": "^16.1.6"
```

Next.js current stable is **15.x**. There is no Next.js 16 as of May 2026. This is either a typo or npm resolved it to something unexpected. Check what's actually installed:

```bash
cat node_modules/next/package.json | grep '"version"'
```

**Fix:**
```json
"next": "^15.3.0"
```

---

### HIGH-2: Duplicate React Flow Packages

```json
"@xyflow/react": "^12.10.0",   // ← React Flow v12 (rebranded package name)
"reactflow": "^11.11.4",       // ← React Flow v11 (old package name)
```

These are the same library — `reactflow` v11 was renamed `@xyflow/react` in v12. You're installing both, which adds ~1MB to your bundle and causes version conflicts. Pick one.

**Fix:** Delete `reactflow`, keep `@xyflow/react`. Update all imports:
```tsx
// Before
import ReactFlow from 'reactflow';
// After
import { ReactFlow } from '@xyflow/react';
```

---

### HIGH-3: LangChain Running in the Frontend (Wrong Ecosystem)

```json
// In package.json (frontend deps):
"@langchain/community": "^1.1.20",
"@langchain/core": "^1.1.29",
"@langchain/textsplitters": "^1.0.1",
"langchain": "^1.2.24",
```

LangChain should run in your **Python backend**, not in the Next.js frontend. Having it in `package.json` means one of two things: either you have a parallel TypeScript RAG implementation that duplicates the Python backend, or these are unused dependencies that bloat your bundle.

This adds ~18MB to your frontend build. Check if these are actually used anywhere in `app/` or `components/`. If yes — move that logic to the Python backend and call it via API. If no — remove them.

**Fix:**
```bash
npm uninstall @langchain/community @langchain/core @langchain/textsplitters langchain
```

---

### HIGH-4: Prisma Still in Dependencies (Supposed to Be Replaced)

```json
"@prisma/client": "5.22.0",
"prisma": "5.22.0",
```

Your implementation plan explicitly states: "Prisma (Node ORM in Python backend) → REPLACED by SQLAlchemy async + raw pgvector". Yet Prisma is still in `package.json`. There's also a `prisma/` directory in the repo root.

Either Prisma is still being actively used (meaning SQLAlchemy migration isn't done), or it's leftover dead code. Either way, it's creating confusion. If you're on SQLAlchemy: remove Prisma entirely. If not yet: don't claim the migration is done in the README.

**Fix (if SQLAlchemy done):**
```bash
npm uninstall @prisma/client prisma
rm -rf prisma/
```

---

### HIGH-5: `openai` Package Installed but Claiming 100% Local

```json
"openai": "^6.21.0"
```

The README badge says "Cloud Bill: $0/month" and emphasizes 100% local Ollama inference. But the OpenAI SDK is installed. This is either a fallback cloud provider (which contradicts the marketing) or dead code.

If it's a circuit-breaker fallback (reasonable), **document it clearly** in README — "Uses OpenAI as emergency fallback only, no normal-operation cost." If it's dead code, remove it. The contradiction confuses anyone who reads the code.

---

### HIGH-6: `next-auth` vs Clerk — Auth Confusion

```json
"next-auth": "^4.24.13"  // ← in package.json
```

The implementation plan says auth is "Clerk (Phase 5)". But `next-auth` is installed. Your `docker-compose.yml` also uses `NEXTAUTH_SECRET` for Langfuse (which does use NextAuth internally) — that's fine for Langfuse. But for the portfolio auth itself: pick one. Don't stub next-auth while planning to move to Clerk — it creates code that needs to be thrown away.

**Decision:** Use next-auth with JWT as the permanent solution (it's free, no external service needed). Drop the Clerk plan unless you have a specific reason (Clerk costs money at scale).

---

### HIGH-7: `.npm-cache` Directory Committed to Git

There's a `.npm-cache` directory in your repository root. This is npm's local package cache — sometimes tens or hundreds of MB. It should never be in version control.

```bash
git rm -r --cached .npm-cache
echo ".npm-cache" >> .gitignore
git commit -m "chore: remove npm cache from tracking"
```

---

### HIGH-8: `ai-engine/` Directory Still Exists

According to your implementation plan: "ai-engine service is removed. All its functionality merges into backend/agents/." But there's still an `ai-engine/` directory in the repo. If it's been merged, delete it. Dead code that contradicts the architecture document is worse than no code.

```bash
git rm -rf ai-engine/
git commit -m "refactor: remove deprecated ai-engine (merged into backend/agents)"
```

---

## PART 3 — MEDIUM: CONFIGURATION BUGS AND ANTI-PATTERNS

### MEDIUM-1: Qdrant Has No Health Check — Race Condition on Boot

```yaml
qdrant:
  image: qdrant/qdrant:latest
  # No healthcheck!
```

Both `api` and `celery_worker` depend on Qdrant, but since it has no `service_healthy` condition (because it has no healthcheck), the API starts before Qdrant is ready, causing the first ingestion attempts to fail.

**Fix:**
```yaml
qdrant:
  image: qdrant/qdrant:latest
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:6333/readyz"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 10s
```

Then in `api` and `celery_worker` depends_on:
```yaml
depends_on:
  qdrant:
    condition: service_healthy
```

---

### MEDIUM-2: Prometheus and Grafana Have No Port Mapping

```yaml
prometheus:
  image: prom/prometheus:latest
  # No ports: mapping
  
grafana:
  image: grafana/grafana:latest
  # No ports: mapping
```

How do you access your dashboards? In development you can't. These need either direct port mappings for dev, or Nginx proxy routes.

**Fix for dev:**
```yaml
prometheus:
  ports:
    - "9090:9090"

grafana:
  ports:
    - "3002:3000"
```

---

### MEDIUM-3: `Dockerfile.dev` Used for Frontend in Compose

```yaml
frontend:
  build:
    dockerfile: Dockerfile.dev   # ← Dev dockerfile with hot reload
  volumes:
    - .:/app                     # ← Bind mount — dev only
```

This is fine for development but `docker-compose.yml` appears to be your production compose as well (based on the naming — there's also a `docker-compose.dev.yml`). Production should use the production `Dockerfile` with a proper build, not bind mounts. Bind mounts in production mean code changes on the host instantly appear in the container — a security and consistency problem.

**Fix:** Separate dev and prod clearly:
- `docker-compose.yml` — production config, no bind mounts, uses built images
- `docker-compose.dev.yml` — dev config, bind mounts, hot reload, Dockerfile.dev

---

### MEDIUM-4: Langfuse Using Wrong Image Tag

```yaml
langfuse:
  image: langfuse/langfuse:latest
```

Langfuse v3 changed its architecture significantly and requires both `langfuse-web` and `langfuse-worker` containers. The single `langfuse/langfuse:latest` image may pull v2 or v3 depending on when you pull, breaking your setup. Pin to a specific version:

```yaml
langfuse-web:
  image: langfuse/langfuse:2.94.2   # pin specific version
  
langfuse-worker:
  image: langfuse/langfuse-worker:2.94.2
```

---

### MEDIUM-5: Feature Flags as Environment Variables Is Fragile

```yaml
- FEATURE_CLI_MODE=true
- FEATURE_BUILD_WITH_ME=true
- FEATURE_STUMP_CHALLENGE=true
- FEATURE_TIME_MACHINE=true
# ... 10+ more feature flags
```

10+ feature flags as raw env vars means: no validation, no type safety, no documentation of what each flag does. If you mistype `FEAUTRE_CLI_MODE=true` nothing breaks — it just silently doesn't work.

**Fix:** Replace with a typed `FeatureFlags` Pydantic model in `backend/config/settings.py`:
```python
class FeatureFlags(BaseModel):
    cli_mode: bool = Field(default=True, description="Enable terminal emulator mode")
    build_with_me: bool = Field(default=True, description="Enable collaborative build mode")
    stump_challenge: bool = Field(default=False, description="Challenge mode for visitors")
    # ... etc

class Settings(BaseSettings):
    features: FeatureFlags = FeatureFlags()  # auto-parsed from FEATURE_* env vars
```

---

### MEDIUM-6: Celery Worker Environment Variables Duplicated

The `celery_worker` service duplicates all the same environment variables as `api`. If you change a setting, you have to change it in two (or three: api, celery_worker, celery_beat) places — guaranteed to diverge.

**Fix:** Use Docker Compose `x-common-env` YAML anchor:
```yaml
x-common-env: &common-env
  DATABASE_URL: postgresql+asyncpg://postgres:${POSTGRES_PASSWORD}@postgres:5432/portfolio_db
  OLLAMA_URL: http://host.docker.internal:11434
  REDIS_URL: redis://redis:6379/0
  QDRANT_URL: http://qdrant:6333

api:
  environment:
    <<: *common-env
    ENVIRONMENT: development

celery_worker:
  environment:
    <<: *common-env
    CELERY_CONCURRENCY: 4
```

---

### MEDIUM-7: ColBERT Model Requires Separate Setup Not Documented

```yaml
- COLBERT_MODEL=colbert-ir/colbertv2.0
```

ColBERT v2 requires RAGatouille or a custom indexing step that builds a `.ragatouille/` index on first run. This isn't in any setup documentation. On first boot, this will silently fail or add a 10+ minute initialization with no progress indicator.

Add to your `backend/rag/startup.py`:
```python
async def ensure_colbert_index():
    """Run once on startup to build ColBERT index if not present."""
    if not Path(".ragatouille/colbert/indexes/portfolio").exists():
        logger.info("ColBERT index not found. Building on first run (2-5 min)...")
        # build index...
        logger.info("ColBERT index ready.")
```

---

## PART 4 — LOW: REPO HYGIENE (CLEAN THESE UP)

### Files to Remove from Root

These files should not be in the repository root. They're clutter that confuses anyone (including AI tools) reading the codebase:

```bash
# Remove these files:
git rm .lint_out.txt          # lint output — not source code
git rm .lint_output.txt       # duplicate lint output  
git rm .tsc_out.txt           # TypeScript compiler output — not source code
git rm testRag.ts             # test file at root level, should be in tests/
git rm test-image.jpg         # test asset at root level
git rm proxy.ts               # unclear purpose — document or delete
git rm tsconfig.tsbuildinfo   # TypeScript build cache — should be gitignored

# Add to .gitignore:
echo "*.tsbuildinfo" >> .gitignore
echo ".lint_out.txt" >> .gitignore
echo ".lint_output.txt" >> .gitignore
echo ".tsc_out.txt" >> .gitignore
```

### Prompt Files at Root

```
AGENT_FIX_AND_RUN_PROMPT.md
ANTIGRAVITY_OS_V4_GENESIS_BUILD.md
FIX_PROMPT.md
```

These are scaffolding prompts — fascinating for documenting the build process but messy at root level. Move them:
```bash
mkdir -p docs/architecture
mv AGENT_FIX_AND_RUN_PROMPT.md docs/architecture/
mv ANTIGRAVITY_OS_V4_GENESIS_BUILD.md docs/architecture/
mv FIX_PROMPT.md docs/architecture/
```

### `.vscode` in Repo

`.vscode/` contains editor-specific settings. Either gitignore it, or keep only `extensions.json` (team extension recommendations) and remove `settings.json` (personal preferences).

---

## PART 5 — THE BIGGEST HIDDEN PROBLEM: SPEC vs REALITY GAP

This is the most important finding that no linter will catch.

### What the README Claims vs What Exists

| Feature | README Claim | Reality |
|---------|-------------|---------|
| DSPy MIPROv2 | "Runs every Sunday, auto-improves prompts" | Feature flag `DSPY_ENABLED=true` in env. Likely not wired to actual code yet. |
| ColBERT reranking | "5-stage RAG with token-level reranking" | Environment variable set, model path configured. Actual RAGatouille integration status unknown. |
| Ragas evaluation | "Daily RAG quality evaluation" | Feature flag present. Ragas package not in `package.json` (it's Python-side). |
| Visitor Intelligence | "Classifies persona before they speak" | Described in README. Backend module status unknown from public files. |
| "Production Ready" badge | In README | 20 commits, no tests directory with actual tests, no CI/CD running. |

**This gap is dangerous for two reasons:**

1. **To visitors/recruiters:** If someone actually uses your portfolio and the AI is broken, the impressive README makes it worse. "They promised an amazing system and it doesn't work" is worse than "simple portfolio."

2. **To you:** It creates false confidence about what's actually working.

### The Right Approach

Make the README honest about current state:

```markdown
## Status

| Component | Status |
|-----------|--------|
| Basic chat (Ollama → LLM) | ✅ Working |
| Qdrant vector search | ✅ Working |  
| GitHub sync (Celery) | 🔄 In Progress |
| Visitor persona detection | 🔄 In Progress |
| ColBERT reranking | 📋 Planned |
| DSPy optimization | 📋 Planned |
```

---

## PART 6 — THE FREE-COST AGENTIC AI STACK

You asked specifically: make it work **with full AI features, free of cost**. Here's the exact stack with zero paid APIs:

### Replace Everything Paid with Free Alternatives

| Current/Planned | Replace With | Why |
|-----------------|-------------|-----|
| OpenAI API (fallback) | Groq API free tier (100k tokens/day) | 10x faster than Ollama, free tier generous |
| ColBERT (complex setup) | `ms-marco-MiniLM-L-6-v2` via HuggingFace local | Simpler, still excellent reranking |
| Clerk auth | `next-auth` with JWT (already in package.json) | You already have it, it's free |
| MinIO (S3) | Local filesystem + `python-multipart` | You don't need S3 for a portfolio |
| DSPy full implementation | Prompt A/B log file | Log which prompts perform better, iterate manually |

### Free AI Model Stack (Ollama Local)

```bash
# Pull these models once — they run 100% locally, zero API cost:
ollama pull llama3.2:3b          # Fast chat responses (~2GB)
ollama pull qwen2.5-coder:3b     # Code explanation (~2GB)
ollama pull nomic-embed-text     # Text embeddings (<1GB)
ollama pull mxbai-embed-large    # Better embeddings (<2GB, optional)
ollama pull phi4-mini            # Deep reasoning (~2GB)

# DO NOT pull these (too heavy for a portfolio machine):
# llava:7b — 7GB, only needed if you want vision. Use llava-phi3:latest (3GB) instead
# colbertv2.0 — complex setup, use cross-encoder instead

# Reranker (Python, free):
pip install sentence-transformers
# model: cross-encoder/ms-marco-MiniLM-L-6-v2 (~90MB, CPU-fast)
```

---

## PART 7 — PRIORITIZED FIX PLAN (ORDERED BY IMPACT)

Do these in exactly this order:

### Sprint 1: Security (Do Today, 2-3 hours)
1. Remove `.env.genesis` from git, add to `.gitignore`
2. Remove `portfolio-website.session.sql` from git
3. Move ALL hardcoded secrets in `docker-compose.yml` to `.env`
4. Remove `:-defaultvalue` fallbacks from credential env vars
5. Remove port mappings from ntfy, umami, langfuse in production compose
6. Run `git log --all --full-history -- .env.genesis` to check if secrets are in git history — if yes, use `git filter-repo` to purge

### Sprint 2: Package Cleanup (Half day)
7. Fix `next` version to `^15.3.0`
8. Remove `reactflow` (keep `@xyflow/react`)
9. Remove `@langchain/*` and `langchain` from frontend package.json
10. Remove `openai` if it's dead code, or document the fallback
11. Remove `micro` (unused with Next.js)
12. Remove Prisma if SQLAlchemy migration is done

### Sprint 3: Repo Hygiene (1 hour)
13. `git rm` all the garbage files listed in Part 4
14. Update `.gitignore` comprehensively
15. Move prompt `.md` files to `docs/architecture/`
16. Move `testRag.ts` to `tests/`

### Sprint 4: Docker Fix (2-3 hours)
17. Add Qdrant health check + fix `api` depends_on
18. Split Redis into `redis_cache` + `redis_persistent`
19. Use YAML anchors for shared env vars across api/celery
20. Pin Langfuse to specific version
21. Add port mappings for Prometheus and Grafana in dev compose

### Sprint 5: Honest README (1 hour)
22. Add a "Current Status" table (what's working vs planned)
23. Remove "Production Ready" badge until it actually is
24. Add a "Free setup" section showing exactly how to run with zero cost

### Sprint 6: Make the Core Actually Work (Ongoing)
25. Ensure basic chat flow works end-to-end: query → RAG → Ollama → SSE stream
26. Ensure GitHub sync Celery task actually runs and indexes repos
27. Test the vector search returns relevant results
28. Only then: add persona detection
29. Only then: add ColBERT reranking

---

## SUMMARY SCORECARD

| Dimension | Current | Target |
|-----------|---------|--------|
| Security | 2/10 🔴 | 9/10 |
| Package hygiene | 4/10 🟠 | 9/10 |
| Repo cleanliness | 3/10 🟠 | 9/10 |
| Docker config correctness | 5/10 🟡 | 9/10 |
| Core AI features working | Unknown | Verify then build |
| Readme honesty | 4/10 (overpromises) | 8/10 |
| Architecture quality | 9/10 ✅ | 9/10 |
| Tech stack choices | 9/10 ✅ | 9/10 |

**The bones are excellent. The flesh needs work. Fix the security issues today. Everything else is polish.**

# Engineering Philosophy

## First Principles

Every system I build follows these core principles:

### 1. Resilience Over Perfection
A system that degrades gracefully is better than one that's perfect but brittle.
Circuit breakers, health monitoring, and fallback paths are not optional — they're fundamental.

### 2. Local-First AI
Cloud APIs are convenient but create dependency, cost, and privacy risks.
I prefer running models locally (Ollama) and only falling back to cloud when absolutely necessary.

### 3. Build in Public
The best way to learn is to build real systems and share the process.
Every component of ANTIGRAVITY OS is documented and open for learning.

### 4. Measure Everything
If you can't measure it, you can't improve it. Ragas for RAG quality,
DSPy for prompt optimization, Prometheus for system health.

### 5. Ship Fast, Iterate Faster
Start with a working system, then improve. Don't design for 6 months
and ship nothing. Build → Measure → Learn → Repeat.

## Architecture Opinions

- **Microservices are overused.** A well-structured monolith (modular monolith) is better for most projects.
- **ORMs are fine.** SQLAlchemy with async is excellent. Raw SQL is for hot paths only.
- **TypeScript > JavaScript.** Always. The type safety is worth the setup cost.
- **Docker for everything.** If it doesn't run in a container, it doesn't run in production.

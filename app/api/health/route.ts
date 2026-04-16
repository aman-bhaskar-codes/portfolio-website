import prisma from "@/lib/prisma";

const OLLAMA_BASE = process.env.OLLAMA_URL || "http://localhost:11434";

export async function GET() {
    const checks: Record<string, string> = {};
    let allOk = true;

    // 1. Database
    try {
        await prisma.$queryRaw`SELECT 1`;
        checks.db = "ok";
    } catch {
        checks.db = "error";
        allOk = false;
    }

    // 2. Ollama
    try {
        const res = await fetch(`${OLLAMA_BASE}/api/tags`, {
            signal: AbortSignal.timeout(3000),
        });
        checks.ollama = res.ok ? "ok" : "degraded";
        if (!res.ok) allOk = false;
    } catch {
        checks.ollama = "offline";
        allOk = false;
    }

    // 3. Timestamp
    checks.timestamp = new Date().toISOString();

    return Response.json(
        { status: allOk ? "healthy" : "degraded", ...checks },
        { status: allOk ? 200 : 503 }
    );
}

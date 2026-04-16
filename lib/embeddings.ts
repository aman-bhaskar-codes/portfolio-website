const OLLAMA_BASE = process.env.OLLAMA_URL || "http://localhost:11434";

// In-memory embedding cache — prevents duplicate Ollama calls
const embedLRU = new Map<string, { vec: number[]; ts: number }>();
const EMBED_CACHE_MAX = 200;
const EMBED_CACHE_TTL = 10 * 60 * 1000; // 10 min

function normalizeKey(text: string): string {
    return text.toLowerCase().trim().replace(/\s+/g, " ").substring(0, 300);
}

export async function createEmbedding(text: string): Promise<number[]> {
    const key = normalizeKey(text);

    // Check cache
    const cached = embedLRU.get(key);
    if (cached && Date.now() - cached.ts < EMBED_CACHE_TTL) {
        return cached.vec;
    }

    try {
        const response = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "nomic-embed-text",
                prompt: text,
                keep_alive: "5m",
            }),
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            throw new Error(`Ollama Embedding Error: ${response.statusText}`);
        }

        const data = await response.json();
        const vec = data.embedding;

        // Cache result
        embedLRU.set(key, { vec, ts: Date.now() });
        if (embedLRU.size > EMBED_CACHE_MAX) {
            const oldest = embedLRU.keys().next().value;
            if (oldest) embedLRU.delete(oldest);
        }

        return vec;
    } catch (error) {
        console.error("Embedding generation failed:", error);
        throw error;
    }
}

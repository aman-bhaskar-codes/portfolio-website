/**
 * Model Warm-Up Utility
 *
 * Sends a tiny prompt to Ollama on server start to keep qwen2.5:3b
 * loaded in GPU/Metal memory. Prevents cold-start lag on first user query.
 *
 * Usage: Import and call warmupModel() during server initialization.
 */

const OLLAMA_BASE = process.env.OLLAMA_URL || "http://localhost:11434";
const WARMUP_MODEL = "qwen2.5:3b";

let isWarmedUp = false;

export async function warmupModel(): Promise<void> {
    if (isWarmedUp) return;

    try {
        console.log("[WARMUP] Loading qwen2.5:3b into memory...");
        const start = Date.now();

        const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: WARMUP_MODEL,
                messages: [
                    { role: "system", content: "Initialize." },
                    { role: "user", content: "Warmup." },
                ],
                stream: false,
                options: {
                    num_ctx: 256,
                    num_predict: 1,
                    temperature: 0,
                },
            }),
            signal: AbortSignal.timeout(30_000),
        });

        if (res.ok) {
            isWarmedUp = true;
            console.log(`[WARMUP] Model loaded in ${Date.now() - start}ms`);
        } else {
            console.warn(`[WARMUP] Failed: ${res.status}`);
        }
    } catch (err: any) {
        console.warn(`[WARMUP] Skipped (Ollama not available): ${err.message}`);
    }
}

/** Check if model is already warmed up */
export function isModelWarmed(): boolean {
    return isWarmedUp;
}

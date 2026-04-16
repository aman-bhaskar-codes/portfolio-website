/**
 * Centralized Ollama LLM Service — Multi-Model Production
 *
 * callLLM()      — Streaming response (for chat)
 * callLLMSync()  — Non-streaming response (for summarization, eval, internal tasks)
 *
 * Both functions accept an optional model parameter for multi-model orchestration.
 * Falls back to env/default model if none specified.
 *
 * Production optimizations:
 *   - Configurable model per call
 *   - Reduced num_ctx for speed
 *   - Configurable base URL via env
 */

const OLLAMA_BASE = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_URL = `${OLLAMA_BASE}/api/chat`;
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";

export interface LLMCallOptions {
    contextWindow?: number;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
}

/**
 * Streaming LLM call — returns a ReadableStream for the chat API.
 * @param messages - Chat messages array
 * @param model - Optional model override (defaults to env/default)
 * @param options - Optional config overrides
 */
export async function callLLM(
    messages: any[],
    model?: string,
    options?: LLMCallOptions
) {
    const response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: model || DEFAULT_MODEL,
            messages,
            stream: true,
            options: {
                num_ctx: options?.contextWindow || 2048,
                num_predict: options?.maxTokens || 300,
                temperature: options?.temperature || 0.3,
                top_p: 0.9,
                repeat_penalty: 1.1,
            }
        }),
        signal: AbortSignal.timeout(options?.timeout || 30000),
    });

    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
    }

    return response.body;
}

/**
 * Non-streaming LLM call — returns the full text response.
 * Used for summarization, code analysis, self-evaluation, and internal tasks.
 * @param messages - Chat messages array
 * @param model - Optional model override (defaults to env/default)
 * @param options - Optional config overrides
 */
export async function callLLMSync(
    messages: any[],
    model?: string,
    options?: LLMCallOptions
): Promise<string> {
    const response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: model || DEFAULT_MODEL,
            messages,
            stream: false,
            options: {
                num_ctx: options?.contextWindow || 2048,
                num_predict: options?.maxTokens || 300,
                temperature: options?.temperature || 0.2,
                top_p: 0.9,
                repeat_penalty: 1.1,
            }
        }),
        signal: AbortSignal.timeout(options?.timeout || 45000),
    });

    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message?.content || "";
}

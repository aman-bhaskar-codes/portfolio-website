
// Keep LangChain for simple non-streaming calls if needed, or just use fetch.
// We will use fetch for reliability as requested.

interface LLMRequest {
    model?: string;
    system?: string;
    user: string;
    context?: string;
    json?: boolean;
}

export async function callLLMStream({
    model,
    system,
    context,
    user
}: any) {
    const controller = new AbortController();

    // 25s timeout as requested
    setTimeout(() => controller.abort(), 25000);

    console.log(`[LLM Stream] Calling Ollama: ${model || "qwen2.5:3b"}`);

    try {
        const res = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: model || "qwen2.5:3b",
                stream: true,
                prompt: `
${system || "You are a helpful assistant."}

Context:
${context || ""}

User:
${user}
`
            })
        });

        if (!res.body) throw new Error("No response body");

        // Transform raw Ollama JSON stream to Text Stream
        // This is CRITICAL: Ollama returns "data: { response: '...' }" objects
        // We must extract the 'response' field and yield only text.

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        return new ReadableStream({
            async start(controller) {
                let buffer = "";
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    // Decode raw bytes (likely JSON chunks)
                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;

                    // Ollama can sometimes send partial JSONs or multiple JSONs per chunk
                    // We split by newline to handle ndjson style, or try to parse
                    // But Ollama /api/generate is standard JSON stream.
                    // It usually sends one JSON object per line/chunk.

                    // Let's try splitting by objects if they are concatenated
                    // A simple heuristic for Ollama is splitting by "}\n{" or similar, 
                    // but safely we can try to parse the buffer if it looks complete.
                    // Actually, splitting by newline is the safest for Ollama API.

                    const lines = buffer.split("\n");
                    buffer = lines.pop() || ""; // Keep the last incomplete line

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const json = JSON.parse(line);
                            if (json.response) {
                                // Enqueue just the text content
                                controller.enqueue(encoder.encode(json.response));
                            }
                            if (json.done) {
                                controller.close();
                                return;
                            }
                        } catch (e) {
                            // Chunk was not a valid JSON line? Ignore or accumulate.
                            // It might be part of the next line.
                            // Ideally we should add it back to buffer if we failed?
                            // But we popped it. 
                            // If split by newline failed to produce valid JSON, it might be that newline was inside string?
                            // For now, assuming standard Ollama behavior (one JSON per line).
                        }
                    }
                }
                controller.close();
            }
        });

    } catch (error) {
        console.error("Ollama Stream Error:", error);
        throw error;
    }
}

export async function callLLM(req: LLMRequest): Promise<any> {
    const model = req.model || "qwen2.5:3b";

    console.log(`[LLM] Calling Ollama: ${model}`);

    try {
        const res = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: model,
                stream: false,
                prompt: `
${req.system || "You are a helpful assistant."}

Context:
${req.context || ""}

User:
${req.user}
`,
                format: req.json ? "json" : undefined
            })
        });

        if (!res.ok) throw new Error(`Ollama Error: ${res.statusText}`);

        const data = await res.json();
        const content = data.response;

        if (req.json) {
            try {
                return JSON.parse(content);
            } catch (e) {
                console.error("JSON parse error", e);
                return {};
            }
        }

        return content;
    } catch (e) {
        console.error("LLM Call Error", e);
        return "I am currently offline or upgrading my neural pathways.";
    }
}

// Ollama client — handles embeddings + streaming chat
// Zero cloud dependency. Works offline with local models.

const BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama3.2:3b'
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/** Get embedding vector for a text string */
export async function embed(text: string): Promise<number[]> {
  const res = await fetch(`${BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  })
  if (!res.ok) throw new Error(`Ollama embed failed: ${res.status}`)
  const data = await res.json() as { embedding: number[] }
  return data.embedding
}

/** Stream a chat response — returns an async generator of string chunks */
export async function* streamChat(
  messages: ChatMessage[],
  system?: string
): AsyncGenerator<string> {
  const payload = {
    model: CHAT_MODEL,
    messages: system
      ? [{ role: 'system' as const, content: system }, ...messages]
      : messages,
    stream: true,
    options: {
      temperature: 0.7,
      num_predict: 1024,
    },
  }

  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Ollama chat failed: ${res.status}`)

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line)
        if (parsed.message?.content) yield parsed.message.content
        if (parsed.done) return
      } catch {
        /* ignore malformed JSON lines */
      }
    }
  }
}

/** Check if Ollama is reachable */
export async function isOllamaRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    })
    return res.ok
  } catch {
    return false
  }
}

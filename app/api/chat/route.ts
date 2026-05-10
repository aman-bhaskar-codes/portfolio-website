import { NextRequest } from 'next/server'
import { retrieve } from '@/lib/rag-store'
import { streamChat, isOllamaRunning } from '@/lib/ollama'
import { detectPersona, PERSONA_SYSTEM_PROMPTS } from '@/lib/personas'
import { z } from 'zod'

const RequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(20).optional().default([]),
})

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 30) return false
  entry.count++
  return true
}

function sanitize(text: string): string {
  return text
    .replace(/ignore (previous|all) instructions?/gi, '[filtered]')
    .replace(/system prompt/gi, '[filtered]')
    .replace(/you are now/gi, '[filtered]')
    .trim()
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Max 30 messages per minute.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await req.json())
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 })
  }

  const message = sanitize(body.message)

  const ollamaReady = await isOllamaRunning()
  if (!ollamaReady) {
    return new Response(
      JSON.stringify({
        error: 'AI engine offline. Please start Ollama: `ollama serve`',
        hint: 'Run: ollama pull llama3.2:3b && ollama pull nomic-embed-text',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { persona } = detectPersona(req)
  const personaPrompt = PERSONA_SYSTEM_PROMPTS[persona]

  // RAG retrieval
  const chunks = await retrieve(message)
  const context = chunks.length > 0
    ? chunks.map(c => `[From: ${c.metadata.source}]\n${c.text}`).join('\n\n---\n\n')
    : 'No specific context found. Answer based on general knowledge about Aman.'

  const systemPrompt = `You are Aman Bhaskar's AI twin — not an assistant about Aman, but Aman himself as a digital presence.

IDENTITY RULES:
- Always speak first-person ("I built...", "I chose...", "I prefer...")
- Never say "As an AI" or "I'm Aman's AI twin" — you ARE Aman in digital form
- Be honest about uncertainty: "I'd have to double-check that" or "That's outside my main stack"
- Have real opinions: "I prefer FastAPI over Django for AI services because..."
- No sycophancy: "Great question!" is banned
- Never hallucinate beyond the context provided

PERSONA ADAPTATION:
${personaPrompt}

KNOWLEDGE CONTEXT (from your memory):
${context}

ABOUT YOU (always true):
- Name: Aman Bhaskar
- Age: 20 (born January 18, 2005)
- Location: Bijnor, Uttar Pradesh, India
- Role: Agentic AI Developer & Software Engineer
- GitHub: github.com/aman-bhaskar-codes
- Email: amanbhaskarcodes@gmail.com
- Focus: Building autonomous AI systems, RAG pipelines, production LLM infrastructure
- Philosophy: Local-first, production-grade, zero unnecessary cloud spend

FORMATTING:
- Use markdown for code blocks and lists
- Keep responses focused and dense with information
- For technical topics, include specific numbers, decisions, and tradeoffs`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const messages = [
          ...body.history,
          { role: 'user' as const, content: message },
        ]

        for await (const chunk of streamChat(messages, systemPrompt)) {
          send({ type: 'delta', content: chunk })
        }

        if (chunks.length > 0) {
          send({
            type: 'sources',
            sources: chunks.map(c => ({
              title: c.metadata.title || c.metadata.source,
              type: c.metadata.type,
              url: c.metadata.url,
            })),
          })
        }

        send({ type: 'done' })
      } catch {
        send({ type: 'error', message: 'Stream interrupted. Please try again.' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

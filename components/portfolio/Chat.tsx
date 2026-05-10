'use client'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ title: string; type: string; url?: string }>
  streaming?: boolean
}

const SUGGESTIONS = [
  'Tell me about your RAG research assistant project',
  'How did you implement hybrid retrieval?',
  'What tech stack do you prefer and why?',
  'Are you open to remote work opportunities?',
]

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hey! I'm Aman's AI twin — powered by a RAG pipeline built from my actual GitHub repos and knowledge base.\n\nAsk me anything about my projects, technical decisions, availability, or how I think about building AI systems. I'll answer as Aman would.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ollamaDown, setOllamaDown] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getHistory = () =>
    messages
      .filter(m => !m.streaming)
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }))

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const assistantMsg: Message = { role: 'assistant', content: '', streaming: true }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: getHistory() }),
      })

      if (res.status === 503) {
        setOllamaDown(true)
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: '⚠️ Ollama is not running. Start it with:\n\n```bash\nollama serve\n```\n\nThen reload the page.' },
        ])
        return
      }

      if (!res.ok || !res.body) throw new Error('API error')

      setOllamaDown(false)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let sources: Message['sources'] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'delta') {
              fullContent += parsed.content
              setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: fullContent, streaming: true, sources },
              ])
            } else if (parsed.type === 'sources') {
              sources = parsed.sources
            } else if (parsed.type === 'done') {
              setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: fullContent, streaming: false, sources },
              ])
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message)
            }
          } catch {
            /* ignore parse errors from partial chunks */
          }
        }
      }
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Something went wrong. Make sure Ollama is running with `ollama serve`.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <section id="chat" className="py-24 px-6 bg-bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="text-accent-primary font-mono text-sm mb-4">04. ai twin</div>
          <h2
            className="text-4xl font-bold text-text-primary"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Ask me anything.
          </h2>
          <p className="text-text-secondary mt-3">
            Powered by a local RAG pipeline — llama3.2:3b + nomic-embed-text + my actual GitHub knowledge.
            Runs 100% locally. No API keys.
          </p>
          {ollamaDown && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
              ⚠ Ollama offline — run: <code className="text-red-300">ollama serve</code> then reload
            </div>
          )}
        </div>

        <div className="bg-bg-card rounded-2xl border border-bg-border overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-bg-border">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${ollamaDown ? 'bg-red-400' : 'bg-accent-secondary animate-pulse'}`} />
              <span className="font-mono text-xs text-text-muted">
                {ollamaDown ? 'offline' : 'llama3.2:3b · nomic-embed-text'}
              </span>
            </div>
            <span className="font-mono text-xs text-text-muted">aman&apos;s digital twin</span>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-accent-primary/15 border border-accent-primary/25 text-text-primary'
                      : 'bg-bg-secondary border border-bg-border text-text-secondary'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="chat-content text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content + (msg.streaming ? '▊' : '')}
                      </ReactMarkdown>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-bg-border/50">
                          <div className="text-xs font-mono text-text-muted mb-1">sources:</div>
                          <div className="flex flex-wrap gap-1">
                            {msg.sources.map((s, si) => (
                              <a
                                key={si}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-1.5 py-0.5 text-[10px] font-mono bg-bg-border/50 text-accent-primary rounded hover:bg-accent-primary/10 transition-colors"
                              >
                                {s.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-3">
              <div className="text-xs font-mono text-text-muted mb-2">suggested questions:</div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="px-3 py-1.5 text-xs font-mono bg-bg-border/40 text-text-secondary hover:text-text-primary hover:bg-accent-primary/10 rounded-lg border border-bg-border/40 hover:border-accent-primary/30 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-bg-border p-4">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about my projects, stack, availability..."
                rows={1}
                className="flex-1 bg-bg-secondary border border-bg-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-accent-primary/50 transition-colors"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={loading}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement
                  t.style.height = 'auto'
                  t.style.height = Math.min(t.scrollHeight, 120) + 'px'
                }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="p-3 bg-accent-primary hover:bg-accent-primary/80 disabled:bg-accent-primary/20 disabled:text-text-muted text-white rounded-xl transition-all"
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <div className="mt-2 text-xs font-mono text-text-muted">
              Enter to send · Shift+Enter for newline · 30 msg/min limit
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

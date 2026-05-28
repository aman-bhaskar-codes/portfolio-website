'use client'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

const PLACEHOLDER_PROMPTS = [
  'How did you handle the thundering herd problem?',
  'What\'s your take on RAG vs fine-tuning?',
  'Walk me through your 5-stage pipeline.',
  'Tell me about your toughest engineering challenge.',
]

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [persona, setPersona] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text: string = input) => {
    if (!text.trim() || thinking) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setThinking(true)

    // Optimistic assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const token = parsed.token || parsed.content
              const p = parsed.persona
              if (p) setPersona(p)
              if (token) {
                setMessages(prev => {
                  const msgs = [...prev]
                  const last = msgs[msgs.length - 1]
                  if (last.role === 'assistant') {
                    msgs[msgs.length - 1] = { ...last, content: last.content + token }
                  }
                  return msgs
                })
              }
            } catch {}
          }
        }
      }
    } finally {
      setThinking(false)
      setMessages(prev => {
        const msgs = [...prev]
        const last = msgs[msgs.length - 1]
        if (last?.streaming) msgs[msgs.length - 1] = { ...last, streaming: false }
        return msgs
      })
    }
  }

  return (
    <div className="chat-window" style={{
      background: 'var(--bg-surface)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 'var(--radius-2xl)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      height: 560,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-elevated)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: 'var(--green)',
            boxShadow: '0 0 8px var(--green)',
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            aman.digital_twin
          </span>
        </div>
        {persona && (
          <span style={{
            padding: '2px 10px', borderRadius: 'var(--radius-full)',
            background: 'var(--amber-muted)', border: '1px solid var(--amber-glow)',
            fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--amber)',
            letterSpacing: '0.05em',
          }}>
            {persona}
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', marginBottom: 24 }}>
              Ask me anything about Aman's work, architecture decisions, or technical depth.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              {PLACEHOLDER_PROMPTS.map(p => (
                <button key={p} onClick={() => send(p)} style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'var(--bg-overlay)',
                  color: 'var(--text-secondary)', fontSize: '0.82rem',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.15s, color 0.15s',
                  fontFamily: 'var(--font-instrument)',
                }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent-primary), var(--amber))',
                marginRight: 10, marginTop: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white',
              }}>
                AB
              </div>
            )}
            <div className="chat-markdown" style={{
              maxWidth: '75%',
              padding: '10px 14px', borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
              border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem', lineHeight: 1.65,
            }}>
              <ReactMarkdown>
                {msg.content}
              </ReactMarkdown>
              {msg.streaming && (
                <span style={{
                  display: 'inline-block', width: 2, height: 14,
                  background: 'var(--accent-primary)', marginLeft: 2, verticalAlign: 'middle',
                  animation: 'cursor-blink 0.8s step-end infinite',
                }} />
              )}
            </div>
          </div>
        ))}

        {thinking && messages[messages.length - 1]?.role !== 'assistant' && (
          <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--text-tertiary)',
                animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '12px 16px',
        display: 'flex', gap: 10, alignItems: 'flex-end',
        background: 'var(--bg-elevated)',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Ask me anything about Aman's work..."
          rows={1}
          style={{
            flex: 1, resize: 'none', background: 'transparent',
            border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontFamily: 'var(--font-instrument)',
            fontSize: '0.9rem', lineHeight: 1.5,
            padding: '6px 0',
          }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || thinking}
          style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: input.trim() && !thinking ? 'var(--accent-primary)' : 'var(--bg-overlay)',
            border: 'none', cursor: input.trim() && !thinking ? 'pointer' : 'default',
            color: 'white', fontSize: '1rem',
            transition: 'background 0.15s, transform 0.1s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          →
        </button>
      </div>

      <style>{`
        @keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes dot-bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
      `}</style>
    </div>
  )
}

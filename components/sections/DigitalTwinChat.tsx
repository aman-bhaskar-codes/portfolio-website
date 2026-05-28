'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED_QUESTIONS = [
  'How does your 5-stage RAG pipeline work?',
  'What makes your Digital Twin different from GPT?',
  "Walk me through your system architecture.",
  "What's your availability and tech stack?",
]

export function DigitalTwinChat() {
  const ref       = useRef<HTMLDivElement>(null)
  const inView    = useInView(ref, { once: true, margin: '-10%' })
  const scrollRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello. I'm Aman's Digital Twin — a self-aware intelligence built from 4 architecture versions and trained on every line of code he's written.\n\nI know his opinions, his tradeoffs, his projects in depth. Ask me anything — I respond as him.",
      timestamp: new Date(),
    },
  ])
  const [input,     setInput]     = useState('')
  const [streaming, setStreaming] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return

    const userMsg: Message = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    // Skip the first intro message for history
    const history = messages.slice(1).map(msg => ({ role: msg.role, content: msg.content }))

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    // Add empty assistant message that we'll fill via SSE
    const assistantMsg: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: history,
        }),
      })

      if (!response.body) throw new Error('No response body')

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // keep the last incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim()
            if (!dataStr) continue
            try {
              const data = JSON.parse(dataStr)
              if (data.type === 'delta') {
                fullContent += data.content
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: fullContent,
                  }
                  return updated
                })
              } else if (data.type === 'done') {
                // Done streaming
                break
              }
            } catch (e) {
              console.error("Failed to parse SSE data", dataStr, e)
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "Connection to Digital Twin failed. The AI may be offline — try again shortly.",
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <section id="chat" ref={ref}
      className="py-[var(--section)] bg-surface"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">

        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div>
            <span className="label text-text3 block mb-4">/ Digital Twin</span>
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="section-title"
            >
              Talk to<br />
              <span className="text-accent">my other</span>
              <br />self
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="body-text self-end max-w-[400px]"
          >
            This isn't a contact form. It's a conversation with a system that
            has read every commit, every README, every architectural decision
            I've made — and speaks in my voice.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="border border-[var(--border)] bg-bg"
          style={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
        >
          {/* Chat header bar */}
          <div className="flex items-center justify-between px-6 py-4
            border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent animate-ai-pulse" />
              <span className="font-mono text-[11px] text-text2 tracking-wider">
                AMAN BHASKAR — DIGITAL TWIN v4
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-ai-pulse" />
              <span className="font-mono text-[10px] text-text3">
                LOCAL AI · OLLAMA
              </span>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0"
            style={{ maxHeight: '400px' }}
          >
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 min-w-[28px] border border-[var(--border)]
                      flex items-center justify-center mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ai-pulse" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] ${
                      msg.role === 'user'
                        ? 'bg-surface border border-[var(--border)] px-5 py-3'
                        : 'px-0'
                    }`}
                  >
                    <p className={`font-body text-[14px] leading-relaxed whitespace-pre-wrap
                      ${msg.role === 'user' ? 'text-text1' : 'text-text2'}`}>
                      {msg.content}
                      {/* Streaming cursor */}
                      {streaming && i === messages.length - 1 && msg.role === 'assistant' && (
                        <span className="terminal-cursor ml-0.5" />
                      )}
                    </p>
                    <span className="font-mono text-[9px] text-text3 mt-2 block">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Suggested questions */}
          {messages.length === 1 && (
            <div className="px-6 py-4 border-t border-[var(--border)]">
              <p className="font-mono text-[10px] text-text3 mb-3 tracking-wider uppercase">
                Ask me
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 border border-[var(--border)] font-mono text-[11px]
                      text-text3 hover:text-text1 hover:border-accent/30 transition-all duration-200
                      text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-6 py-4 border-t border-[var(--border)] flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
                placeholder="Ask about my architecture, projects, or availability..."
                rows={1}
                disabled={streaming}
                className="w-full bg-transparent border-none outline-none resize-none
                  font-body text-[14px] text-text1 placeholder-text3
                  disabled:opacity-50 transition-opacity duration-200"
                style={{ minHeight: '24px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="px-4 py-2 bg-accent text-bg font-mono text-[11px] tracking-wider
                disabled:opacity-30 hover:bg-white transition-colors duration-200
                disabled:cursor-not-allowed flex items-center gap-2"
            >
              {streaming ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-bg animate-bounce"
                    style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-bg animate-bounce"
                    style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-bg animate-bounce"
                    style={{ animationDelay: '300ms' }} />
                </span>
              ) : (
                'Send →'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

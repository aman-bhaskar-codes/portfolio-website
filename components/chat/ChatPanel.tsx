"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    Copy, Check, Maximize2, Minimize2, Mic, Volume2,
    VolumeX, Sparkles, Send, X, MessageCircle
} from "lucide-react";
import { useSettingsStore } from "@/store/useSettings";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    intent?: string;
    model_used?: string;
    citations?: string[];
    latency_ms?: number;
    timestamp: number;
}

interface SSEChunk {
    token: string;
    done: boolean;
    intent?: string;
    model_used?: string;
    citations?: string[];
    latency_ms?: number;
}

// ═══════════════════════════════════════════════════════════
// MEMOIZED MARKDOWN
// ═══════════════════════════════════════════════════════════

const MemoizedMarkdown = memo(({ content }: { content: string }) => (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
));
MemoizedMarkdown.displayName = "MemoizedMarkdown";

// ═══════════════════════════════════════════════════════════
// CITATION CHIPS
// ═══════════════════════════════════════════════════════════

function CitationChips({ citations }: { citations: string[] }) {
    if (!citations || citations.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/5">
            {citations.map((src, i) => (
                <span key={i} className="citation-chip">
                    {src}
                </span>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ChatPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [currentIntent, setCurrentIntent] = useState<string>("");
    const [currentModel, setCurrentModel] = useState<string>("");
    const { voiceEnabled, setVoiceEnabled, selectedModel, setSelectedModel } = useSettingsStore();
    const scrollRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // ── Auto-scroll ──
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages, isTyping]);

    // ── Voice Input ──
    const startListening = useCallback(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };
        recognition.start();
    }, []);

    // ── TTS ──
    const speak = useCallback(
        (text: string) => {
            if (!voiceEnabled || !window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1;
            utterance.pitch = 0.95;
            window.speechSynthesis.speak(utterance);
        },
        [voiceEnabled]
    );

    // ── Copy ──
    const handleCopy = useCallback((text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    // ── Stop Generation ──
    const handleStop = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
        setIsTyping(false);
    }, []);

    // ── Send Message (SSE streaming to FastAPI) ──
    const handleSend = useCallback(async () => {
        if (!input.trim() || isTyping) return;

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: input,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);
        setCurrentIntent("");
        setCurrentModel("");

        const assistantId = `assistant-${Date.now()}`;
        const assistantMsg: ChatMessage = {
            id: assistantId,
            role: "assistant",
            content: "",
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            // Call the FastAPI SSE endpoint
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${apiUrl}/api/chat/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: input,
                    session_id: "browser-" + (localStorage.getItem("session_id") || Date.now().toString()),
                    user_id: "anonymous",
                    model_override: selectedModel || null,
                    deep_dive: false,
                }),
                signal: controller.signal,
            });

            if (!response.body) throw new Error("No response stream");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                    // SSE format: "data: {...}"
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith("data: ")) continue;

                    const jsonStr = trimmed.slice(6); // Remove "data: "
                    try {
                        const parsed: SSEChunk = JSON.parse(jsonStr);

                        // Update intent/model on first chunk
                        if (parsed.intent && !currentIntent) {
                            setCurrentIntent(parsed.intent);
                        }
                        if (parsed.model_used && !currentModel) {
                            setCurrentModel(parsed.model_used);
                        }

                        // Append token
                        if (parsed.token) {
                            fullText += parsed.token;
                            setMessages((prev) => {
                                const updated = [...prev];
                                const lastIdx = updated.length - 1;
                                if (updated[lastIdx]?.role === "assistant") {
                                    updated[lastIdx] = {
                                        ...updated[lastIdx],
                                        content: fullText,
                                        intent: parsed.intent || updated[lastIdx].intent,
                                        model_used: parsed.model_used || updated[lastIdx].model_used,
                                    };
                                }
                                return updated;
                            });
                        }

                        // Final chunk with metadata
                        if (parsed.done && parsed.latency_ms) {
                            setMessages((prev) => {
                                const updated = [...prev];
                                const lastIdx = updated.length - 1;
                                if (updated[lastIdx]?.role === "assistant") {
                                    updated[lastIdx] = {
                                        ...updated[lastIdx],
                                        latency_ms: parsed.latency_ms,
                                        citations: parsed.citations || [],
                                    };
                                }
                                return updated;
                            });
                        }
                    } catch {
                        // Non-JSON line, append as raw text
                        if (jsonStr) {
                            fullText += jsonStr;
                            setMessages((prev) => {
                                const updated = [...prev];
                                const lastIdx = updated.length - 1;
                                if (updated[lastIdx]?.role === "assistant") {
                                    updated[lastIdx] = {
                                        ...updated[lastIdx],
                                        content: fullText,
                                    };
                                }
                                return updated;
                            });
                        }
                    }
                }
            }

            if (voiceEnabled && fullText) speak(fullText);
        } catch (e: any) {
            if (e.name === "AbortError") {
                // User stopped generation
            } else {
                console.error("Chat error:", e);
                setMessages((prev) => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (updated[lastIdx]?.role === "assistant") {
                        updated[lastIdx] = {
                            ...updated[lastIdx],
                            content:
                                "**Connection issue** — Make sure the backend is running on port 8000.\n\n`docker compose up api`",
                        };
                    }
                    return updated;
                });
            }
        } finally {
            setIsTyping(false);
            abortRef.current = null;
        }
    }, [input, isTyping, selectedModel, voiceEnabled, speak, currentIntent, currentModel]);

    // ── Persist session ID ──
    useEffect(() => {
        if (!localStorage.getItem("session_id")) {
            localStorage.setItem("session_id", Date.now().toString());
        }
    }, []);

    return (
        <>
            {/* ── Floating Trigger Button ── */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 overflow-hidden ${
                    isOpen
                        ? "bg-red-500/20 text-red-400 border-red-500/20"
                        : "bg-[var(--accent-indigo)] text-white shadow-[0_0_40px_rgba(99,102,241,0.3)] border-[var(--accent-indigo)]/20"
                } border backdrop-blur-xl float-bubble`}
                id="chat-trigger-button"
            >
                {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-6 h-6" />}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop for fullscreen */}
                        {isFullscreen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[80] bg-[#0B0B0F]/80 backdrop-blur-2xl"
                            />
                        )}

                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                ...(isFullscreen
                                    ? {
                                          bottom: "0px",
                                          right: "0px",
                                          width: "100vw",
                                          height: "100dvh",
                                          borderRadius: "0px",
                                      }
                                    : {
                                          bottom: "90px",
                                          right: "24px",
                                          width: "min(440px, calc(100vw - 48px))",
                                          height: "min(680px, calc(100vh - 130px))",
                                      }),
                            }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed z-[90] glass-panel rounded-[28px] overflow-hidden flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/5 bg-white/[0.02]"
                            id="chat-panel"
                        >
                            {/* ── Header ── */}
                            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[var(--accent-indigo)]/10 flex items-center justify-center border border-[var(--accent-indigo)]/20">
                                        <Sparkles className="w-4 h-4 text-[var(--accent-indigo)] animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold tracking-tight text-white/90">
                                            Portfolio Agent
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="status-online" />
                                            <p className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest">
                                                {currentIntent
                                                    ? `${currentIntent} · ${currentModel}`
                                                    : "LangGraph · Active"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-1.5 items-center">
                                    {/* Model Selector */}
                                    <select
                                        title="Select Model"
                                        aria-label="Select AI Model"
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="bg-white/5 text-white/80 border border-white/5 hover:border-white/20 rounded-lg px-2 h-8 text-[10px] font-mono outline-none cursor-pointer hidden md:block"
                                        id="model-selector"
                                    >
                                        <option value="llama3.2:3b" className="bg-[#0B0B0F]">Llama 3.2</option>
                                        <option value="qwen2.5:3b" className="bg-[#0B0B0F]">Qwen 2.5</option>
                                        <option value="phi4-mini" className="bg-[#0B0B0F]">Phi-4 Mini</option>
                                    </select>

                                    <button
                                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border text-xs ${
                                            voiceEnabled
                                                ? "bg-[var(--accent-indigo)] text-white border-[var(--accent-indigo)]"
                                                : "bg-white/5 text-white/40 border-white/5 hover:border-white/20"
                                        }`}
                                        id="voice-toggle"
                                    >
                                        {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                    </button>
                                    <button
                                        onClick={() => setIsFullscreen(!isFullscreen)}
                                        className="w-8 h-8 rounded-lg bg-white/5 text-white/40 flex items-center justify-center border border-white/5 hover:border-white/20 transition-all"
                                        id="fullscreen-toggle"
                                    >
                                        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* ── Message Stream ── */}
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth custom-scrollbar"
                            >
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="p-5 rounded-full bg-white/[0.02] border border-white/5">
                                            <MessageCircle className="w-10 h-10 text-white/10" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-neutral-400 font-light">
                                                Ask me anything about Aman
                                            </p>
                                            <p className="text-[10px] text-neutral-600 font-mono">
                                                Projects · Skills · Experience · GitHub
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <AnimatePresence initial={false}>
                                    {messages.map((m) => (
                                        <motion.div
                                            key={m.id}
                                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`relative group p-4 rounded-[20px] ${
                                                    m.role === "user"
                                                        ? "bg-[var(--accent-indigo)] text-white font-medium shadow-[0_12px_30px_-10px_rgba(99,102,241,0.3)]"
                                                        : "bg-white/[0.03] border border-white/5 backdrop-blur-xl"
                                                } ${isFullscreen ? "max-w-3xl" : "max-w-[85%]"}`}
                                            >
                                                <div
                                                    className={`text-sm leading-relaxed prose prose-invert max-w-none ${
                                                        m.role === "user" ? "text-white" : "text-neutral-300"
                                                    }`}
                                                >
                                                    {m.role === "user" ? (
                                                        <p className="whitespace-pre-wrap">{m.content}</p>
                                                    ) : (
                                                        <MemoizedMarkdown content={m.content || ""} />
                                                    )}
                                                </div>

                                                {/* Citation Chips */}
                                                {m.role === "assistant" && m.citations && (
                                                    <CitationChips citations={m.citations} />
                                                )}

                                                {/* Metadata footer */}
                                                {m.role === "assistant" && m.latency_ms && (
                                                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
                                                        <span className="text-[9px] font-mono text-neutral-600">
                                                            {m.latency_ms}ms
                                                        </span>
                                                        {m.model_used && (
                                                            <span className="text-[9px] font-mono text-neutral-600">
                                                                {m.model_used}
                                                            </span>
                                                        )}
                                                        {m.intent && (
                                                            <span className="text-[9px] font-mono text-[var(--accent-emerald)]">
                                                                {m.intent}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Copy button */}
                                                {m.role === "assistant" && m.content && (
                                                    <button
                                                        onClick={() => handleCopy(m.content, m.id)}
                                                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10"
                                                    >
                                                        {copiedId === m.id ? (
                                                            <Check size={12} className="text-[var(--accent-emerald)]" />
                                                        ) : (
                                                            <Copy size={12} className="text-white/40" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Typing indicator */}
                                {isTyping && !messages[messages.length - 1]?.content && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl flex gap-2 items-center">
                                            <div className="typing-dot" />
                                            <div className="typing-dot" />
                                            <div className="typing-dot" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Input ── */}
                            <div className="p-4 bg-white/[0.01] border-t border-white/5">
                                <div className="flex gap-2 items-center bg-black/40 border border-white/10 rounded-2xl p-1.5 pr-3 focus-within:border-[var(--accent-indigo)]/50 focus-within:ring-2 focus-within:ring-[var(--accent-indigo)]/10 transition-all duration-500">
                                    <input
                                        className="flex-1 bg-transparent border-none px-3 py-2.5 text-sm focus:outline-none placeholder:text-neutral-700 font-mono text-white"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                                        placeholder="Ask anything..."
                                        id="chat-input"
                                    />

                                    <div className="flex items-center gap-1">
                                        {isTyping && (
                                            <button
                                                onClick={handleStop}
                                                className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-all"
                                                title="Stop generation"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                        <button
                                            title="Voice Input"
                                            aria-label="Start voice input"
                                            onClick={startListening}
                                            className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
                                                isListening
                                                    ? "bg-red-500 text-white animate-pulse"
                                                    : "text-neutral-500 hover:text-white"
                                            }`}
                                            id="voice-input-button"
                                        >
                                            <Mic size={14} />
                                        </button>
                                        <button
                                            title="Send"
                                            aria-label="Send message"
                                            onClick={handleSend}
                                            disabled={!input.trim() || isTyping}
                                            className="w-8 h-8 rounded-lg bg-[var(--accent-indigo)] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-20 disabled:scale-100"
                                            id="send-button"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

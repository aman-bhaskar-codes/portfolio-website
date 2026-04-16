"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Loader2 } from "lucide-react";
import VoiceToggle from "./VoiceToggle";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function ChatInput({
    messages,
    setMessages,
    voiceEnabled,
    onToggleVoice,
}: {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    voiceEnabled: boolean;
    onToggleVoice: () => void;
}) {
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + "px";
        }
    }, [input]);

    async function send() {
        if (!input.trim() || isStreaming) return;

        const userMessage = input.trim();
        setInput("");
        setIsStreaming(true);

        // Add user message + "Thinking..." placeholder for instant perceived response
        const newMessages: Message[] = [
            ...messages,
            { role: "user", content: userMessage },
            { role: "assistant", content: "✦ Thinking..." },
        ];
        setMessages(newMessages);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: userMessage }),
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No stream reader");

            const decoder = new TextDecoder();
            let fullText = "";
            let buffer = "";
            let firstChunkReceived = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parse Ollama NDJSON chunks
                const lines = buffer.split("\n");
                buffer = lines.pop() || ""; // keep incomplete line

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const json = JSON.parse(line);
                        if (json.message?.content) {
                            if (!firstChunkReceived) {
                                firstChunkReceived = true;
                                fullText = ""; // Clear "Thinking..." on first real token
                            }
                            fullText += json.message.content;
                        }
                    } catch {
                        // If not valid JSON, treat as raw text
                        if (!firstChunkReceived) {
                            firstChunkReceived = true;
                            fullText = "";
                        }
                        fullText += line;
                    }
                }

                // Update the last message
                setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: fullText };
                    return updated;
                });
            }

            // Speak the response if voice is enabled
            if (voiceEnabled && fullText) {
                speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(fullText);
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                speechSynthesis.speak(utterance);
            }
        } catch (err: any) {
            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: "assistant",
                    content: `⚠️ Error: ${err.message}. Make sure Ollama is running.`,
                };
                return updated;
            });
        } finally {
            setIsStreaming(false);
        }
    }

    function toggleMic() {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        try {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) return;

            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = "en-US";

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };

            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);

            recognitionRef.current = recognition;
            recognition.start();
            setIsListening(true);
        } catch {
            // Speech recognition not supported
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    }

    return (
        <div className="border-t border-white/5 p-4 md:p-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-end gap-3">
                    {/* Voice toggles */}
                    <div className="hidden sm:flex flex-col gap-2 pb-1">
                        <VoiceToggle enabled={voiceEnabled} onToggle={onToggleVoice} />
                        <button
                            onClick={toggleMic}
                            className={`p-2.5 rounded-xl border transition-all ${isListening
                                ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
                                : "bg-white/5 border-white/10 text-neutral-500 hover:text-white"
                                }`}
                            title={isListening ? "Stop listening" : "Voice input"}
                        >
                            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                    </div>

                    {/* Input area */}
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isStreaming}
                            rows={1}
                            placeholder="Ask about projects, architecture, or anything..."
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 pr-14 text-sm text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-accent/30 transition-colors disabled:opacity-50"
                        />
                        <button
                            onClick={send}
                            disabled={isStreaming || !input.trim()}
                            className="absolute right-3 bottom-3 p-2 rounded-xl bg-accent text-black hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            {isStreaming ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Send size={16} />
                            )}
                        </button>
                    </div>
                </div>

                <p className="text-[10px] font-mono text-neutral-700 text-center mt-3 tracking-wider">
                    RAG-BACKED · LOCAL INFERENCE · ANTI-HALLUCINATION
                </p>
            </div>
        </div>
    );
}

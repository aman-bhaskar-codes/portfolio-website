"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import VoicePlayer from "./VoicePlayer";
import StopButton from "./StopButton";
import { motion } from "framer-motion";

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    voiceSrc?: string;
};

export default function ChatSimulator() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hi, I am Aman Bhaskar's AI. I have access to his portfolio architecture, GitHub projects, and system identity. How can I help you today?"
        }
    ]);
    const [mode, setMode] = useState<"twin" | "assistant">("assistant");
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (text: string) => {
        // 1. Add user message
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        // 2. Add empty assistant placeholder
        const assistantId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

        try {
            // 3. Initiate Streaming Fetch to actual FastAPI backend
            const res = await fetch("http://localhost:8000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: text,
                    mode: mode,
                    history: messages.map(m => `${m.role}: ${m.content}`).join("\n")
                })
            });

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            let streamBuffer = "";

            // 4. Stream loop using delimiter-based JSON chunks
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const textChunks = decoder.decode(value, { stream: true });
                const lines = textChunks.split("\n");

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);

                        if (data.chunk) {
                            streamBuffer += data.chunk;
                            setMessages(prev =>
                                prev.map(m => m.id === assistantId ? { ...m, content: streamBuffer } : m)
                            );
                        }

                        if (data.voice) {
                            setMessages(prev =>
                                prev.map(m => m.id === assistantId ? { ...m, voiceSrc: `http://localhost:8000${data.voice}` } : m)
                            );
                        }
                    } catch (e) {
                        // Incomplete chunk due to network fragmentation
                    }
                }
            }
        } catch (e) {
            console.error(e);
            setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: "⚠️ Connection error to RAG backend." } : m)
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-screen bg-[#0a0a0a] overflow-hidden text-base">
            <div className="flex-1 overflow-y-auto no-scrollbar pt-20 pb-4">
                {messages.map((m) => (
                    <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChatMessage role={m.role} content={m.content} mode={mode} />
                        {m.voiceSrc && <VoicePlayer src={m.voiceSrc} onStop={() => {
                            fetch("http://localhost:8000/api/chat/stop", { method: "POST" });
                        }} />}
                    </motion.div>
                ))}
                <div ref={bottomRef} className="h-4" />
            </div>

            {isLoading && (
                <StopButton onClick={() => {
                    fetch("http://localhost:8000/api/chat/stop", { method: "POST" });
                    setIsLoading(false);
                }} />
            )}

            <div className="w-full bg-gradient-to-t from-[#0a0a0a] to-transparent pt-6">
                <ChatInput
                    onSend={handleSend}
                    isLoading={isLoading}
                    mode={mode}
                    onModeToggle={setMode}
                />
            </div>
        </div>
    );
}

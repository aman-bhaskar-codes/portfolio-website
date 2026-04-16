"use client";

import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function MessageList({ messages }: { messages: Message[] }) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const isThinking = (msg: Message) =>
        msg.role === "assistant" && msg.content === "✦ Thinking...";

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8">
            <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg, i) => {
                    const prevUser = msg.role === "assistant"
                        ? messages.slice(0, i).reverse().find((m) => m.role === "user")?.content
                        : undefined;

                    if (isThinking(msg)) {
                        return (
                            <div key={i} className="flex items-start gap-3 animate-fade-in">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shrink-0">
                                    <span className="text-white text-xs">✦</span>
                                </div>
                                <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/5">
                                    <span className="thinking-dots">
                                        <span className="dot" />
                                        <span className="dot" />
                                        <span className="dot" />
                                    </span>
                                    <span className="text-neutral-500 text-sm ml-2">Reasoning...</span>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={i} className="animate-fade-in">
                            <MessageBubble message={msg} previousUserMessage={prevUser} />
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
                .thinking-dots {
                    display: inline-flex;
                    gap: 4px;
                    align-items: center;
                }
                .thinking-dots .dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--accent, #a855f7);
                    animation: pulse 1.4s infinite ease-in-out;
                }
                .thinking-dots .dot:nth-child(2) {
                    animation-delay: 0.2s;
                }
                .thinking-dots .dot:nth-child(3) {
                    animation-delay: 0.4s;
                }
                @keyframes pulse {
                    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                    40% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
}

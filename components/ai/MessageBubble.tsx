"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export default function MessageBubble({ message, previousUserMessage }: { message: Message; previousUserMessage?: string }) {
    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState<null | 1 | -1>(null);
    const isAI = message.role === "assistant";

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const sendFeedback = async (rating: 1 | -1) => {
        setFeedback(rating);
        try {
            await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: previousUserMessage || "",
                    response: message.content.substring(0, 2000),
                    rating,
                }),
            });
        } catch { /* silent */ }
    };

    return (
        <div className={`flex gap-4 ${isAI ? "" : "flex-row-reverse"}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${isAI
                ? "bg-accent/10 text-accent"
                : "bg-white/10 text-white"
                }`}>
                {isAI ? <Bot size={16} /> : <User size={16} />}
            </div>

            {/* Bubble */}
            <div className={`relative group max-w-[75%] min-w-0 ${isAI ? "" : "text-right"
                }`}>
                <div className={`p-5 rounded-2xl text-sm leading-relaxed ${isAI
                    ? "bg-white/[0.03] border border-white/5 text-neutral-300"
                    : "bg-accent/15 border border-accent/20 text-white"
                    }`}>
                    {isAI ? (
                        <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-li:my-0.5 prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl prose-code:text-accent prose-code:text-xs">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content || "●"}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <p>{message.content}</p>
                    )}
                </div>

                {/* Action buttons for AI responses */}
                {isAI && message.content && (
                    <div className="absolute -bottom-3 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => copyToClipboard(message.content)}
                            className="p-1.5 rounded-lg bg-neutral-900 border border-white/10 text-neutral-500 hover:text-white"
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                        {feedback === null ? (
                            <>
                                <button
                                    onClick={() => sendFeedback(1)}
                                    className="p-1.5 rounded-lg bg-neutral-900 border border-white/10 text-neutral-500 hover:text-emerald-400"
                                >
                                    <ThumbsUp size={12} />
                                </button>
                                <button
                                    onClick={() => sendFeedback(-1)}
                                    className="p-1.5 rounded-lg bg-neutral-900 border border-white/10 text-neutral-500 hover:text-red-400"
                                >
                                    <ThumbsDown size={12} />
                                </button>
                            </>
                        ) : (
                            <span className="p-1.5 rounded-lg bg-neutral-900 border border-white/10 text-accent text-[10px]">
                                {feedback === 1 ? "👍" : "👎"}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}


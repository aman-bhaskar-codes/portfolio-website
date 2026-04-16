"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Sparkles } from "lucide-react";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import MemoryIndicator from "./MemoryIndicator";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const INITIAL_MESSAGE: Message = {
    role: "assistant",
    content:
        "Hello. I'm Aman's AI assistant, powered by a local RAG pipeline.\n\nI can answer questions about **projects**, **architecture decisions**, **technical philosophy**, and **professional background**.\n\nWhat would you like to know?",
};

const SUGGESTED_PROMPTS = [
    "What is Aman's RAG architecture?",
    "Tell me about the GitHub sync system",
    "What technologies does Aman use?",
    "Explain the voice agent design",
];

export default function ChatLayout() {
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [voiceEnabled, setVoiceEnabled] = useState(false);

    const clearConversation = () => {
        setMessages([INITIAL_MESSAGE]);
        speechSynthesis.cancel();
    };

    const handleSuggestedPrompt = (prompt: string) => {
        // Simulate typing the prompt
        const fakeInput = document.querySelector("textarea") as HTMLTextAreaElement;
        if (fakeInput) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype, "value"
            )?.set;
            nativeInputValueSetter?.call(fakeInput, prompt);
            fakeInput.dispatchEvent(new Event("input", { bubbles: true }));
            // Focus the input
            fakeInput.focus();
        }
    };

    return (
        <div className="h-full flex flex-col bg-bg-base text-white">
            {/* Header */}
            <header className="shrink-0 px-6 py-4 border-b border-white/5 flex items-center justify-between glass-panel">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
                            <Sparkles size={14} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold">AI Assistant</h1>
                            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                                RAG v4.0 · Online
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <MemoryIndicator messageCount={messages.length} />
                    <button
                        onClick={clearConversation}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 transition-colors text-neutral-500"
                        title="Clear conversation"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </header>

            {/* Messages — with AI-reactive glow */}
            <div className={messages.length > 1 && messages[messages.length - 1]?.content?.length < 20 ? "ai-pulse rounded-3xl mx-2 flex-1 flex flex-col" : "flex-1 flex flex-col"}>
                <MessageList messages={messages} />

                {/* Suggested prompts — only show when single initial message */}
                {messages.length === 1 && (
                    <div className="px-6 pb-4">
                        <div className="max-w-3xl mx-auto">
                            <div className="flex flex-wrap gap-2 justify-center">
                                {SUGGESTED_PROMPTS.map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => handleSuggestedPrompt(prompt)}
                                        className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-xs text-neutral-400 hover:text-white hover:border-accent/30 transition-all"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <ChatInput
                messages={messages}
                setMessages={setMessages}
                voiceEnabled={voiceEnabled}
                onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
            />
        </div>
    );
}

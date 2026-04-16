"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Mic } from "lucide-react";

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
    mode: "twin" | "assistant";
    onModeToggle: (mode: "twin" | "assistant") => void;
}

export function ChatInput({ onSend, isLoading, mode, onModeToggle }: ChatInputProps) {
    const [input, setInput] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSend(input);
        setInput("");
    };

    return (
        <div className="w-full max-w-3xl mx-auto px-4 pb-8 relative">
            <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                    <button
                        onClick={() => onModeToggle("assistant")}
                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${mode === "assistant"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "text-white/50 hover:text-white/80"
                            }`}
                    >
                        Assistant
                    </button>
                    <button
                        onClick={() => onModeToggle("twin")}
                        className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all flex items-center gap-1 ${mode === "twin"
                                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                                : "text-white/50 hover:text-white/80"
                            }`}
                    >
                        Twin
                    </button>
                </div>

                {/* Mock voice toggle for Phase 8 aesthetic mapping */}
                <button className="text-white/40 hover:text-white/80 transition-colors p-2 rounded-full hover:bg-white/5">
                    <Mic size={16} />
                </button>
            </div>

            <form
                onSubmit={handleSubmit}
                className="relative flex items-end bg-black/40 border border-white/10 rounded-2xl shadow-2xl overflow-hidden focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/20 transition-all"
            >
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                    placeholder={`Message ${mode === "twin" ? "Digital Twin" : "Assistant"}...`}
                    className="w-full max-h-[200px] min-h-[56px] py-4 pl-4 pr-12 bg-transparent text-white/90 placeholder:text-white/30 resize-none outline-none focus:ring-0 leading-relaxed"
                    rows={1}
                />

                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={`absolute right-3 bottom-3 p-2 rounded-xl flex items-center justify-center transition-all ${input.trim() && !isLoading
                            ? mode === "twin" ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"
                            : "bg-white/5 text-white/20"
                        }`}
                >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
                </button>
            </form>

            <p className="text-center text-[10px] text-white/30 mt-3 font-mono">
                RAG 2.0 Engine • Qwen2.5:3b • pgvector
            </p>
        </div>
    );
}

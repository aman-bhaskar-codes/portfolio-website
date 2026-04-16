import { cn } from "@/lib/utils";
import { User, Bot, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
    role: "user" | "assistant";
    content: string;
    mode?: "twin" | "assistant";
}

export function ChatMessage({ role, content, mode = "assistant" }: ChatMessageProps) {
    const isUser = role === "user";

    return (
        <div className={cn(
            "w-full px-4 py-8 flex justify-center",
            isUser ? "bg-black/20" : "bg-black/40 border-b border-t border-white/5"
        )}>
            <div className="w-full max-w-3xl flex gap-6">
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg",
                    isUser
                        ? "bg-white/10 text-white border border-white/20"
                        : mode === "twin"
                            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                            : "bg-gradient-to-br from-emerald-500 to-cyan-600 text-white"
                )}>
                    {isUser ? <User size={16} /> : mode === "twin" ? <Zap size={16} /> : <Bot size={16} />}
                </div>

                <div className="prose prose-invert max-w-none text-white/80 w-full mt-1">
                    {content === "" ? (
                        <span className="animate-pulse flex h-3 w-3 rounded-full bg-white/30" />
                    ) : (
                        <div className="leading-relaxed">
                            <ReactMarkdown>
                                {content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

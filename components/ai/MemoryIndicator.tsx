"use client";

import { Brain } from "lucide-react";

export default function MemoryIndicator({ messageCount }: { messageCount: number }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
            <Brain size={12} className="text-accent" />
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                {messageCount} msgs in context
            </span>
        </div>
    );
}

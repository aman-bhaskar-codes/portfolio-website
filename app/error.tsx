"use client";

import { useEffect } from "react";
import { Terminal } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the structural error cleanly without burning the UI state
        console.error("[CRITICAL SYSTEM FAULT]:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center p-6 text-white font-sans">
            <div className="glass-panel max-w-lg w-full p-12 rounded-[32px] border border-red-500/20 shadow-[0_0_80px_rgba(239,68,68,0.15)] text-center space-y-8">
                <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                    <Terminal className="text-red-500" size={32} />
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-bold tracking-tight">COGNITIVE_FAULT_DETECTED</h2>
                    <p className="text-sm text-neutral-400 max-w-xs mx-auto">
                        An unhandled exception occurred within the visualization layer. The system has automatically halted the affected thread.
                    </p>
                </div>

                <div className="p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-red-400 text-left overflow-hidden">
                    {error.message || "Unknown Runtime Exception"}
                    {error.digest && <div className="mt-2 text-neutral-600">Digest: {error.digest}</div>}
                </div>

                <button
                    onClick={() => reset()}
                    className="w-full py-4 bg-white text-black font-bold text-sm tracking-wide rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    INITIATE_REBOOT_SEQUENCE
                </button>
            </div>
        </div>
    );
}

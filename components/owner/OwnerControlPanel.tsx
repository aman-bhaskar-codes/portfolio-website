"use client";

import { Activity, Database, GitBranch, ShieldAlert } from "lucide-react";
import { useState } from "react";

export default function OwnerControlPanel() {
    const [status, setStatus] = useState<string | null>(null);

    const triggerAction = async (action: string) => {
        setStatus(`Running ${action}...`);

        // Mocking API call for visuals
        setTimeout(() => setStatus(null), 1500);

        if (action === "sync_github") {
            try {
                await fetch("/api/github/sync", { method: "POST" });
            } catch (e) { }
        }
    };

    return (
        <div className="p-8 bg-red-950/10 border border-red-500/30 rounded-xl relative overflow-hidden group">
            {/* Visual scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(255,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />

            <h2 className="text-xl font-light tracking-wide text-red-500 flex items-center gap-3 mb-6 relative z-10">
                <ShieldAlert size={20} />
                Owner Cognitive Controls
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                <ControlOption
                    icon={<Activity size={16} />}
                    label="Run Offline Eval"
                    onClick={() => triggerAction("eval")}
                    disabled={!!status}
                />
                <ControlOption
                    icon={<GitBranch size={16} />}
                    label="Trigger GitHub Sync"
                    onClick={() => triggerAction("sync_github")}
                    disabled={!!status}
                />
                <ControlOption
                    icon={<Database size={16} />}
                    label="Snapshot System"
                    onClick={() => triggerAction("snapshot")}
                    disabled={!!status}
                />
                <ControlOption
                    icon={<ShieldAlert size={16} />}
                    label="Toggle Autonomy"
                    onClick={() => triggerAction("autonomy")}
                    disabled={!!status}
                />
            </div>

            {status && (
                <div className="absolute top-8 right-8 text-xs font-mono uppercase tracking-widest text-red-500 animate-pulse">
                    {status}
                </div>
            )}
        </div>
    );
}

function ControlOption({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void, disabled: boolean }) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 text-red-400 p-4 rounded-lg transition-all disabled:opacity-50 h-24 text-sm"
        >
            {icon}
            <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
        </button>
    );
}

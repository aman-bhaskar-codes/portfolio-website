"use client";

import { Volume2, VolumeX } from "lucide-react";

export default function VoiceToggle({
    enabled,
    onToggle,
}: {
    enabled: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            onClick={onToggle}
            title={enabled ? "Mute voice output" : "Enable voice output"}
            className={`p-2.5 rounded-xl border transition-all ${enabled
                    ? "bg-accent/10 border-accent/30 text-accent"
                    : "bg-white/5 border-white/10 text-neutral-500 hover:text-white"
                }`}
        >
            {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
    );
}

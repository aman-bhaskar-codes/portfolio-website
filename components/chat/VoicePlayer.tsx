import { Volume2, VolumeX } from "lucide-react";

export default function VoicePlayer({ src, onStop }: { src: string, onStop?: () => void }) {
    if (!src) return null;

    return (
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 pl-4 pr-2 rounded-full mb-4 animate-in fade-in slide-in-from-bottom-2 mx-auto max-w-sm">
            <div className="flex items-center gap-2 flex-1">
                <Volume2 size={14} className="text-emerald-400" />
                <span className="text-xs font-mono text-white/70">Audio Response Generated</span>
            </div>
            <button
                onClick={onStop}
                className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                title="Stop Audio"
            >
                <VolumeX size={14} />
            </button>
            <audio src={src} autoPlay className="hidden" />
        </div>
    );
}

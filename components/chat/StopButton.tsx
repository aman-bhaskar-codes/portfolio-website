import { Square } from "lucide-react";

export default function StopButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-700 text-white/80 hover:bg-white hover:text-black hover:border-white px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2"
        >
            <Square size={12} className="fill-current" /> Stop generating
        </button>
    );
}

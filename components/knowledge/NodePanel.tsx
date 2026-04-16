"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Tag } from "lucide-react";

interface NodeData {
    id: string;
    label: string;
    type: string;
    description?: string;
    tags?: string[];
    meta?: Record<string, any>;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    core: { label: "AI Core", color: "text-purple-400" },
    system: { label: "System", color: "text-indigo-400" },
    project: { label: "Project", color: "text-cyan-400" },
    research: { label: "Research", color: "text-emerald-400" },
};

export default function NodePanel({
    node,
    onClose,
}: {
    node: NodeData | null;
    onClose: () => void;
}) {
    const typeInfo = node ? TYPE_LABELS[node.type] || TYPE_LABELS.system : null;

    return (
        <AnimatePresence>
            {node && (
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.3 }}
                    className="absolute top-6 right-6 z-20 w-80 max-h-[80vh] overflow-y-auto rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-2xl"
                >
                    <div className="p-6 space-y-5">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                                <span className={`text-[10px] font-mono uppercase tracking-widest ${typeInfo?.color}`}>
                                    {typeInfo?.label}
                                </span>
                                <h3 className="text-base font-bold text-white leading-tight truncate">
                                    {node.label}
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                            >
                                <X size={14} className="text-neutral-400" />
                            </button>
                        </div>

                        {/* Description */}
                        {node.description && (
                            <p className="text-sm text-neutral-400 leading-relaxed">
                                {node.description}
                            </p>
                        )}

                        {/* Tags */}
                        {node.tags && node.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {node.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2.5 py-1 text-[10px] font-mono rounded-lg bg-white/5 text-neutral-500"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Links */}
                        {node.meta?.url && (
                            <a
                                href={node.meta.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-xs text-accent hover:underline"
                            >
                                <ExternalLink size={12} />
                                View on GitHub
                            </a>
                        )}

                        {node.meta?.slug && (
                            <a
                                href={`/research/${node.meta.slug}`}
                                className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:underline"
                            >
                                <ExternalLink size={12} />
                                Read Article
                            </a>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

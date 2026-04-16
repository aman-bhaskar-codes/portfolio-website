"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertTriangle, Lightbulb, Zap, Check } from "lucide-react";

export default function CopilotPanel({ suggestions, onApplyTitle, onAddTech }: any) {
    if (!suggestions) return null;

    // Only show if there's actual feedback
    const hasFeedback = suggestions.clarity || suggestions.missing_sections || suggestions.suggested_title || suggestions.tech_stack_suggestion?.length > 0;

    if (!hasFeedback) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full md:w-1/3 bg-[#151520] p-6 rounded-3xl border border-violet-500/20 space-y-6 h-fit sticky top-6"
            >
                <div className="flex items-center gap-2 text-violet-400 mb-2">
                    <Sparkles size={18} className="animate-pulse" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">AI Co-Pilot</h3>
                </div>

                {suggestions.suggested_title && (
                    <div className="bg-violet-900/20 p-4 rounded-xl border border-violet-500/20">
                        <div className="flex items-center gap-2 text-violet-300 mb-2">
                            <Lightbulb size={16} />
                            <span className="text-xs font-bold uppercase">Better Title?</span>
                        </div>
                        <p className="text-white font-bold mb-3">{suggestions.suggested_title}</p>
                        <button
                            onClick={() => onApplyTitle(suggestions.suggested_title)}
                            className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-1 w-full justify-center"
                        >
                            <Check size={12} /> Apply Suggestion
                        </button>
                    </div>
                )}

                {suggestions.clarity && (
                    <div>
                        <div className="flex items-center gap-2 text-yellow-500 mb-1">
                            <AlertTriangle size={14} />
                            <span className="text-xs font-bold uppercase">Clarity</span>
                        </div>
                        <p className="text-neutral-400 text-sm leading-relaxed">{suggestions.clarity}</p>
                    </div>
                )}

                {suggestions.missing_sections && (
                    <div>
                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                            <Zap size={14} />
                            <span className="text-xs font-bold uppercase">Missing</span>
                        </div>
                        <p className="text-neutral-400 text-sm leading-relaxed">{suggestions.missing_sections}</p>
                    </div>
                )}

                {suggestions.tech_stack_suggestion?.length > 0 && (
                    <div>
                        <span className="text-xs font-bold uppercase text-neutral-500 mb-2 block">Tech Suggestions</span>
                        <div className="flex flex-wrap gap-2">
                            {suggestions.tech_stack_suggestion.map((tech: string) => (
                                <button
                                    key={tech}
                                    onClick={() => onAddTech(tech)}
                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs text-neutral-300 hover:text-white transition-colors"
                                >
                                    + {tech}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {suggestions.seo_tip && (
                    <div className="pt-4 border-t border-white/5">
                        <span className="text-[10px] font-bold uppercase text-green-500/70 block mb-1">SEO Tip</span>
                        <p className="text-neutral-500 text-xs italic">"{suggestions.seo_tip}"</p>
                    </div>
                )}

            </motion.div>
        </AnimatePresence>
    );
}

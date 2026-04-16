"use client";
import { ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useEffect, useState, useMemo } from "react";
import debounce from "lodash.debounce";
import CopilotPanel from "./CopilotPanel";

export default function StepReview({ setStep, projectData, setProjectData }: any) {
    const [suggestions, setSuggestions] = useState<any>(null);

    const handleChange = (field: string, value: any) => {
        setProjectData((prev: any) => ({ ...prev, [field]: value }));
    };

    // Debounced Copilot
    const debouncedCheck = useMemo(
        () =>
            debounce(async (content: string) => {
                if (!content || content.length < 50) return;
                try {
                    const res = await fetch("/api/projects/copilot", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ content })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setSuggestions(data);
                    }
                } catch (e) {
                    console.error(e);
                }
            }, 2000), // 2s debounce
        []
    );

    useEffect(() => {
        debouncedCheck(projectData.content);
        return () => { debouncedCheck.cancel(); }
    }, [projectData.content, debouncedCheck]);

    const handleApplyTitle = (newTitle: string) => {
        handleChange("name", newTitle);
    };

    const handleAddTech = (tech: string) => {
        if (!projectData.tags?.includes(tech)) {
            const newTags = [...(projectData.tags || []), tech];
            handleChange("tags", newTags);
        }
    };

    return (
        <div className="flex flex-col gap-6 h-[85vh]">
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Editor (Left) */}
                <div className="w-1/2 flex flex-col gap-6 bg-[#0a0a0f]/90 p-6 rounded-3xl border border-white/10 overflow-y-auto">
                    <h3 className="text-xl font-bold text-white mb-2">Refine Details</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold">Title</label>
                            <input
                                value={projectData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-violet-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold">Summary</label>
                            <textarea
                                value={projectData.description || ""}
                                onChange={(e) => handleChange("description", e.target.value)}
                                rows={3}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-neutral-300 text-sm focus:border-violet-500 focus:outline-none resize-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold">Tech Stack (Comma sep)</label>
                            <input
                                value={projectData.tags?.join(", ")}
                                onChange={(e) => handleChange("tags", e.target.value.split(",").map((t: string) => t.trim()))}
                                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-violet-300 text-sm focus:border-violet-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs uppercase tracking-wider text-neutral-500 font-bold mb-2 block">Content (Markdown)</label>
                            <textarea
                                value={projectData.content || ""}
                                onChange={(e) => handleChange("content", e.target.value)}
                                className="w-full h-[300px] p-4 bg-white/5 border border-white/10 rounded-xl text-neutral-300 font-mono text-sm focus:border-violet-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Live Preview + Copilot (Right) */}
                <div className="w-1/2 flex flex-col gap-4 overflow-y-auto">

                    {/* Copilot Panel (Sticky) */}
                    <CopilotPanel suggestions={suggestions} onApplyTitle={handleApplyTitle} onAddTech={handleAddTech} />

                    {/* Preview */}
                    <div className="bg-white rounded-3xl p-8 text-black relative flex-1 min-h-[500px]">
                        <div className="absolute top-4 right-4 bg-black/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Live Preview</div>

                        <h1 className="text-4xl font-bold mb-4">{projectData.name || "Untitled Project"}</h1>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {projectData.tags?.map((tag: string, i: number) => (
                                <span key={i} className="px-3 py-1 bg-black/5 rounded-full text-xs font-medium text-neutral-600">{tag}</span>
                            ))}
                        </div>

                        <p className="text-lg text-neutral-600 mb-8 leading-relaxed max-w-2xl">{projectData.description}</p>

                        <div className="prose prose-neutral max-w-none">
                            <ReactMarkdown>{projectData.content}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Nav */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#151520] border border-white/10 p-2 rounded-2xl flex gap-2 shadow-2xl z-50">
                <button onClick={() => setStep(0)} className="px-6 py-3 text-neutral-400 hover:text-white font-medium flex items-center gap-2">
                    Cancel
                </button>
                <button onClick={() => setStep(3)} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors flex items-center gap-2">
                    Media Upload <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}

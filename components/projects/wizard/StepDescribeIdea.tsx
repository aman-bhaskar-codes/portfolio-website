"use client";
import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

export default function StepDescribeIdea({ setStep, setProjectData }: any) {
    const [idea, setIdea] = useState("");
    const [loading, setLoading] = useState(false);

    async function generate() {
        if (!idea) return;
        setLoading(true);

        try {
            const res = await fetch("/api/projects/ai-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idea })
            });

            if (!res.ok) throw new Error("Generation failed");

            const data = await res.json();

            // Map structured data to our project schema
            setProjectData((prev: any) => ({
                ...prev,
                name: data.title,
                description: data.summary,
                // Construct markdown content from structured data
                content: `# ${data.title}\n\n${data.summary}\n\n## Problem\n${data.problem}\n\n## Solution\n${data.solution}\n\n## Architecture\n${data.architecture}\n\n## Features\n${data.features?.map((f: string) => `- ${f}`).join("\n")}`,
                tags: data.tech_stack || []
            }));

            setStep(2); // Go to Review
        } catch (e) {
            console.error(e);
            alert("AI Generation failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-[#0a0a0f]/90 border border-white/10 p-10 rounded-3xl backdrop-blur-xl shadow-2xl max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Sparkles className="text-violet-500 w-6 h-6" />
                <h2 className="text-2xl font-bold text-white">Describe Your Vision</h2>
            </div>

            <p className="text-neutral-400 mb-6 text-sm">
                Tell us about your project—the problem it solves, the tech stack, or the unique twist.
                Our AI will architect a professional draft for you.
            </p>

            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    className="relative w-full p-6 bg-[#151520] border border-white/10 rounded-xl focus:border-violet-500 focus:outline-none transition-all text-white text-lg placeholder:text-neutral-700 min-h-[200px] resize-none"
                    placeholder="e.g. A decentralized voting system using ZK-proofs on Solana, focused on privacy..."
                />
            </div>

            <div className="mt-8">
                <button
                    onClick={generate}
                    disabled={loading || !idea}
                    className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:transform-none"
                >
                    {loading ? (
                        <>
                            <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            Architecting Project...
                        </>
                    ) : (
                        <>
                            Generate Blueprint <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

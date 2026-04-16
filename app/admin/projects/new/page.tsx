"use client";
import { useState } from "react";
import { ArrowLeft, Save, Sparkles, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewProject() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [content, setContent] = useState("");
    const [summary, setSummary] = useState("");

    async function handleGenerateSummary() {
        if (!content) return;
        setSummaryLoading(true);
        try {
            const res = await fetch("/api/projects/generate-summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            const data = await res.json();
            if (data.summary) setSummary(data.summary);
        } catch (e) {
            console.error(e);
        } finally {
            setSummaryLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        // Ensure summary is included if generated
        if (summary) formData.set("summary", summary);

        try {
            const res = await fetch("/api/projects/create", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                router.push("/admin/projects");
            } else {
                alert("Failed to create project");
            }
        } catch (e) {
            console.error(e);
            alert("Error creating project");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-20 px-6 space-y-8">
            <Link href="/admin/projects" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
                <ArrowLeft size={16} /> Back to Projects
            </Link>

            <h1 className="text-3xl font-bold">New Project</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-400">Project Name</label>
                        <input
                            name="name"
                            required
                            placeholder="e.g. Neon Voice AI"
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-400">GitHub URL (Optional)</label>
                        <input
                            name="github_url"
                            placeholder="https://github.com/..."
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Cover Image</label>
                    <div className="relative group">
                        <input
                            type="file"
                            name="cover_image"
                            accept="image/*"
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-500/10 file:text-violet-400 hover:file:bg-violet-500/20"
                        />
                        <ImageIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none" size={20} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-neutral-400">Content (Markdown)</label>
                        <textarea
                            name="content"
                            required
                            placeholder="Describe your project..."
                            rows={12}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:border-violet-500 focus:outline-none transition-colors font-mono text-sm"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                                <Sparkles size={14} className="text-yellow-400" /> AI Summary
                            </label>
                            <textarea
                                name="summary" // Manually set, but controlled state handles updates
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="Auto-generated summary..."
                                rows={6}
                                className="w-full p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl focus:border-purple-500 focus:outline-none transition-colors text-sm"
                            />
                            <button
                                type="button"
                                onClick={handleGenerateSummary}
                                disabled={summaryLoading || !content}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                {summaryLoading ? <span className="animate-spin">✨</span> : <Sparkles size={14} />}
                                {summaryLoading ? "Generating..." : "Generate with AI"}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors flex items-center gap-2"
                    >
                        {loading ? "Saving..." : <><Save size={18} /> Save Draft</>}
                    </button>
                </div>
            </form>
        </div>
    );
}

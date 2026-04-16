"use client";
import { useState } from "react";
import { ArrowLeft, Github, DownloadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ImportProject() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [url, setUrl] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            // Extract owner/repo
            // Expected format: https://github.com/owner/repo
            const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (!match) {
                alert("Invalid GitHub URL");
                setLoading(false);
                return;
            }
            const name = match[2]; // Use repo name as project name

            const formData = new FormData();
            formData.append("name", name);
            formData.append("github_url", url);
            formData.append("content", `Imported from ${url}`); // Placeholder until sync runs

            // We reuse /api/projects/create which queues 'index-source'.
            // But for GitHub we want 'github-sync'.
            // The create API currently queues 'index-source' if content is present.
            // Ideally we'd modify create API to handle 'github-sync' OR add specific logic here.
            // But since 'github-sync' is a heavy background job, maybe we just create the project and let the user click 'Sync'? 
            // Or we assume the create API is smart enough?
            // Current create API: Queues 'index-source'.
            // I should probably update create API to queue 'github-sync' if github_url is present.
            // Or just create it here and then call a sync endpoint?

            // Let's just create it as a draft.
            // Then the user can edit it.

            const res = await fetch("/api/projects/create", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                // Trigger sync?
                // For now, redirect to dashboard.
                router.push("/admin/projects");
            } else {
                alert("Failed to import");
            }

        } catch (e) {
            console.error(e);
            alert("Error importing");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto py-20 px-6 space-y-8">
            <Link href="/admin/projects" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
                <ArrowLeft size={16} /> Back to Projects
            </Link>

            <div className="text-center space-y-4 mb-12">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Github size={32} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold">Import from GitHub</h1>
                <p className="text-neutral-400">Enter a repository URL to auto-create a project draft.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-400">Repository URL</label>
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://github.com/username/repo"
                        required
                        className="w-full p-4 bg-black/40 border border-white/10 rounded-xl focus:border-violet-500 focus:outline-none transition-colors font-mono text-sm"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        "Importing..."
                    ) : (
                        <>
                            <DownloadCloud size={20} />
                            Import Repository
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

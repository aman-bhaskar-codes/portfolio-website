"use client";
import { useState } from "react";
import { Github, ArrowRight } from "lucide-react";

export default function StepGitHubImport({ setStep, setProjectData }: any) {
    const [repoUrl, setRepoUrl] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleImport() {
        if (!repoUrl) return;
        setLoading(true);

        try {
            // We can reuse the import-github API, but we want the DATA back not just create.
            // The API currently creates.
            // We'll modify client usage: If API creates, we should fetch the created project?
            // OR we modify API to return data without create?
            // User's wizard flow implies review step.
            // So we should probably modify the API or creating a new "preview" route.
            // For simplicity, let's use the valid import API, but effectively "Create Draft" is step 1.
            // Then Step 2 is reviewing that draft.
            // So we call the API, get the created project, load it into state, and pass to review.

            const res = await fetch("/api/projects/import-github", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ repoUrl })
            });

            if (!res.ok) throw new Error("Import failed");

            const data = await res.json();
            // The API returns { success: true, project: ... }

            setProjectData({
                ...data.project,
                tags: data.project.tags || []
            });

            setStep(2); // Go to Review
        } catch (e) {
            console.error(e);
            alert("Import failed. Check URL or privacy settings.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-[#0a0a0f]/90 border border-white/10 p-10 rounded-3xl backdrop-blur-xl shadow-2xl max-w-xl mx-auto text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Github size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Import from GitHub</h2>
            <p className="text-neutral-400 mb-8 text-sm">
                Paste your repository URL. We'll fetch the README, detect the stack, and create a draft.
            </p>

            <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full p-4 bg-[#151520] border border-white/10 rounded-xl focus:border-violet-500 focus:outline-none transition-all text-white text-center font-mono mb-6"
                placeholder="https://github.com/username/repo"
            />

            <button
                onClick={handleImport}
                disabled={loading || !repoUrl}
                className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2"
            >
                {loading ? "Importing..." : <>Analyze & Import <ArrowRight size={18} /></>}
            </button>
        </div>
    );
}

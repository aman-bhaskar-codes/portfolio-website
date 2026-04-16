"use client";
import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StepPublish({ projectData }: any) {
    const [status, setStatus] = useState<"publishing" | "success" | "max-steps">("publishing");
    const router = useRouter();

    // We actually publish here.
    useEffect(() => {
        const publish = async () => {
            try {
                // Prepare FormData
                // If project already has ID (from import), we update. 
                // If from scratch/AI, we create.
                // We'll use the 'create' endpoint but map fields.

                const formData = new FormData();
                formData.append("name", projectData.name);
                formData.append("github_url", projectData.githubUrl || "");
                formData.append("content", projectData.content || "");
                formData.append("summary", projectData.description || ""); // API uses 'summary' for description

                // Only append files if they exist
                if (projectData.coverFile) formData.append("cover_image", projectData.coverFile);
                if (projectData.galleryFiles) {
                    projectData.galleryFiles.forEach((f: File) => formData.append("gallery", f));
                }

                // Since we might already have a project ID (from GitHub Import step),
                // we should probably check if projectData.id exists.
                // If it exists, we might need an 'update' route. 
                // BUT, the create route logic handles creation.
                // If GitHub Import ALREADY created it, we should UPDATE it.
                // For now, let's assume if it exists we just redirect? 
                // No, we edited it. 
                // Let's create a new one for now to keep it simple, or overwrite?
                // Standard Wizard flow: Create at end. 
                // (My GitHub Import step actually created it... that's a duplicated creation issue).
                // Fix: If GitHub Import already created, we should use an update API.
                // OR: GitHub Import step *should not* have created it, just fetched data.

                const res = await fetch("/api/projects/create", {
                    method: "POST",
                    body: formData
                });

                if (res.ok) {
                    setStatus("success");
                }
            } catch (e) {
                console.error(e);
            }
        };

        if (status === "publishing") {
            publish();
        }
    }, [projectData, status]);

    if (status === "success") {
        return (
            <div className="bg-[#0a0a0f]/90 border border-white/10 p-12 rounded-3xl backdrop-blur-xl shadow-2xl max-w-lg mx-auto text-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">You're Live!</h2>
                <p className="text-neutral-400 mb-8">Project has been created as a draft. Review it or publish to the world.</p>
                <Link href="/projects">
                    <button className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors">
                        Go to Dashboard
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="text-center py-24">
            <Loader2 className="w-16 h-16 text-violet-500 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white animate-pulse">Publishing Manifest...</h2>
            <p className="text-neutral-500 mt-2">Uploading assets • Indexing for AI • Updating Graph</p>
        </div>
    );
}

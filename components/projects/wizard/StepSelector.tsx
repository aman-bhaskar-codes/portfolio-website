"use client";
import { Sparkles, Github, FileEdit } from "lucide-react";
import { motion } from "framer-motion";

export default function StepSelector({ setStep, setMode }: any) {

    const handleSelect = (mode: "ai" | "github" | "manual") => {
        setMode(mode);
        if (mode === "manual") {
            setStep(2); // Jump to Review/Edit
        } else {
            setStep(1); // Go to specific input step
        }
    };

    return (
        <div className="bg-[#0a0a0f]/90 border border-white/10 p-12 rounded-3xl backdrop-blur-xl shadow-2xl">
            <h2 className="text-4xl font-black text-white mb-2 text-center">Create Artifact</h2>
            <p className="text-neutral-400 text-center mb-12">Choose your creation path</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* AI Mode */}
                <button
                    onClick={() => handleSelect("ai")}
                    className="group relative p-8 rounded-2xl bg-gradient-to-br from-violet-900/20 to-transparent border border-white/5 hover:border-violet-500/50 transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] text-left"
                >
                    <div className="absolute inset-0 bg-violet-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    <Sparkles className="w-12 h-12 text-violet-400 mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-2">AI Wizard</h3>
                    <p className="text-sm text-neutral-400">Describe your idea. AI generates structure, tech stack, and content.</p>
                </button>

                {/* GitHub Mode */}
                <button
                    onClick={() => handleSelect("github")}
                    className="group relative p-8 rounded-2xl bg-gradient-to-br from-neutral-900/40 to-transparent border border-white/5 hover:border-white/30 transition-all hover:shadow-lg text-left"
                >
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    <Github className="w-12 h-12 text-white mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-2">GitHub Import</h3>
                    <p className="text-sm text-neutral-400">Auto-sync from a repository. Fetches README and detects stack.</p>
                </button>

                {/* Manual Mode */}
                <button
                    onClick={() => handleSelect("manual")}
                    className="group relative p-8 rounded-2xl bg-gradient-to-br from-neutral-900/40 to-transparent border border-white/5 hover:border-white/30 transition-all hover:shadow-lg text-left"
                >
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    <FileEdit className="w-12 h-12 text-neutral-400 mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-bold text-white mb-2">Manual Entry</h3>
                    <p className="text-sm text-neutral-400">Start from a blank canvas. Full control over every detail.</p>
                </button>
            </div>
        </div>
    );
}

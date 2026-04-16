"use client";

import { useState, useRef, useCallback } from "react";
import { demoSequence, type DemoState } from "@/lib/demo/controller";
import { generateNarration } from "@/lib/demo/narrator";
import { speak, stopSpeaking } from "@/lib/voice/engine";

export default function DemoController() {
    const [state, setState] = useState<DemoState>("idle");
    const [currentStep, setCurrentStep] = useState(-1);
    const [stepLabel, setStepLabel] = useState("");
    const [narrationText, setNarrationText] = useState("");
    const cancelRef = useRef(false);

    const runDemo = useCallback(async () => {
        cancelRef.current = false;
        setState("running");

        for (let i = 0; i < demoSequence.length; i++) {
            if (cancelRef.current) break;

            const step = demoSequence[i];
            setCurrentStep(i);
            setStepLabel(step.type);
            setNarrationText("Generating...");

            // Navigate to section
            if (step.sectionId) {
                const el = document.getElementById(step.sectionId);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    // Glow highlight
                    el.style.boxShadow = "0 0 40px rgba(124,58,237,0.3)";
                    el.style.transition = "box-shadow 0.5s ease";
                    setTimeout(() => { el.style.boxShadow = "none"; }, 4000);
                }
            }

            if (cancelRef.current) break;

            // Generate narration via RAG
            const narration = await generateNarration(step.narrationPrompt);
            if (cancelRef.current) break;

            setNarrationText(narration);

            // Speak with TTS
            await speak(narration);

            if (cancelRef.current) break;

            // Brief pause between steps
            await new Promise(r => setTimeout(r, 1500));
        }

        if (!cancelRef.current) {
            setState("finished");
            setStepLabel("Tour Complete");
            setNarrationText("Thanks for watching! Feel free to ask me anything.");
        }
    }, []);

    const stopDemo = useCallback(() => {
        cancelRef.current = true;
        stopSpeaking();
        setState("idle");
        setCurrentStep(-1);
        setStepLabel("");
        setNarrationText("");
    }, []);

    const isActive = state === "running";
    const progress = isActive ? ((currentStep + 1) / demoSequence.length) * 100 : 0;

    return (
        <div className="fixed bottom-6 left-6 z-50 font-sans md:bottom-6 md:right-6 md:left-auto">
            {/* Narration Panel — shows during demo */}
            {(isActive || state === "finished") && narrationText && (
                <div style={{
                    marginBottom: "0.75rem",
                    width: 340,
                    maxHeight: 180,
                    padding: "1rem 1.25rem",
                    background: "rgba(10,10,20,0.92)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(124,58,237,0.25)",
                    borderRadius: "14px",
                    boxShadow: "0 0 40px -10px rgba(124,58,237,0.25)",
                    overflow: "auto",
                }}>
                    {/* Step indicator */}
                    <div style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: "0.5rem",
                    }}>
                        <span style={{
                            fontSize: "0.6rem", textTransform: "uppercase",
                            letterSpacing: "0.1em", color: "#a78bfa", fontWeight: 600,
                        }}>
                            {stepLabel}
                        </span>
                        <span style={{ fontSize: "0.6rem", color: "#555" }}>
                            {currentStep + 1}/{demoSequence.length}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                        width: "100%", height: 2,
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 1, marginBottom: "0.6rem",
                    }}>
                        <div style={{
                            width: `${progress}%`, height: "100%",
                            background: "linear-gradient(to right, #7c3aed, #3b82f6)",
                            borderRadius: 1, transition: "width 0.5s ease",
                        }} />
                    </div>

                    {/* Narration text */}
                    <div style={{
                        fontSize: "0.78rem", color: "#ccc",
                        lineHeight: 1.5,
                    }}>
                        {narrationText}
                    </div>
                </div>
            )}

            {/* Control Buttons */}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                {!isActive ? (
                    <button
                        onClick={runDemo}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)] border border-white/10"
                        style={{
                            background: "rgba(var(--accent-rgb), 0.8)",
                            backdropFilter: "blur(12px)",
                        }}
                    >
                        <span className="text-base">🎙</span>
                        {state === "finished" ? "Replay Tour" : "Start Voice Tour"}
                    </button>
                ) : (
                    <button
                        onClick={stopDemo}
                        style={{
                            padding: "0.65rem 1.25rem",
                            background: "rgba(255,255,255,0.08)",
                            color: "#e0e0e0",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: "12px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                    >
                        ■ Stop
                    </button>
                )}
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DEMO_STEPS = [
    { target: "systems", text: "Welcome to the Identity Engine. I'm the cognitive layer of Aman's platform." },
    { target: "architecture-visual", text: "I'm powered by a production-grade RAG pipeline and localized LLM inference." },
    { target: "projects", text: "I synthesize technical knowledge from these repositories to provide zero-hallucination responses." },
    { target: "IdentityBrain", text: "Ask me anything via the neural terminal. I'm ready for autonomous execution." },
];

export default function AIDemoMode() {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const speak = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 0.9; // Slightly deeper, premium voice
        utterance.volume = 0.5;
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        if (isActive) {
            const step = DEMO_STEPS[currentStep];
            if (step) {
                const element = document.getElementById(step.target);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                }

                // Voice Narration
                speak(step.text);

                const timer = setTimeout(() => {
                    if (currentStep < DEMO_STEPS.length - 1) {
                        setCurrentStep(prev => prev + 1);
                    } else {
                        setIsActive(false);
                        setCurrentStep(0);
                        speak("Tour complete. Connection maintained.");
                    }
                }, 6000);
                return () => clearTimeout(timer);
            }
        }
    }, [isActive, currentStep]);


    return (
        <>
            <button
                onClick={() => setIsActive(true)}
                className="fixed bottom-12 left-12 z-[70] px-6 py-3 bg-white/5 border border-white/10 text-white rounded-full text-[10px] font-mono hover:bg-white/10 transition-all backdrop-blur-3xl group"
            >
                <span className="opacity-40 group-hover:opacity-100 transition-opacity">RUN_AUTONOMOUS_DEMO</span>
                <span className="ml-2">▶</span>
            </button>

            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] glass-panel p-12 rounded-3xl max-w-lg text-center shadow-3xl border border-accent/20"
                    >
                        <p className="text-2xl font-light text-white leading-relaxed mb-8">
                            {DEMO_STEPS[currentStep].text}
                        </p>
                        <div className="flex justify-center gap-2">
                            {DEMO_STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1 h-1 rounded-full transition-all ${i === currentStep ? 'bg-accent w-4' : 'bg-white/10'}`}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

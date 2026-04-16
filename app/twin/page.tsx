"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Terminal, Settings, X, Activity, Cpu, Database, Network } from "lucide-react";
import ControlRoomScene from "@/components/twin/ControlRoomScene";
import { useSession } from "next-auth/react";
import { useVoiceInput } from "@/hooks/useVoiceInput"; // New Hook

// Valid tones for the AI
type Tone = "neutral" | "technical" | "strategic" | "curious" | "frustrated" | "casual";

export default function TwinPage() {
    const { data: session } = useSession();

    // UI State
    const [voiceMode, setVoiceMode] = useState<"idle" | "listening" | "speaking">("idle");
    const [currentTone, setCurrentTone] = useState<Tone>("neutral");
    const [sceneMode, setSceneMode] = useState<"idle" | "active" | "listening" | "speaking">("idle");
    const [showSettings, setShowSettings] = useState(false);
    const [intent, setIntent] = useState<string>("");

    // Simulation Data
    const [goal, setGoal] = useState<string | undefined>(undefined);
    const [memories, setMemories] = useState<any[]>([]);

    // Speech Synthesis
    const synthRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    const speak = (text: string, tone: Tone = "neutral") => {
        if (!synthRef.current) return;

        // Don't cancel immediately if we are streaming chunks, 
        // we want to queue them. But handleVoice clears queue at start.

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = tone === "technical" ? 0.9 : tone === "strategic" ? 0.8 : 1.0;

        // Try to get a good voice
        const voices = synthRef.current.getVoices();
        const preferred = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
        if (preferred) utterance.voice = preferred;

        utterance.onstart = () => {
            setVoiceMode("speaking");
            setSceneMode("speaking");
        };

        utterance.onend = () => {
            // Only go back to idle if queue is empty
            if (!synthRef.current?.speaking) {
                setVoiceMode("idle");
                setSceneMode("idle");
                setCurrentTone("neutral");
                setIntent("");
            }
        };

        synthRef.current.speak(utterance);
    };

    // Robust Stream Handler (Part 2 of Request)
    async function handleVoiceResponse(query: string) {
        if (!query.trim()) return;

        setVoiceMode("speaking"); // Actually "thinking" first
        setSceneMode("active");
        setIntent("Thinking...");

        // Clear previous speech
        if (synthRef.current) synthRef.current.cancel();

        try {
            const res = await fetch("/api/twin/voice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query,
                    visitorId: "guest-v4", // Robust anonymous ID
                    userId: session?.user?.email
                })
            });

            if (!res.body) return;

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            let buffer = "";
            let headerParsed = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // robust parsing of header
                if (!headerParsed && buffer.includes("__END_HEADER__\n")) {
                    const parts = buffer.split("__END_HEADER__\n");
                    const headerStr = parts[0];
                    buffer = parts.slice(1).join("__END_HEADER__\n"); // Keep remaining
                    headerParsed = true;

                    try {
                        const header = JSON.parse(headerStr);
                        if (header.intent) setIntent(header.intent.toUpperCase());
                        if (header.emotion?.tone) setCurrentTone(header.emotion.tone);
                    } catch (e) {
                        console.error("Header parse error", e);
                    }
                }

                if (!headerParsed) continue;

                // Sentence buffering for smooth speech
                // Split by punctuation, but keep the punctuation
                // Look for . ? ! followed by space or newline
                // We use a regex that matches sentence endings.

                let match;
                while ((match = buffer.match(/^([\s\S]+?([.?!]|\n))\s+([\s\S]*)/))) {
                    const sentence = match[1];
                    const remaining = match[3];

                    speak(sentence, currentTone);
                    buffer = remaining;
                }
            }

            // Speak remaining buffer if any
            if (buffer.trim()) {
                speak(buffer, currentTone);
            }

        } catch (e) {
            console.error("Voice Pipeline Error", e);
            setIntent("Error");
            setVoiceMode("idle");
        }
    }

    // Use robust hook
    const { start, stop, listening, error } = useVoiceInput((text) => {
        handleVoiceResponse(text);
    });

    useEffect(() => {
        if (listening) {
            setVoiceMode("listening");
            setSceneMode("listening");
            setIntent("Listening...");
        } else if (voiceMode === "listening") {
            // If hook stops listening and we haven't started speaking/processing, we go idle
            // But handleVoiceResponse sets mode to speaking/active immediately.
        }
    }, [listening]);

    const isOwner = session?.user?.email === "aman@antigravity.com"; // Mock check

    return (
        <main className="relative w-full h-screen overflow-hidden text-white font-mono selection:bg-purple-500/30">

            {/* 1. The 3D World */}
            <ControlRoomScene
                mode={sceneMode}
                tone={currentTone}
                goal={intent} // Visualize intent as goal
                reflection={undefined}
                speaking={voiceMode === "speaking"}
            />

            {/* 2. HUD Overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-12">

                {/* Top Bar */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600 drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                            DIGITAL TWIN
                        </h1>
                        <span className="text-[10px] font-mono tracking-[0.35em] text-purple-400/50 uppercase -mt-1">
                            Autonomous Systems Architect
                        </span>
                        <div className="flex items-center gap-3 text-sm text-cyan-400/80">
                            <span className="flex items-center gap-1">
                                <Activity size={14} /> SYSTEM: ELITE V4
                            </span>
                            <span className="flex items-center gap-1">
                                <Cpu size={14} /> QWEN 2.5 3B
                            </span>
                            <span className="flex items-center gap-1">
                                <Database size={14} /> RAG V4 (HYBRID)
                            </span>
                        </div>
                    </div>

                    <div className="pointer-events-auto">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <Settings className="text-white/50 hover:text-white" />
                        </button>
                    </div>
                </div>

                {/* Center Interaction Zone (Empty for now, orb is background) */}
                <div className="flex-1 flex items-center justify-center pointer-events-none">
                    <AnimatePresence>
                        {voiceMode !== "idle" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-center mt-32"
                            >
                                <p
                                    className="font-bold uppercase tracking-widest text-xs"
                                    style={{ color: currentTone === 'technical' ? '#22d3ee' : currentTone === 'strategic' ? '#f472b6' : '#a78bfa' }}
                                >
                                    {voiceMode === "listening" ? "Microphone Active" : `Speaking (${currentTone})...`}
                                </p>
                                {intent && (
                                    <p className="text-[10px] text-white/50 tracking-widest mt-1">
                                        FOCUS: {intent}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom Bar: Interaction Controls */}
                <div className="flex flex-col items-center gap-6 pb-8 pointer-events-auto">

                    {error && (
                        <div className="text-red-400 text-xs bg-red-900/20 px-3 py-1 rounded border border-red-500/30 mb-4">
                            ERROR: {error}
                        </div>
                    )}

                    {/* The "Orb" Interaction Trigger */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => listening ? stop() : start()}
                        className={`
                            relative w-24 h-24 rounded-full flex items-center justify-center
                            backdrop-blur-md border border-white/10
                            transition-all duration-500
                            ${listening
                                ? "bg-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.4)]"
                                : "bg-purple-600/30 shadow-[0_0_50px_rgba(124,58,237,0.4)] hover:shadow-[0_0_80px_rgba(124,58,237,0.6)]"
                            }
                        `}
                    >
                        {/* Pulse Ring */}
                        {listening && (
                            <div className="absolute inset-0 rounded-full animate-ping bg-red-500/20" />
                        )}

                        <Mic size={32} className={listening ? "text-red-400" : "text-white"} />
                    </motion.button>

                    <div className="text-xs text-center text-white/30 font-mono">
                        {listening ? "LISTENING..." : "TAP TO SPEAK"}
                    </div>
                </div>

            </div>

            {/* Settings Panel (Optional) */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        className="absolute right-0 top-0 bottom-0 w-80 bg-black/90 backdrop-blur-xl border-l border-white/10 z-50 p-6 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Terminal size={18} /> SYSTEM_SETTINGS
                            </h2>
                            <button onClick={() => setShowSettings(false)}>
                                <X size={18} className="text-white/50 hover:text-white" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <h3 className="text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">Identity Lock</h3>
                                <div className="flex items-center gap-2 text-green-400 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    ACTIVE (STRICT)
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <h3 className="text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">RAG Pipeline</h3>
                                <div className="space-y-2 text-xs text-white/70">
                                    <div className="flex justify-between">
                                        <span>Retrieval</span>
                                        <span className="text-purple-400">HYBRID V4</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Reranking</span>
                                        <span className="text-cyan-400">QWEN 1.5B</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Context</span>
                                        <span className="text-indigo-400">COMPRESSED</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </main>
    );
}

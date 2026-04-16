"use client";

import { motion } from "framer-motion";
import { Mic, MessageSquare, Navigation, StopCircle } from "lucide-react";

const capabilities = [
    { icon: MessageSquare, title: "Dynamic RAG Narration", desc: "Each voice segment is generated live via the RAG pipeline, not pre-recorded." },
    { icon: Navigation, title: "State-Machine Navigation", desc: "Scroll-driven tour with section highlighting and smooth transitions." },
    { icon: Mic, title: "Browser-Native TTS", desc: "Zero-dependency speech synthesis using the Web Speech API." },
    { icon: StopCircle, title: "Real-Time Interruption", desc: "Users can stop, skip, or restart the demo at any point in the flow." },
];

export default function VoiceFlow() {
    return (
        <section className="py-32 px-6 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-900/10 blur-[140px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-16 relative z-10">
                <div className="max-w-3xl space-y-6">
                    <span className="text-xs font-mono uppercase tracking-widest text-accent">
                        // Interaction Layer
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                        Voice Agent Architecture
                    </h2>
                    <p className="text-lg text-neutral-400 font-light leading-relaxed">
                        The voice demo agent leverages dynamic RAG responses,
                        browser-native TTS, state-machine-driven navigation,
                        and real-time interruption support to create
                        an AI-hosted interactive experience.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {capabilities.map((cap, i) => (
                        <motion.div
                            key={cap.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-accent/20 transition-all duration-500"
                        >
                            <div className="flex items-start gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                                    <cap.icon className="text-accent" size={22} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-white">{cap.title}</h3>
                                    <p className="text-sm text-neutral-400 leading-relaxed">{cap.desc}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

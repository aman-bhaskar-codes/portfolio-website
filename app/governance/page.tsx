"use client";

import ConstitutionSection from "@/components/governance/ConstitutionSection";
import Container from "@/components/layout/Container";

export default function GovernancePage() {
    return (
        <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-core-primary)] py-32 font-sans relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />

            <Container>
                <div className="max-w-4xl mx-auto space-y-24 relative z-10">
                    <header className="space-y-6 border-b border-white/10 pb-12">
                        <div className="inline-block text-[10px] uppercase font-mono tracking-widest text-purple-400 border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 rounded-full mb-4">
                            System Architecture Document
                        </div>
                        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white">
                            AI Governance & Constitution
                        </h1>
                        <p className="text-neutral-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
                            A formal statement of identity, alignment, and operational constraints
                            governing the Digital Twin cognitive system.
                        </p>
                    </header>

                    <ConstitutionSection />
                </div>
            </Container>
        </main>
    );
}

"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import SocialLinks from "@/components/layout/SocialLinks";
import Hero from "@/components/home/Hero";

// Lazy Load heavy interactive components to secure blazing fast Initial Page Load (LCP)
const DemoController = dynamic(() => import("@/components/demo/DemoController"), { ssr: false });
const ChatPanel = dynamic(() => import("@/components/chat/ChatPanel"), { ssr: false });

// Only dynamically split these Server chunks without the SSR enforcement
const ArchitecturePreview = dynamic(() => import("@/components/home/ArchitecturePreview"));
const AICTA = dynamic(() => import("@/components/home/AICTA"));
const Positioning = dynamic(() => import("@/components/home/Positioning"));
const FeaturedProjects = dynamic(() => import("@/components/home/FeaturedProjects"));
const VirtualWorkGallery = dynamic(() => import("@/components/gallery/VirtualWorkGallery"));

export default function Home() {
    return (
        <main className="min-h-screen bg-bg-base selection:bg-accent/30 selection:text-white">
            {/* 🧭 NAVIGATION */}
            <Navbar />

            {/* 🎬 CINEMATIC HERO */}
            <Hero />

            {/* 🧠 CREDIBILITY STRIP */}
            <Positioning />

            {/* 🛠 FEATURED PROJECTS */}
            <FeaturedProjects />

            {/* 🎨 VIRTUAL WORK GALLERY */}
            <VirtualWorkGallery />

            {/* 🏗 SYSTEM ARCHITECTURE */}
            <ArchitecturePreview />

            {/* 🤖 IDENTITY CTA */}
            <AICTA />


            {/* 🎙 VOICE DEMO AGENT */}
            <DemoController />


            {/* 💎 FOOTER */}
            <footer className="py-24 border-t border-border bg-bg-deep">
                <div className="product-container flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex flex-col gap-2">
                        <span className="text-lg font-bold tracking-tighter">AMAN <span className="text-neutral-700">/ ID</span></span>
                        <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-[0.4em]">Integrated Intelligence Identity</span>
                    </div>

                    <div className="flex gap-8">
                        <SocialLinks />
                    </div>

                    <div className="text-[10px] font-mono text-neutral-700 uppercase tracking-widest">
                        &copy; 2026 / Aman Bhaskar
                    </div>
                </div>
            </footer>

            {/* 🤖 FLOATING CHAT AGENT */}
            <ChatPanel />
        </main>
    );
}

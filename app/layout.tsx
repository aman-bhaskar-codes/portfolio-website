import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });



export const metadata: Metadata = {
    title: "Aman | AI Systems Engineer",
    description: "Senior Product & AI Systems Engineer. Building cognitive architectures and high-performance digital identities.",
};

import Providers from "@/components/Providers";
import SettingsPanel from "@/components/layout/SettingsPanel";
import PageTransition from "@/components/layout/PageTransition";
import CursorGlow from "@/components/layout/CursorGlow";
import { CognitiveProvider } from "@/lib/state/cognitiveStore";
import PageTransitionProvider from "@/components/layout/PageTransitionProvider";
import ChatPanelWrapper from "@/components/chat/ChatPanelWrapper";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${mono.variable}`} style={{ scrollBehavior: "smooth" }} suppressHydrationWarning>
            <body className="antialiased selection:bg-accent/30 selection:text-white relative overflow-x-hidden" suppressHydrationWarning>
                {/* 🌌 Elite Background System */}
                <div className="fixed inset-0 -z-20 bg-[var(--bg-primary)] transition-colors duration-1000" />
                <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[var(--accent-core-soft)] via-transparent to-indigo-900/10 blur-[120px]" />
                <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,rgba(139,92,246,0.1),transparent_50%)]" />

                <CursorGlow />

                <CognitiveProvider>
                    <Providers>
                        <SettingsPanel />
                        {/* Wrapper client component so we can access pathname hook cleanly */}
                        <PageTransitionProvider>
                            {children}
                        </PageTransitionProvider>
                        <ChatPanelWrapper />
                    </Providers>
                </CognitiveProvider>
            </body>
        </html>
    );
}





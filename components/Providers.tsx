"use client";

import { SessionProvider } from "next-auth/react";
import SettingsProvider from "@/providers/SettingsProvider";
import { CognitiveProvider } from "@/lib/state/cognitiveStore";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <CognitiveProvider>
                <SettingsProvider>
                    {children}
                </SettingsProvider>
            </CognitiveProvider>
        </SessionProvider>
    );
}

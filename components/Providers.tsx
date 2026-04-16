"use client";

import { SessionProvider } from "next-auth/react";
import SettingsProvider from "@/providers/SettingsProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <SettingsProvider>
                {children}
            </SettingsProvider>
        </SessionProvider>
    );
}

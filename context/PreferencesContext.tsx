"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface PreferencesContextType {
    theme: string;
    setTheme: (theme: string) => void;
    motion: boolean;
    setMotion: (enabled: boolean) => void;
    aiVerbosity: string;
    setAiVerbosity: (style: string) => void;
    bgIntensity: number;
    setBgIntensity: (value: number) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState("luxury");
    const [motion, setMotion] = useState(true);
    const [aiVerbosity, setAiVerbosity] = useState("balanced");
    const [bgIntensity, setBgIntensity] = useState(0.5);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("aman_prefs");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setTheme(parsed.theme);
                setMotion(parsed.motion);
                setAiVerbosity(parsed.aiVerbosity);
                setBgIntensity(parsed.bgIntensity);
            } catch (e) {
                console.error("Failed to parse prefs", e);
            }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem("aman_prefs", JSON.stringify({ theme, motion, aiVerbosity, bgIntensity }));
    }, [theme, motion, aiVerbosity, bgIntensity]);

    return (
        <PreferencesContext.Provider
            value={{
                theme, setTheme,
                motion, setMotion,
                aiVerbosity, setAiVerbosity,
                bgIntensity, setBgIntensity
            }}
        >
            {children}
        </PreferencesContext.Provider>
    );
}

export const usePreferences = () => {
    const context = useContext(PreferencesContext);
    if (!context) throw new Error("usePreferences must be used within a PreferencesProvider");
    return context;
};

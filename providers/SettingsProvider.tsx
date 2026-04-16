'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSettingsStore } from '../store/useSettings';

export default function SettingsProvider({ children }: { children: React.ReactNode }) {
    const theme = useSettingsStore((state) => state.theme);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            document.documentElement.classList.remove('luxury', 'deeplab');
            document.documentElement.classList.add(theme);
        }
    }, [theme, mounted]);

    // Prevent hydration mismatch
    if (!mounted) return <div className="opacity-0">{children}</div>;

    return <>{children}</>;
}

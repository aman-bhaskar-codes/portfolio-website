"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

// This separates the Next router `usePathname` call from the RootLayout, avoiding SSC nesting errors
export default function PageTransitionProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait">
            {/* The presence wrapper keys via Pathname, enforcing React to re-render but wait for the exit fade */}
            <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, filter: "blur(4px)" }} // Cinematic Depth Illusion
                transition={{ duration: 0.6 }}
                className="w-full h-full min-h-screen"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1], // premium cubic bezier
            }}
            className="w-full h-full will-change-transform will-change-opacity"
        >
            {children}
        </motion.div>
    );
}

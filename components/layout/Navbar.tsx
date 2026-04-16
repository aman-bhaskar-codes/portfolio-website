"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { springs, ease, staggerContainer, staggerChild } from "@/lib/motion";

const navLinks = [
    { label: "About", href: "/about" },
    { label: "Architecture", href: "/architecture" },
    { label: "Knowledge", href: "/knowledge" },
    { label: "AI", href: "/ai" },
    { label: "Resume", href: "/resume" },
];

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    // Scroll-reactive background
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <>
            <motion.nav
                className={`fixed top-0 left-0 right-0 z-[60] py-4 md:py-5 px-6 md:px-12 flex justify-between items-center transition-all duration-700 ${scrolled
                    ? "glass-panel border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
                    : "bg-transparent border-b border-transparent"
                    }`}
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: ease.luxuryOut, delay: 0.2 }}
            >
                {/* Logo */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={springs.snappy}
                >
                    <Link
                        href="/"
                        className="text-lg font-bold tracking-tighter hover:opacity-70 transition-opacity z-[70] relative"
                    >
                        AMAN <span className="text-neutral-600 font-light">/ ID</span>
                    </Link>
                </motion.div>

                {/* DESKTOP NAV — Staggered Reveal */}
                <motion.div
                    className="hidden md:flex gap-10 items-center"
                    variants={staggerContainer(0.06)}
                    initial="hidden"
                    animate="visible"
                >
                    {navLinks.map((item) => (
                        <motion.div
                            key={item.label}
                            variants={staggerChild}
                            className="relative"
                        >
                            <Link
                                href={item.href}
                                className={`text-[11px] font-mono uppercase tracking-[0.3em] transition-all hover:scale-105 ${pathname === item.href
                                    ? "text-[var(--text-core-primary)]"
                                    : "text-[var(--text-core-muted)] hover:text-white"
                                    }`}
                            >
                                {item.label}
                            </Link>
                            {/* Active underline slide */}
                            {pathname === item.href && (
                                <motion.div
                                    className="absolute -bottom-2 left-0 right-0 h-[2px] bg-[var(--accent-core)]"
                                    layoutId="nav-underline"
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                />
                            )}
                        </motion.div>
                    ))}
                </motion.div>

                <div className="flex gap-4 items-center z-[70]">
                    <motion.div
                        className="hidden md:flex w-8 h-8 rounded-full border border-white/10 items-center justify-center text-[10px] font-mono text-neutral-600"
                        whileHover={{ scale: 1.15, borderColor: "rgba(129, 140, 248, 0.4)" }}
                        transition={springs.magnetic}
                    >
                        V4
                    </motion.div>
                    {/* MOBILE TOGGLE */}
                    <motion.button
                        className="md:hidden w-10 h-10 flex items-center justify-center text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </motion.button>
                </div>
            </motion.nav>

            {/* MOBILE MENU OVERLAY */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[50] bg-bg-base/98 backdrop-blur-2xl flex flex-col items-center justify-center space-y-8 md:hidden"
                    >
                        {navLinks.map((item, i) => (
                            <motion.div
                                key={item.label}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{
                                    delay: i * 0.06,
                                    duration: 0.5,
                                    ease: ease.luxuryOut,
                                }}
                            >
                                <Link
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`text-2xl font-light tracking-widest transition-colors ${pathname === item.href
                                        ? "text-accent"
                                        : "text-white hover:text-accent"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

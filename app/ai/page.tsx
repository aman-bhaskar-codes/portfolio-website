"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    Bot,
    Rocket,
    Globe2,
    FlaskConical,
    Shield,
} from "lucide-react";

// Lazy-load all tab content for performance
const ChatLayout = dynamic(() => import("@/components/ai/ChatLayout"), { ssr: false });
const TwinPage = dynamic(() => import("@/app/twin/page"), { ssr: false });
const CognifyPage = dynamic(() => import("@/app/cognify/page"), { ssr: false });
const UniversePage = dynamic(() => import("@/app/universe/page"), { ssr: false });
const ResearchDashboard = dynamic(() => import("@/components/research/ResearchDashboard"), { ssr: false });
const GovernancePage = dynamic(() => import("@/app/governance/page"), { ssr: false });

const tabs = [
    { id: "chat", label: "AI Chat", icon: MessageSquare, accent: "from-indigo-500 to-purple-600" },
    { id: "twin", label: "Digital Twin", icon: Bot, accent: "from-cyan-500 to-blue-600" },
    { id: "saas", label: "SaaS Platform", icon: Rocket, accent: "from-amber-500 to-orange-600" },
    { id: "universe", label: "Universe (3D)", icon: Globe2, accent: "from-emerald-500 to-teal-600" },
    { id: "research", label: "Research Lab", icon: FlaskConical, accent: "from-rose-500 to-pink-600" },
    { id: "governance", label: "Governance", icon: Shield, accent: "from-violet-500 to-purple-700" },
];

export default function AIHubPage() {
    const [activeTab, setActiveTab] = useState("chat");
    const currentTab = tabs.find((t) => t.id === activeTab)!;

    return (
        <div className="min-h-screen bg-bg-base text-white flex flex-col">
            {/* ─── Tab Bar ─── */}
            <div className="sticky top-0 z-50 pt-[72px]">
                <div className="relative bg-[var(--bg-primary)]/80 backdrop-blur-2xl border-b border-white/[0.06]">
                    {/* Ambient glow behind active tab */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            className={`absolute top-0 h-full w-40 bg-gradient-to-r ${currentTab.accent} opacity-[0.07] blur-3xl`}
                            layoutId="tab-glow"
                            transition={{ type: "spring", damping: 30, stiffness: 200 }}
                        />
                    </div>

                    <nav className="max-w-7xl mx-auto px-4 sm:px-6">
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                const Icon = tab.icon;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            relative flex items-center gap-2.5 px-5 py-3.5 rounded-xl text-xs font-mono uppercase tracking-wider
                                            transition-all duration-300 whitespace-nowrap select-none
                                            ${isActive
                                                ? "text-white"
                                                : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03]"
                                            }
                                        `}
                                    >
                                        <Icon size={15} className={isActive ? "text-[var(--accent-core)]" : ""} />
                                        <span>{tab.label}</span>

                                        {/* Active indicator line */}
                                        {isActive && (
                                            <motion.div
                                                className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-gradient-to-r ${tab.accent}`}
                                                layoutId="ai-tab-indicator"
                                                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                            />
                                        )}

                                        {/* Active glow dot */}
                                        {isActive && (
                                            <motion.div
                                                className="absolute -top-0.5 right-3 w-1.5 h-1.5 rounded-full bg-[var(--accent-core)]"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.1, type: "spring" }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </nav>
                </div>
            </div>

            {/* ─── Tab Content ─── */}
            <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className={activeTab === "chat" ? "h-[calc(100vh-140px)]" : activeTab === "universe" || activeTab === "twin" ? "h-[calc(100vh-140px)]" : "min-h-[calc(100vh-140px)]"}
                    >
                        {activeTab === "chat" && <ChatLayout />}
                        {activeTab === "twin" && <TwinPage />}
                        {activeTab === "saas" && <CognifyPage />}
                        {activeTab === "universe" && <UniversePage />}
                        {activeTab === "research" && (
                            <div className="pt-8 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
                                <ResearchDashboard />
                            </div>
                        )}
                        {activeTab === "governance" && <GovernancePage />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

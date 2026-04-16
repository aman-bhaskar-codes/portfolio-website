"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ExternalLink, Github, Code2, Layers, Cpu,
    Database, Globe, ChevronLeft, ChevronRight
} from "lucide-react";

// ═══════════════════════════════════════════════════════════
// PROJECT DATA
// ═══════════════════════════════════════════════════════════

interface Project {
    id: string;
    title: string;
    tagline: string;
    description: string;
    tech: string[];
    category: "ai" | "fullstack" | "infrastructure" | "research";
    accentColor: string;
    icon: React.ReactNode;
    github?: string;
    demo?: string;
    highlights: string[];
}

const PROJECTS: Project[] = [
    {
        id: "agentic-portfolio",
        title: "Agentic Portfolio",
        tagline: "LangGraph-orchestrated knowledge system",
        description:
            "This website — a production-grade AI portfolio with multi-model orchestration, hybrid RAG, 3-tier memory, and real-time SSE streaming. Handles 10k+ concurrent visitors.",
        tech: ["LangGraph", "FastAPI", "Next.js", "Qdrant", "PostgreSQL", "Redis"],
        category: "ai",
        accentColor: "#6366f1",
        icon: <Cpu className="w-5 h-5" />,
        github: "https://github.com/aman-bhaskar-codes",
        highlights: [
            "HyDE + BM25 + RRF + Cross-encoder RAG pipeline",
            "3-tier MemoryOS (Redis → PostgreSQL → Qdrant)",
            "Intent-routed multi-model orchestration",
        ],
    },
    {
        id: "autoresearch",
        title: "AutoResearch Platform",
        tagline: "Autonomous multi-agent research system",
        description:
            "Multi-agent research platform where Architect, Backend, QA, and Patcher agents collaborate autonomously. Sandboxed Docker execution with zero-trust security perimeter.",
        tech: ["Python", "Celery", "Docker", "Prometheus", "OpenTelemetry"],
        category: "research",
        accentColor: "#10b981",
        icon: <Database className="w-5 h-5" />,
        highlights: [
            "4-agent autonomous coordination",
            "Sandboxed code execution pipeline",
            "Full observability + security hardening",
        ],
    },
    {
        id: "forgeai",
        title: "ForgeAI Engine",
        tagline: "Autonomous code generation & patching",
        description:
            "Self-healing code generation system: Prompt → Plan → Generate → Execute → Patch → Commit. Handles complex multi-file changes with structured LLM orchestration.",
        tech: ["Qwen2.5", "FastAPI", "Docker", "PostgreSQL", "Qdrant"],
        category: "ai",
        accentColor: "#8b5cf6",
        icon: <Code2 className="w-5 h-5" />,
        highlights: [
            "Structured output parsing (JSON-mode)",
            "Persistent vector memory across sessions",
            "Docker sandbox with auto-recovery",
        ],
    },
    {
        id: "enterprise-platform",
        title: "Enterprise AI Platform",
        tagline: "Production multi-tenant AI system",
        description:
            "Full-stack enterprise platform with user auth, admin panel, conversation logging, adaptive behavior modeling, and chain-of-thought reasoning. Built for real users.",
        tech: ["Next.js", "FastAPI", "pgvector", "Clerk", "Tailwind"],
        category: "fullstack",
        accentColor: "#f59e0b",
        icon: <Globe className="w-5 h-5" />,
        highlights: [
            "Multi-tenant architecture with auth",
            "User behavior modeling + analytics",
            "Safe chain-of-thought reasoning",
        ],
    },
    {
        id: "reasoning-eng",
        title: "Reasoning Engineering",
        tagline: "35-day advanced curriculum system",
        description:
            "Comprehensive 35-day reasoning engineering curriculum with 100+ problems: recursive reasoning, constraint propagation, graph-based inference, and meta-cognitive strategies.",
        tech: ["Python", "LaTeX", "PDF Generation"],
        category: "research",
        accentColor: "#ec4899",
        icon: <Layers className="w-5 h-5" />,
        highlights: [
            "100+ structured reasoning problems",
            "Progressive difficulty scaling",
            "Professional PDF curriculum output",
        ],
    },
];

const CATEGORY_LABELS: Record<string, string> = {
    ai: "AI / ML",
    fullstack: "Full Stack",
    infrastructure: "Infrastructure",
    research: "Research",
};

// ═══════════════════════════════════════════════════════════
// PROJECT CARD
// ═══════════════════════════════════════════════════════════

function ProjectCard({
    project,
    isActive,
    onClick,
}: {
    project: Project;
    isActive: boolean;
    onClick: () => void;
}) {
    const cardRef = useRef<HTMLDivElement>(null);

    // 3D tilt on mouse move
    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            cardRef.current.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
        },
        []
    );

    const handleMouseLeave = useCallback(() => {
        if (!cardRef.current) return;
        cardRef.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)";
    }, []);

    return (
        <motion.div
            ref={cardRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="gallery-card cursor-pointer group"
            style={{
                transition: "transform 0.15s ease-out, border-color 0.5s, box-shadow 0.5s",
            }}
        >
            {/* Accent gradient overlay */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${project.accentColor}10, transparent 60%)`,
                }}
            />

            <div className="relative p-7 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border"
                            style={{
                                background: `${project.accentColor}15`,
                                borderColor: `${project.accentColor}25`,
                                color: project.accentColor,
                            }}
                        >
                            {project.icon}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white tracking-tight">
                                {project.title}
                            </h3>
                            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                                {CATEGORY_LABELS[project.category]}
                            </p>
                        </div>
                    </div>

                    {project.github && (
                        <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg bg-white/5 text-white/30 hover:text-white/60 transition-colors"
                        >
                            <Github className="w-4 h-4" />
                        </a>
                    )}
                </div>

                {/* Tagline */}
                <p className="text-sm text-neutral-400 font-light leading-relaxed">
                    {project.tagline}
                </p>

                {/* Tech badges */}
                <div className="flex flex-wrap gap-1.5">
                    {project.tech.slice(0, 5).map((t) => (
                        <span key={t} className="tech-badge">
                            {t}
                        </span>
                    ))}
                    {project.tech.length > 5 && (
                        <span className="tech-badge">+{project.tech.length - 5}</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════
// EXPANDED PROJECT DETAIL
// ═══════════════════════════════════════════════════════════

function ProjectDetail({
    project,
    onClose,
}: {
    project: Project;
    onClose: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" />

            {/* Modal */}
            <motion.div
                initial={{ scale: 0.9, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative glass-panel rounded-[32px] max-w-2xl w-full max-h-[85vh] overflow-y-auto p-10 space-y-8 border border-white/5"
            >
                {/* Accent glow */}
                <div
                    className="absolute top-0 left-0 w-full h-1 rounded-t-[32px]"
                    style={{ background: `linear-gradient(90deg, ${project.accentColor}, transparent)` }}
                />

                {/* Header */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                            style={{
                                background: `${project.accentColor}15`,
                                borderColor: `${project.accentColor}25`,
                                color: project.accentColor,
                            }}
                        >
                            {project.icon}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                {project.title}
                            </h2>
                            <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
                                {project.tagline}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className="text-neutral-300 leading-relaxed text-sm">
                    {project.description}
                </p>

                {/* Highlights */}
                <div className="space-y-3">
                    <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                        Technical Highlights
                    </h4>
                    <ul className="space-y-2">
                        {project.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-neutral-400">
                                <span
                                    className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                                    style={{ background: project.accentColor }}
                                />
                                {h}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Tech stack */}
                <div className="space-y-3">
                    <h4 className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                        Stack
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {project.tech.map((t) => (
                            <span key={t} className="tech-badge">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    {project.github && (
                        <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 hover:bg-white/10 transition-all"
                        >
                            <Github className="w-4 h-4" /> Source Code
                        </a>
                    )}
                    {project.demo && (
                        <a
                            href={project.demo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm text-white font-medium transition-all"
                            style={{ background: project.accentColor }}
                        >
                            <ExternalLink className="w-4 h-4" /> Live Demo
                        </a>
                    )}
                    <button
                        onClick={onClose}
                        className="ml-auto px-5 py-3 rounded-xl bg-white/5 text-sm text-neutral-500 hover:text-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════
// MAIN GALLERY
// ═══════════════════════════════════════════════════════════

export default function VirtualWorkGallery() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("all");

    const filtered =
        filter === "all"
            ? PROJECTS
            : PROJECTS.filter((p) => p.category === filter);

    const selected = PROJECTS.find((p) => p.id === selectedId) || null;

    return (
        <section className="py-32 relative overflow-hidden" id="gallery">
            {/* Background glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--accent-indigo)]/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="text-center space-y-4 mb-16"
                >
                    <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-[var(--accent-indigo)]">
                        Virtual Work Gallery
                    </span>
                    <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white">
                        Systems I've Built
                    </h2>
                    <p className="text-neutral-500 font-light max-w-xl mx-auto">
                        Production-grade AI systems, autonomous platforms, and
                        research engineering projects.
                    </p>
                </motion.div>

                {/* Category filter */}
                <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
                    {["all", "ai", "fullstack", "research"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all ${
                                filter === cat
                                    ? "bg-[var(--accent-indigo)] text-white"
                                    : "bg-white/5 text-neutral-500 hover:text-white hover:bg-white/10 border border-white/5"
                            }`}
                        >
                            {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <motion.div layout className="masonry-grid">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                isActive={selectedId === project.id}
                                onClick={() => setSelectedId(project.id)}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Project detail modal */}
            <AnimatePresence>
                {selected && (
                    <ProjectDetail
                        project={selected}
                        onClose={() => setSelectedId(null)}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}

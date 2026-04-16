"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function FeaturedProjects() {
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/projects")
            .then((res) => res.json())
            .then((data) => {
                // API may return array directly or { projects: [...] }
                const list = Array.isArray(data) ? data : data.projects || [];
                setProjects(list.slice(0, 3));
            })
            .catch((e) => console.error("Failed to fetch projects:", e));
    }, []);

    if (projects.length === 0) return null;

    return (
        <section className="py-24 bg-bg-base" id="projects">
            <div className="product-container max-w-7xl mx-auto space-y-16">

                <div className="flex justify-between items-end border-b border-white/5 pb-8">
                    <div className="space-y-4">
                        <span className="text-xs font-mono text-accent uppercase tracking-widest">
                            // Build Log
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                            Selected Works
                        </h2>
                    </div>
                    <Link
                        href="/projects"
                        className="hidden md:flex items-center gap-2 text-sm font-mono text-neutral-400 hover:text-white transition-colors"
                    >
                        VIEW_ALL_SYSTEMS <ArrowUpRight size={16} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {projects.map((project: any) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="group block"
                        >
                            <article className="h-full bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:bg-white/[0.04] hover:border-accent/20 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between min-h-[300px]">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl font-bold text-white group-hover:bg-accent group-hover:text-black transition-colors">
                                            {project.name?.charAt(0) || "?"}
                                        </div>
                                        <span className="px-3 py-1 rounded-full border border-white/10 text-[10px] font-mono uppercase text-neutral-400">
                                            v1.0
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-bold text-white group-hover:text-accent transition-colors">
                                            {project.name}
                                        </h3>
                                        <p className="text-neutral-400 text-sm leading-relaxed line-clamp-3">
                                            {project.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-2 text-xs font-mono text-neutral-500 group-hover:text-white transition-colors">
                                    <span>READ_CASE_STUDY</span>
                                    <ArrowUpRight size={14} />
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>

                <div className="md:hidden flex justify-center">
                    <Link
                        href="/projects"
                        className="px-8 py-4 bg-white/5 rounded-full text-sm font-bold border border-white/10 hover:bg-white/10 transition-all"
                    >
                        View All Projects
                    </Link>
                </div>
            </div>
        </section>
    );
}

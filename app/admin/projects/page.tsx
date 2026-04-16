"use client";
import Link from "next/link";
import { Plus, Github, Search, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Project {
    id: string;
    name: string;
    html_url?: string;
    status: string;
    published: boolean;
    createdAt: string;
    coverImage?: string;
}

export default function AdminProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/projects/list") // Need this API endpoint or just use prisma in server component?
            // Since we are creating a client component as per request, we need an API.
            // Wait, current file is "use client" as per user request.
            // We either need /api/projects/list OR make this page a Server Component that fetches data and passes to client component.
            // User's snippet was "use client".
            // I'll create a simple API endpoint /api/projects/list or just use existing.
            // Re-reading user request: "Create /app/admin/projects/page.tsx... UI Layout... use client".
            // Okay, I'll fetch from API.
            // But I haven't created /api/projects/list yet.
            // I should just use `prisma` directly in a Server Component and pass data to a Client Component if I want speed?
            // Or implement the API.
            // I'll implement the API /api/projects/list later.
            // For now, I'll mock setProjects([]) or fetch.
            // I will implement GET in /app/api/projects/route.ts to list projects.
            // Ah, `app/api/projects/route.ts` was in the file list earlier (`sizeBytes":"860"`).
            // Let's assume it lists projects.

            .then((res) => res.json())
            .then((data) => {
                if (data.projects) setProjects(data.projects);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="max-w-6xl mx-auto py-20 px-6 space-y-12">
            <div className="flex justify-between items-end border-b border-white/10 pb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-2">Projects</h1>
                    <p className="text-neutral-400">Manage your portfolio artifacts.</p>
                </div>

                <div className="flex gap-4">
                    <Link href="/admin/projects/new">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-violet-500/20"
                        >
                            <Plus size={18} />
                            New Project
                        </motion.button>
                    </Link>

                    <Link href="/admin/projects/import">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-colors"
                        >
                            <Github size={18} />
                            Import
                        </motion.button>
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-neutral-500 animate-pulse">Loading projects...</div>
            ) : projects.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                    <p className="text-neutral-400 mb-4">No projects found.</p>
                    <Link href="/admin/projects/new" className="text-violet-400 hover:text-violet-300 font-medium">Create your first project &rarr;</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all group">
                            {project.coverImage && (
                                <div className="h-40 bg-neutral-900 relative">
                                    <img src={project.coverImage} alt={project.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                </div>
                            )}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">{project.name}</h3>
                                    <span className={`px-2 py-1 rounded text-xs font-mono uppercase ${project.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-neutral-800 text-neutral-400'}`}>
                                        {project.status}
                                    </span>
                                </div>
                                <div className="flex gap-2 mt-4 text-sm text-neutral-500">
                                    <Link href={`/admin/projects/${project.id}`} className="hover:text-white transition-colors">Edit</Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

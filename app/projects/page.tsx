import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AddProjectButton } from "@/components/projects/AddProjectButton";
import { Lock, Github, Cpu, Activity, BrainCircuit } from "lucide-react";
import Container from "@/components/layout/Container";

export const revalidate = 0;

export default async function ProjectsPage() {
    const session = await getServerSession(authOptions);
    const isOwner = (session?.user as any)?.role === "owner";

    // 1. Fetch Standard Projects
    const projects = await prisma.project.findMany({
        where: {
            OR: [
                { published: true },
                ...(isOwner ? [{ status: "draft" }, { published: false }] : [])
            ]
        },
        orderBy: { createdAt: "desc" },
    });

    // 2. Fetch AI-Analyzed GitHub Intelligence
    const githubIntelligence = await prisma.githubProjectIntelligence.findMany({
        orderBy: { updatedAt: "desc" },
    });

    return (
        <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-core-primary)] font-sans pt-24 pb-16 relative">
            <Container>
                <div className="space-y-24">

                    {/* ───────────────────────────────────────────────────────── */}
                    {/* GITHUB AI INTELLIGENCE LAYER                              */}
                    {/* ───────────────────────────────────────────────────────── */}
                    <section>
                        <div className="flex justify-between items-end mb-10 border-b border-white/10 pb-6">
                            <div>
                                <h1 className="text-3xl font-light tracking-tight flex items-center gap-3">
                                    <Cpu className="text-purple-500" size={28} />
                                    Live AI Project Intelligence
                                </h1>
                                <p className="text-neutral-400 text-sm mt-3 ml-10">
                                    Real-time autonomous analysis of GitHub repositories by the Digital Twin.
                                </p>
                            </div>
                            <div className="text-[10px] uppercase font-mono tracking-widest text-emerald-500 flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 rounded-full">
                                <Activity size={12} className="animate-pulse" />
                                Live Sync Active
                            </div>
                        </div>

                        {githubIntelligence.length === 0 ? (
                            <div className="p-12 text-center text-neutral-600 border border-dashed border-white/10 rounded-2xl font-mono text-xs uppercase tracking-widest">
                                No GitHub intelligence found. (Run the sync job)
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                {githubIntelligence.map((repo: any) => (
                                    <div key={repo.id} className="p-8 bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors rounded-xl relative overflow-hidden group">
                                        {/* Repo Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <h2 className="text-xl font-medium tracking-tight flex items-center gap-2">
                                                <Github size={18} className="text-neutral-500" />
                                                {repo.repoName}
                                            </h2>
                                            <div className="text-[10px] uppercase font-mono tracking-widest text-neutral-500">
                                                Complexity: {(repo.complexityScore * 100).toFixed(0)}%
                                            </div>
                                        </div>

                                        {/* Architecture Summary */}
                                        <p className="text-sm font-light text-neutral-300 leading-relaxed mb-6">
                                            {repo.architectureSummary}
                                        </p>

                                        {/* Stack */}
                                        {Array.isArray(repo.detectedStack) && repo.detectedStack.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {(repo.detectedStack as string[]).slice(0, 4).map((tech, i) => (
                                                    <span key={i} className="text-[10px] px-2 py-1 bg-white/5 text-neutral-400 rounded-md border border-white/5">
                                                        {tech}
                                                    </span>
                                                ))}
                                                {(repo.detectedStack as string[]).length > 4 && (
                                                    <span className="text-[10px] px-2 py-1 text-neutral-500">
                                                        +{(repo.detectedStack as string[]).length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* AI Insight (Twin Commentary) */}
                                        <div className="mt-auto p-4 bg-purple-500/5 border border-purple-500/10 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2 text-purple-400 text-[10px] uppercase tracking-widest font-bold">
                                                <BrainCircuit size={12} />
                                                Twin Insight
                                            </div>
                                            <p className="text-purple-200/80 text-xs leading-relaxed italic">
                                                "{repo.aiInsight}"
                                            </p>
                                        </div>

                                        {/* Visual Complexity Bar inside Card */}
                                        <div className="absolute bottom-0 left-0 h-1 bg-purple-500/20 w-full">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
                                                style={{ width: `${repo.complexityScore * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>


                    {/* ───────────────────────────────────────────────────────── */}
                    {/* STANDARD CURATED PORTFOLIO                                */}
                    {/* ───────────────────────────────────────────────────────── */}
                    <section>
                        <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
                            <h2 className="text-2xl font-light tracking-tight">Curated Projects</h2>
                            {isOwner && (
                                <div className="text-[10px] text-neutral-500 font-mono border border-neutral-800 px-3 py-1 rounded-full flex items-center gap-2">
                                    <Lock size={10} /> OWNER MODE
                                </div>
                            )}
                        </div>

                        {projects.length === 0 && (
                            <div className="p-12 text-center text-neutral-600 border border-dashed border-white/10 rounded-2xl font-mono text-xs uppercase tracking-widest">
                                No curated projects found.
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {projects.map((project: any) => (
                                <a
                                    key={project.id}
                                    href={isOwner ? `/projects/${project.id}/edit` : project.githubUrl || "#"}
                                    target={isOwner ? "_self" : "_blank"}
                                    rel="noopener noreferrer"
                                    className={`block p-6 bg-white/[0.02] border border-white/[0.05] rounded-xl transition-all duration-300 hover:border-white/20 group relative overflow-hidden ${!project.published ? 'opacity-75 border-dashed border-yellow-500/20' : ''}`}
                                >
                                    {!project.published && isOwner && (
                                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase rounded tracking-wider">
                                            Draft
                                        </div>
                                    )}
                                    <h3 className="text-lg font-medium mb-3 group-hover:text-white transition-colors text-neutral-200">
                                        {project.name}
                                    </h3>
                                    <p className="text-xs text-neutral-400 leading-relaxed mb-4 line-clamp-3 font-light">
                                        {project.description || project.summary || "No description."}
                                    </p>
                                    {project.language && (
                                        <span className="text-[10px] px-2 py-1 bg-white/5 border border-white/5 rounded text-neutral-400">
                                            {project.language}
                                        </span>
                                    )}
                                </a>
                            ))}
                        </div>
                    </section>

                </div>
                {isOwner && <AddProjectButton />}
            </Container>
        </main>
    );
}

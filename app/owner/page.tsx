import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import OwnerControlPanel from "@/components/owner/OwnerControlPanel";
import { Activity, ShieldAlert, GitBranch, Key } from "lucide-react";

export const revalidate = 0;

export default async function OwnerDashboardPage() {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (role !== "owner") {
        redirect("/");
    }

    const tenantUsage = await prisma.tenantUsage.findFirst({
        orderBy: { updatedAt: "desc" }
    });

    const recentAutonomyLogs = await prisma.toolExecution.findMany({
        orderBy: { createdAt: "desc" },
        take: 5
    });

    return (
        <div className="min-h-screen bg-black text-white px-6 py-24 md:px-12 font-sans relative">
            <div className="fixed top-24 right-8 z-50 flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full font-bold">
                <ShieldAlert size={12} className="animate-pulse" />
                Owner Security Clearance
            </div>

            <div className="max-w-6xl mx-auto space-y-12">
                <section>
                    <h1 className="text-4xl font-light tracking-tight mb-4 text-red-50">
                        System Control Console
                    </h1>
                    <p className="text-neutral-400 max-w-2xl font-light leading-relaxed">
                        Full administrative access to the Cognitive Architecture, tool sandboxes, and distributed intelligence swarm.
                    </p>
                </section>

                <OwnerControlPanel />

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Autonomy Logs */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                        <h3 className="text-sm font-mono uppercase tracking-widest text-neutral-500 mb-6 flex items-center gap-2">
                            <Activity size={14} />
                            Recent Tool Autonomy
                        </h3>
                        <div className="space-y-4">
                            {recentAutonomyLogs.length === 0 ? (
                                <div className="text-xs text-neutral-600 font-mono">No recent autonomous actions.</div>
                            ) : (
                                recentAutonomyLogs.map((log: any) => (
                                    <div key={log.id} className="flex justify-between items-center border-b border-white/5 pb-3">
                                        <div>
                                            <div className="text-sm font-mono text-neutral-300">{log.toolName}</div>
                                            <div className="text-[10px] text-neutral-500 mt-1 flex items-center gap-2">
                                                <Key size={10} />
                                                Approved by {log.approvedByTwin}
                                            </div>
                                        </div>
                                        <div className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${log.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                                            {log.status}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* SaaS Metering Quick View */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
                        <h3 className="text-sm font-mono uppercase tracking-widest text-neutral-500 mb-6 flex items-center gap-2">
                            <GitBranch size={14} />
                            Global SaaS Metering
                        </h3>
                        {tenantUsage ? (
                            <div className="space-y-4 font-mono text-sm">
                                <div className="flex justify-between text-neutral-400">
                                    <span>Tokens Consumed</span>
                                    <span className="text-white">{tenantUsage.tokensUsed.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-neutral-400">
                                    <span>LLM Invocations</span>
                                    <span className="text-white">{tenantUsage.llmCalls.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-neutral-400">
                                    <span>Swarm Debates</span>
                                    <span className="text-white">{tenantUsage.debateRuns.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-neutral-400 pt-4 border-t border-white/5">
                                    <span>Est. Cloud Cost</span>
                                    <span className="text-red-400">${tenantUsage.totalCost.toFixed(2)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-neutral-600 font-mono">No active usage periods.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

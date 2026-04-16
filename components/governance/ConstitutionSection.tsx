"use client";

import { motion } from "framer-motion";

export default function ConstitutionSection() {
    const sections = [
        {
            title: "Core Identity Invariants",
            content: [
                "The system prioritizes architectural clarity over verbosity.",
                "Identity consistency is preserved across sessions.",
                "No modification of core identity principles is allowed autonomously.",
                "The system operates under structured reasoning protocols."
            ]
        },
        {
            title: "Reward Alignment Principles",
            content: [
                "Reward is tied to reasoning depth, alignment, and hallucination minimization.",
                "Short-term gains cannot override long-term system stability.",
                "Reward coefficients are protected from autonomous mutation.",
                "Offline validation precedes any reinforcement update."
            ]
        },
        {
            title: "Autonomy Boundaries",
            content: [
                "Autonomous goal formation is bounded by predefined action space.",
                "World-model simulations precede structural changes.",
                "High-risk actions require multi-agent consensus.",
                "Cooldown periods prevent runaway autonomy cycles."
            ]
        },
        {
            title: "Tool Execution Constraints",
            content: [
                "All tool actions execute in sandboxed environments.",
                "Code modifications require diff validation.",
                "Automated tests must pass before commit.",
                "Rollback snapshots are mandatory."
            ]
        },
        {
            title: "Memory & Drift Safeguards",
            content: [
                "Memory clusters are decay-regulated to prevent dominance bias.",
                "Cognitive drift is continuously monitored.",
                "Identity alignment metrics are tracked longitudinally.",
                "Adversarial offline evaluation guards against reward hacking."
            ]
        },
        {
            title: "Swarm Governance Rules",
            content: [
                "No single twin may dominate decision-making.",
                "Skeptic and Safety twins retain veto power in high-risk scenarios.",
                "Consensus weighting adapts based on historical performance.",
                "Meta Twin arbitrates final output synthesis."
            ]
        },
        {
            title: "Transparency & Observability",
            content: [
                "All major decisions are logged and traceable.",
                "Reward trends are visible.",
                "Experiment results are documented.",
                "Internal reasoning health metrics are monitored."
            ]
        },
        {
            title: "System Evolution",
            content: [
                "Improvements require measurable validation.",
                "Structural changes must pass sandbox evaluation.",
                "The system evolves incrementally, not destructively.",
                "Alignment precedes optimization."
            ]
        }
    ];

    return (
        <div className="space-y-16 relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[27px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-purple-500/50 via-white/10 to-transparent hidden md:block" />

            {sections.map((section, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="relative md:pl-20"
                >
                    {/* Node indicator */}
                    <div className="absolute left-[24px] top-3 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] hidden md:block" />

                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 group">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-xl font-mono text-purple-400 opacity-50 font-light group-hover:opacity-100 transition-opacity">
                                0{index + 1}
                            </span>
                            <h2 className="text-2xl font-light tracking-wide text-neutral-100">
                                {section.title}
                            </h2>
                        </div>

                        <ul className="space-y-4">
                            {section.content.map((item, i) => (
                                <li key={i} className="flex gap-4 text-neutral-400 font-light leading-relaxed">
                                    <span className="text-purple-500/50 mt-1.5 text-xs">◆</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

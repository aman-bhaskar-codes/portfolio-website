/**
 * Demo State Machine — Structured Demo Tour Sequence
 *
 * Each step has a type, section ID for navigation,
 * and a narration prompt for the AI.
 */

export interface DemoStep {
    type: string;
    sectionId: string | null;
    narrationPrompt: string;
    duration: number; // ms to wait after speaking
}

export const demoSequence: DemoStep[] = [
    {
        type: "intro",
        sectionId: null,
        narrationPrompt:
            "Give a 3 sentence introduction of this AI portfolio system. Mention that it uses advanced RAG, self-healing retrieval, and auto-updates from GitHub. Be welcoming and confident.",
        duration: 8000,
    },
    {
        type: "architecture",
        sectionId: "architecture",
        narrationPrompt:
            "Explain the backend architecture in 4 sentences. Cover the RAG pipeline stages, the self-healing retry logic, and how context is compressed for the small language model. Be technical but accessible.",
        duration: 10000,
    },
    {
        type: "projects",
        sectionId: "projects",
        narrationPrompt:
            "Summarize the key projects in this portfolio in 3 sentences. Mention the types of technologies used and what makes them interesting. Sound proud but factual.",
        duration: 8000,
    },
    {
        type: "github",
        sectionId: "github",
        narrationPrompt:
            "Explain how the GitHub auto-sync system works in 3 sentences. Mention incremental sync, automatic summarization, and how RAG stays always up to date. Be concise.",
        duration: 8000,
    },
    {
        type: "invite",
        sectionId: null,
        narrationPrompt:
            "In 2 sentences, invite the visitor to ask any technical question about the projects, architecture, or the developer. Be warm and encouraging.",
        duration: 5000,
    },
];

export type DemoState = "idle" | "running" | "paused" | "finished";

export type RAGResult = {
    id: string;
    title: string;
    content: string;
    similarity: number;
    source: "Project" | "Memory" | "GitHub" | "Note" | "Knowledge";
    category?: string;
    importance?: number;
};

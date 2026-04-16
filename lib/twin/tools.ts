import { retrieveContext } from "@/lib/services/rag.service";
import { graphAwareRAG } from "@/lib/agent/graph-rag-orchestrator";
import { embedQuery } from "@/lib/services/embedding.service";
import prisma from "@/lib/prisma";

export const TOOLS = [
    {
        name: "retrieve_knowledge",
        description: "Fetch relevant knowledge using Graph-Aware RAG. Use this to understand concepts, projects, or research.",
        parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
    },
    {
        name: "save_memory",
        description: "Store a new long-term memory, observation, or decision.",
        parameters: {
            type: "object",
            properties: {
                content: { type: "string" },
                type: { type: "string", enum: ["observation", "decision", "reflection"] }
            },
            required: ["content", "type"]
        }
    },
    {
        name: "search_projects",
        description: "Find projects by search term.",
        parameters: { type: "object", properties: { term: { type: "string" } }, required: ["term"] }
    },
    {
        name: "plan_task",
        description: "Break down a complex objective into steps.",
        parameters: { type: "object", properties: { goal: { type: "string" } }, required: ["goal"] }
    }
];

export async function executeTool(name: string, args: any) {
    switch (name) {
        case "retrieve_knowledge":
            const ragResult = await graphAwareRAG(args.query);
            return typeof ragResult === 'string' ? ragResult : ragResult.answer;

        case "save_memory":
            const { content, type } = args;
            const embedding = await embedQuery(content);

            const embeddingStr = `[${embedding.join(',')}]`;
            await prisma.$executeRawUnsafe(`
                INSERT INTO "TwinMemory" ("id", "content", "type", "embedding", "importance", "createdAt")
                VALUES (gen_random_uuid(), $1, $2, $3::vector, 1.0, NOW())
            `, content, type, embeddingStr);
            return "Memory saved.";

        case "search_projects":
            const projects = await prisma.project.findMany({
                where: {
                    OR: [
                        { name: { contains: args.term, mode: 'insensitive' } },
                        { description: { contains: args.term, mode: 'insensitive' } }
                    ]
                },
                take: 5
            });
            return JSON.stringify(projects.map(p => ({ name: p.name, slug: p.slug })));

        default:
            return "Tool not found.";
    }
}

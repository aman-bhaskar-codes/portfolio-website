
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const projects = [
        {
            name: "Cortex_V1",
            description: "Autonomous cognitive architecture capable of self-correcting RAG pipelines and multi-step reasoning.",
            githubUrl: "https://github.com/aman-bhaskar/cortex-v1",
            tags: ["TypeScript", "RAG", "VectorDB"],
            published: true,
            stars: 128,
        },
        {
            name: "Neon_Voice",
            description: "Real-time voice synthesis engine optimized for sub-100ms latency on edge devices.",
            githubUrl: "https://github.com/aman-bhaskar/neon-voice",
            tags: ["Python", "Audio", "Edge"],
            published: true,
            stars: 84,
        },
        {
            name: "Hyper_Graph",
            description: "3D visualization systems for knowledge graph relationships and semantic clustering.",
            githubUrl: "https://github.com/aman-bhaskar/hyper-graph",
            tags: ["Three.js", "WebGL", "React"],
            published: true,
            stars: 256,
        }
    ];

    for (const p of projects) {
        await prisma.project.upsert({
            where: { githubUrl: p.githubUrl },
            update: {},
            create: p,
        });
    }
    console.log("Seeding complete: 3 projects analyzed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

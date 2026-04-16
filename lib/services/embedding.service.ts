import { createEmbedding } from "@/lib/embeddings";

export async function embedQuery(query: string): Promise<number[]> {
    // Wrapper around the existing embedding function
    // ensuring consistency across the app
    const embedding = await createEmbedding(query);
    return embedding;
}

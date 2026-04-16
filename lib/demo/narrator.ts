/**
 * AI Narration Engine — RAG-Backed Dynamic Narration
 *
 * Uses demo-mode (non-streaming) for clean, fast responses.
 * Generates narration from the chat API so demo content
 * is always current with the latest knowledge.
 */

/**
 * Generates narration for a demo step by calling the chat API in demo mode.
 * Returns cleaned text suitable for TTS.
 */
export async function generateNarration(prompt: string): Promise<string> {
    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-demo-mode": "true",  // Non-streaming response
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            }),
            signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
            throw new Error(`Narration API failed: ${res.status}`);
        }

        const data = await res.json();
        const text = data.content || "";

        if (!text.trim()) {
            return "Let me continue with the tour.";
        }

        // Clean for TTS — remove markdown, keep only readable text
        const cleaned = cleanForTTS(text);

        // Limit to first 4 sentences for concise narration
        const sentences = cleaned.split(/(?<=[.!?])\s+/).slice(0, 4).join(" ");
        return sentences || cleaned;

    } catch (error) {
        console.error("[NARRATOR] Generation failed:", error);
        return "I'm having trouble generating narration right now. Let me continue with the tour.";
    }
}

/**
 * Strips markdown formatting for clean TTS output.
 */
function cleanForTTS(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, "$1")    // Remove bold
        .replace(/\*(.*?)\*/g, "$1")         // Remove italic
        .replace(/#{1,6}\s/g, "")            // Remove headings
        .replace(/`(.*?)`/g, "$1")           // Remove inline code
        .replace(/```[\s\S]*?```/g, "")      // Remove code blocks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links → text only
        .replace(/[•\-]\s/g, "")             // Remove bullet points
        .replace(/\n{2,}/g, ". ")            // Double newlines → period
        .replace(/\n/g, " ")                 // Single newlines → space
        .replace(/\s{2,}/g, " ")             // Collapse spaces
        .trim();
}
